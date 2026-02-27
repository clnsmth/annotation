import { AnnotatableElement, AnnotationStatus, OntologyTerm } from '../types';

/**
 * A simplified EML parser that runs in the browser using DOMParser.
 * It extracts Data Table Attributes and Dataset level info as targets for annotation.
 */
export class EmlParser {
  private parser: DOMParser;
  private serializer: XMLSerializer;

  constructor() {
    this.parser = new DOMParser();
    this.serializer = new XMLSerializer();
  }

  /**
   * Helper to parse a single <annotation> element.
   */
  private parseSingleAnnotation(annotationNode: Element): OntologyTerm | null {
      const valueUriNode = annotationNode.querySelector("valueURI");
      const propertyUriNode = annotationNode.querySelector("propertyURI");
      
      if (valueUriNode) {
          const label = valueUriNode.getAttribute("label") || "";
          const uri = valueUriNode.textContent?.trim() || "";
          
          // Extract property info, default to 'contains' if missing
          const propertyLabel = propertyUriNode?.getAttribute("label") || "contains";
          const propertyUri = propertyUriNode?.textContent?.trim() || "http://www.w3.org/ns/oa#hasBody";

          if (uri) {
              // Basic ontology inference for display purposes
              let ontology = 'Existing';
              if (uri.includes('ENVO')) ontology = 'ENVO';
              else if (uri.includes('ECSO')) ontology = 'ECSO';
              else if (uri.includes('PATO')) ontology = 'PATO';
              else if (uri.includes('qudt')) ontology = 'QUDT';
              else if (uri.includes('dwc') || uri.includes('darwin')) ontology = 'DWC';

              return {
                  label,
                  uri,
                  ontology,
                  confidence: 1.0,
                  propertyLabel,
                  propertyUri
              };
          }
      }
      return null;
  }

  /**
   * Helper to parse existing annotations from a given XML node (direct children).
   */
  private parseChildAnnotations(node: Element): OntologyTerm[] {
    const existingAnnotations: OntologyTerm[] = [];
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.tagName === 'annotation') {
            const term = this.parseSingleAnnotation(child);
            if (term) existingAnnotations.push(term);
        }
    }
    return existingAnnotations;
  }

  /**
   * Helper to parse detached annotations from <annotations> block.
   * Returns a map of referencesID -> OntologyTerm[]
   */
  private parseDetachedAnnotations(xmlDoc: Document): Map<string, OntologyTerm[]> {
      const map = new Map<string, OntologyTerm[]>();
      const annotationsBlock = xmlDoc.querySelector("annotations");
      if (!annotationsBlock) return map;

      const annotations = annotationsBlock.querySelectorAll("annotation");
      annotations.forEach(anno => {
          const ref = anno.getAttribute("references");
          if (ref) {
              const term = this.parseSingleAnnotation(anno);
              if (term) {
                  const existing = map.get(ref) || [];
                  map.set(ref, [...existing, term]);
              }
          }
      });
      return map;
  }

  private generateUUID(): string {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
      }
      return 'elem-' + Math.random().toString(36).substr(2, 9);
  }

  parse(xmlString: string): AnnotatableElement[] {
    const xmlDoc = this.parser.parseFromString(xmlString, "text/xml");
    
    // Check for XML parse errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
        throw new Error("Invalid XML file format.");
    }

    const root = xmlDoc.documentElement;
    // Combine namespace and schema location attributes to check for version strings
    const versionContext = (root.getAttribute("xmlns:eml") || "") + 
                           (root.getAttribute("xsi:schemaLocation") || "") + 
                           (root.getAttributeNS("http://www.w3.org/2001/XMLSchema-instance", "schemaLocation") || "");

    // Logic to enforce EML 2.2.0+
    const versionMatch = versionContext.match(/eml-2\.(\d+)\.(\d+)/);
    
    if (versionMatch) {
        const minorVersion = parseInt(versionMatch[1]);
        if (minorVersion < 2) {
            throw new Error(`EML version 2.${minorVersion} detected. This application only supports EML 2.2.0 or later.`);
        }
    } else {
        // Strict Fallback
        if (versionContext.includes("eml-2.1")) {
             throw new Error("EML 2.1 detected. This application only supports EML 2.2.0 or later.");
        }
    }

    const elements: AnnotatableElement[] = [];
    const detachedAnnotationsMap = this.parseDetachedAnnotations(xmlDoc);

    // Helper to get text content safely
    const getText = (node: Element, tag: string): string => {
      const child = node.querySelector(tag);
      return child ? child.textContent?.trim() || '' : '';
    };

    // 0. Parse Dataset Level
    const datasetNode = xmlDoc.querySelector("dataset");
    if (datasetNode) {
        const title = getText(datasetNode, "title");
        const abstract = getText(datasetNode, "abstract");
        const datasetAnnotations = this.parseChildAnnotations(datasetNode);

        elements.push({
            id: 'dataset-top-level',
            path: 'dataset',
            context: 'Dataset Level',
            contextDescription: 'Annotations that apply to the entire dataset',
            name: title || 'Dataset',
            description: abstract || 'No abstract provided',
            type: 'DATASET',
            currentAnnotations: datasetAnnotations,
            recommendedAnnotations: [], 
            status: datasetAnnotations.length > 0 ? AnnotationStatus.APPROVED : AnnotationStatus.PENDING,
            originalXmlNode: datasetNode
        });
    }

    // 1. Parse Entities (dataTable, otherEntity, spatialRaster, spatialVector)
    const entityTypes: { tag: string, type: AnnotatableElement['type'], label: string }[] = [
        { tag: 'dataTable', type: 'DATATABLE', label: 'Data Table Entity' },
        { tag: 'otherEntity', type: 'OTHERENTITY', label: 'Other Entity' },
        { tag: 'spatialRaster', type: 'SPATIALRASTER', label: 'Spatial Raster Entity' },
        { tag: 'spatialVector', type: 'SPATIALVECTOR', label: 'Spatial Vector Entity' }
    ];

    entityTypes.forEach(config => {
        const entities = xmlDoc.querySelectorAll(config.tag);
        entities.forEach((entity, entityIndex) => {
            const entityName = getText(entity, "entityName") || `${config.label} ${entityIndex + 1}`;
            const entityDescription = getText(entity, "entityDescription");
            const entityId = entity.getAttribute("id") || `${config.tag}-${entityIndex}`;
            
            // Extract objectName (usually inside <physical><objectName>)
            const objectName = getText(entity, "physical objectName");

            // 1a. The Entity itself
            const entityAnnotations = this.parseChildAnnotations(entity);
            elements.push({
                id: entityId,
                path: `dataset/${config.tag}[${entityIndex}]`,
                context: entityName,
                contextDescription: entityDescription,
                objectName: objectName, // Include objectName if found
                name: entityName,
                description: entityDescription || config.label,
                type: config.type,
                currentAnnotations: entityAnnotations,
                recommendedAnnotations: [],
                status: entityAnnotations.length > 0 ? AnnotationStatus.APPROVED : AnnotationStatus.PENDING,
                originalXmlNode: entity
            });

            // 1b. The Attributes
            const attributeList = entity.querySelectorAll("attributeList attribute");
            attributeList.forEach((attr, attrIndex) => {
                const name = getText(attr, "attributeName");
                const definition = getText(attr, "attributeDefinition");
                const attrId = attr.getAttribute("id") || `${config.tag}-attr-${entityIndex}-${attrIndex}`;

                const existingAnnotations = this.parseChildAnnotations(attr);

                elements.push({
                    id: attrId,
                    path: `dataset/${config.tag}[${entityIndex}]/attributeList/attribute[${attrIndex}]`,
                    context: entityName,
                    contextDescription: entityDescription,
                    objectName: objectName, // Attributes belong to the entity's object
                    name: name,
                    description: definition,
                    type: 'ATTRIBUTE',
                    currentAnnotations: existingAnnotations,
                    recommendedAnnotations: [],
                    status: existingAnnotations.length > 0 ? AnnotationStatus.APPROVED : AnnotationStatus.PENDING,
                    originalXmlNode: attr
                });
            });
        });
    });

    // 2. Parse Geographic Coverage
    const geoCoverages = xmlDoc.querySelectorAll("geographicCoverage");
    geoCoverages.forEach((geo, index) => {
        const desc = getText(geo, "geographicDescription");
        let geoId = geo.getAttribute("id");
        
        if (!geoId) {
            geoId = this.generateUUID();
        }

        const directAnnotations = this.parseChildAnnotations(geo);
        const detachedAnnotations = detachedAnnotationsMap.get(geoId) || [];
        const combinedAnnotations = [...directAnnotations, ...detachedAnnotations];

        elements.push({
            id: geoId,
            path: `dataset/coverage/geographicCoverage[${index}]`,
            context: 'Geographic Coverage',
            name: 'Location',
            description: desc,
            type: 'COVERAGE',
            currentAnnotations: combinedAnnotations,
            recommendedAnnotations: [],
            status: combinedAnnotations.length > 0 ? AnnotationStatus.APPROVED : AnnotationStatus.PENDING,
            originalXmlNode: geo
        });
    });

    return elements;
  }

  /**
   * Reconstructs the XML string by injecting annotations into the DOM.
   */
  exportXml(originalXml: string, elements: AnnotatableElement[]): string {
    const xmlDoc = this.parser.parseFromString(originalXml, "text/xml");

    // Helper to inject child annotations
    const injectChild = (node: Element, model: AnnotatableElement) => {
        // 1. Remove old annotations (direct children only)
        for (let i = node.children.length - 1; i >= 0; i--) {
            if (node.children[i].tagName === 'annotation') {
                node.removeChild(node.children[i]);
            }
        }

        // 2. Determine insertion point
        let refNode: Node | null = null;
        
        if (model.type === 'DATASET') {
            const coverage = node.querySelector("coverage");
            if (coverage) {
                refNode = coverage.nextSibling;
            } else {
                refNode = node.querySelector("purpose, maintenance, contact, publisher, pubPlace, methods, project, dataTable, otherEntity, spatialRaster, spatialVector");
            }
        } else if (['DATATABLE', 'OTHERENTITY', 'SPATIALRASTER', 'SPATIALVECTOR'].includes(model.type)) {
            // Requirement: Insert annotations before attributeList or after physical if no attributeList
            refNode = node.querySelector("attributeList");
            if (!refNode) {
                refNode = node.querySelector("constraint, spatialReference, geospatial, geometry");
            }
        } else if (model.type === 'ATTRIBUTE') {
            refNode = null; 
        }

        // 3. Add new annotations
        model.currentAnnotations.forEach(anno => {
            const annotationNode = xmlDoc.createElement("annotation");
            
            const valueUri = xmlDoc.createElement("valueURI");
            valueUri.setAttribute("label", anno.label);
            valueUri.textContent = anno.uri;
            
            const propertyUri = xmlDoc.createElement("propertyURI");
            propertyUri.setAttribute("label", anno.propertyLabel || "contains");
            propertyUri.textContent = anno.propertyUri || "http://www.w3.org/ns/oa#hasBody";

            annotationNode.appendChild(propertyUri);
            annotationNode.appendChild(valueUri);
            
            if (refNode) {
                node.insertBefore(annotationNode, refNode);
            } else {
                node.appendChild(annotationNode);
            }
        });
    };

    // 1. Export Dataset Level Annotations
    const datasetNode = xmlDoc.querySelector("dataset");
    const datasetModel = elements.find(e => e.type === 'DATASET');
    if (datasetNode && datasetModel) {
        injectChild(datasetNode, datasetModel);
    }

    // 2. Export Entities (dataTable, otherEntity, spatialRaster, spatialVector)
    const entityConfigs: { tag: string, type: AnnotatableElement['type'] }[] = [
        { tag: 'dataTable', type: 'DATATABLE' },
        { tag: 'otherEntity', type: 'OTHERENTITY' },
        { tag: 'spatialRaster', type: 'SPATIALRASTER' },
        { tag: 'spatialVector', type: 'SPATIALVECTOR' }
    ];

    entityConfigs.forEach(config => {
        const entities = xmlDoc.querySelectorAll(config.tag);
        entities.forEach((entity) => {
            // 2a. Inject Entity Annotations
            const entityId = entity.getAttribute("id");
            let entityModel = entityId ? elements.find(e => e.id === entityId && e.type === config.type) : undefined;
            
            if (!entityModel) {
                const entityName = entity.querySelector("entityName")?.textContent?.trim();
                entityModel = elements.find(e => e.name === entityName && e.type === config.type);
            }
            if (entityModel) injectChild(entity, entityModel);

            // 2b. Inject Attribute Annotations
            const attributeList = entity.querySelectorAll("attributeList attribute");
            attributeList.forEach((attr) => {
                const attrId = attr.getAttribute("id");
                let model = attrId ? elements.find(e => e.id === attrId) : undefined;
                if (!model) {
                    const name = attr.querySelector("attributeName")?.textContent?.trim();
                    const context = entity.querySelector("entityName")?.textContent?.trim() || "";
                    model = elements.find(e => e.name === name && e.context === context && e.type === 'ATTRIBUTE');
                }
                if (model) injectChild(attr, model);
            });
        });
    });

    // 4. Export Geographic Coverage Annotations (Detached Reference Style)
    const geoElements = elements.filter(e => e.type === 'COVERAGE');
    const allGeoNodes = xmlDoc.querySelectorAll("geographicCoverage");
    
    if (geoElements.length > 0) {
        // Find or create <annotations> element
        let annotationsElem = xmlDoc.querySelector("annotations");
        if (!annotationsElem) {
            annotationsElem = xmlDoc.createElement("annotations");
            // Insert after dataset, before additionalMetadata
            const dataset = xmlDoc.querySelector("dataset");
            const additionalMetadata = xmlDoc.querySelector("additionalMetadata");
            
            if (additionalMetadata) {
                xmlDoc.documentElement.insertBefore(annotationsElem, additionalMetadata);
            } else if (dataset && dataset.nextSibling) {
                xmlDoc.documentElement.insertBefore(annotationsElem, dataset.nextSibling);
            } else {
                xmlDoc.documentElement.appendChild(annotationsElem);
            }
        }

        // Process each coverage element
        geoElements.forEach((el, index) => {
            // Find corresponding XML node (assuming order preserved from parse)
            const geoNode = allGeoNodes[index];
            if (!geoNode) return;

            // Ensure XML node has the ID we are tracking
            let targetId = geoNode.getAttribute("id");
            if (!targetId || targetId !== el.id) {
                targetId = el.id;
                geoNode.setAttribute("id", targetId);
            }

            // Remove existing annotation in <annotations> that references this targetId
            const existingRefs = annotationsElem!.querySelectorAll(`annotation[references="${targetId}"]`);
            existingRefs.forEach(ref => annotationsElem!.removeChild(ref));

            // Add new annotations
            el.currentAnnotations.forEach(anno => {
                const annotationNode = xmlDoc.createElement("annotation");
                annotationNode.setAttribute("references", targetId!);

                const propertyUri = xmlDoc.createElement("propertyURI");
                propertyUri.setAttribute("label", anno.propertyLabel || "contains");
                propertyUri.textContent = anno.propertyUri || "http://www.w3.org/ns/oa#hasBody";

                const valueUri = xmlDoc.createElement("valueURI");
                valueUri.setAttribute("label", anno.label);
                valueUri.textContent = anno.uri;

                annotationNode.appendChild(propertyUri);
                annotationNode.appendChild(valueUri);
                
                annotationsElem!.appendChild(annotationNode);
            });
        });

        // Cleanup: If annotations element is empty, remove it from DOM
        if (annotationsElem && annotationsElem.children.length === 0) {
             if (annotationsElem.parentNode) {
                 annotationsElem.parentNode.removeChild(annotationsElem);
             }
        }
    }

    const rawXml = this.serializer.serializeToString(xmlDoc);
    return this.formatXml(rawXml);
  }

  /**
   * Formats the XML string to be human-readable with indentation.
   */
  private formatXml(xml: string): string {
    let formatted = '';
    let indent = 0;
    const tab = '  ';
    const normalized = xml.replace(/>\s+</g, '><').trim();
    const tokens = normalized.split(/(<[^>]+>)/g).filter(s => s.length > 0);
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.match(/^<\//)) {
            indent--;
            const prev = tokens[i-1];
            if (prev && !prev.match(/^<[^>]+>/)) {
                formatted += token;
            } else {
                formatted += '\n' + tab.repeat(Math.max(0, indent)) + token;
            }
        } else if (token.match(/^<.*\/>/) || token.match(/^<!/) || token.match(/^<\?/)) {
            formatted += '\n' + tab.repeat(Math.max(0, indent)) + token;
        } else if (token.match(/^<[^>]+>/)) {
            formatted += '\n' + tab.repeat(Math.max(0, indent)) + token;
            indent++;
        } else {
            const text = token.trim();
            if (text) {
                formatted += text;
            }
        }
    }
    return formatted.trim();
  }
}

export const emlParser = new EmlParser();