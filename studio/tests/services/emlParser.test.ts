import { describe, it, expect } from 'vitest';
import { emlParser } from '../../src/services/emlParser';
import { AnnotationStatus } from '../../src/types';

describe('EmlParser Service', () => {

    const validEml220 = `<?xml version="1.0" encoding="UTF-8"?>
<eml:eml xmlns:eml="https://eml.ecoinformatics.org/eml-2.2.0">
  <dataset>
    <title>Test Dataset</title>
    <abstract>This is a test abstract</abstract>
    <dataTable id="dt-1">
      <entityName>table.csv</entityName>
      <physical>
        <objectName>table.csv</objectName>
      </physical>
      <attributeList>
        <attribute id="attr-1">
          <attributeName>temp</attributeName>
          <attributeDefinition>temperature</attributeDefinition>
        </attribute>
      </attributeList>
    </dataTable>
  </dataset>
</eml:eml>`;

    const invalidEml210 = `<?xml version="1.0" encoding="UTF-8"?>
<eml:eml xmlns:eml="eml://ecoinformatics.org/eml-2.1.1">
  <dataset><title>Old Dataset</title></dataset>
</eml:eml>`;

    it('rejects EML versions older than 2.2.0', () => {
        expect(() => emlParser.parse(invalidEml210))
            .toThrow(/EML 2\.1 detected|EML version 2\.1 detected/);
    });

    it('extracts dataset info and returns AnnotatableElements', () => {
        const elements = emlParser.parse(validEml220);

        // Should find: Dataset, DataTable, and Attribute
        expect(elements.length).toBe(3);

        const datasetStr = elements.find(e => e.type === 'DATASET');
        expect(datasetStr).toBeDefined();
        expect(datasetStr?.name).toBe('Test Dataset');
        expect(datasetStr?.description).toBe('This is a test abstract');

        const dtpStr = elements.find(e => e.type === 'DATATABLE');
        expect(dtpStr).toBeDefined();
        expect(dtpStr?.name).toBe('table.csv');

        const attrStr = elements.find(e => e.type === 'ATTRIBUTE');
        expect(attrStr).toBeDefined();
        expect(attrStr?.name).toBe('temp');
        expect(attrStr?.description).toBe('temperature');
        expect(attrStr?.objectName).toBe('table.csv');
    });

    it('correctly exports annotations built in the UI back into the XML', () => {
        // Setup state mimicking user interaction
        const elements = emlParser.parse(validEml220);

        // Find the attribute element
        const attrElementIndex = elements.findIndex(e => e.id === 'attr-1');
        elements[attrElementIndex].currentAnnotations.push({
            label: 'Air Temperature',
            uri: 'http://example.com/air_temp',
            ontology: 'ENVO',
            propertyLabel: 'contains',
            propertyUri: 'http://www.w3.org/ns/oa#hasBody'
        });
        elements[attrElementIndex].status = AnnotationStatus.APPROVED;

        const exportedXml = emlParser.exportXml(validEml220, elements);

        // Verify it was injected accurately into the <attribute> block
        expect(exportedXml).toContain('<annotation>');
        expect(exportedXml).toContain('<propertyURI label="contains">http://www.w3.org/ns/oa#hasBody</propertyURI>');
        expect(exportedXml).toContain('<valueURI label="Air Temperature">http://example.com/air_temp</valueURI>');
        expect(exportedXml).toContain('</annotation>');

        // Check if it's placed inside the attribute block (basic regex check)
        const attributeBlockMatch = exportedXml.match(/<attribute id="attr-1">([\s\S]*?)<\/attribute>/);
        expect(attributeBlockMatch).not.toBeNull();
        expect(attributeBlockMatch![1]).toContain('<annotation>');
    });
});
