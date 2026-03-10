"""
Backend canonical EML parsing and export service.

Provides two public functions:
  - parse_eml(xml_string)  → list of AnnotatableElement dicts
  - export_eml(xml_string, elements) → annotated EML as an XML string

ID strategy
-----------
1. If the EML element already has an ``id=`` XML attribute, that value is used as-is.
2. Otherwise, a deterministic fallback ID is derived by computing the SHA-256 hex digest
   of the XPath-style logical path (e.g. ``dataset/dataTable[0]/attribute[2]``).  This
   makes IDs stable across re-parses of the same document while avoiding collisions.
"""

import hashlib
import re
from typing import Any, Optional

import daiquiri
from lxml import etree

daiquiri.setup()
logger = daiquiri.getLogger(__name__)

# ---------------------------------------------------------------------------
# EML namespace helpers
# ---------------------------------------------------------------------------

# EML 2.2 documents may use a namespace prefix (eml:eml) or no prefix (eml).
# lxml's Clark notation handles namespaces transparently once we strip them.
_EML_NS_RE = re.compile(r"eml-2\.(\d+)\.(\d+)")


def _strip_ns(tag: str) -> str:
    """Return the local name of a tag, stripping any Clark-notation namespace."""
    return tag.split("}")[-1] if "}" in tag else tag


def _find(node: etree._Element, *local_names: str) -> Optional[etree._Element]:
    """
    Return the first child element whose local name matches any of *local_names*.
    Namespace-agnostic.
    """
    for child in node:
        if _strip_ns(child.tag) in local_names:
            return child
    return None


def _findall(node: etree._Element, local_name: str) -> list[etree._Element]:
    """Return all direct or indirect descendant elements with the given local name."""
    # We search across namespace boundaries using // with a wildcard.
    return (
        node.findall(
            f".//{{{child.nsmap.get(None, '')}}}*"  # noqa
        )
        if False
        else _findall_recursive(node, local_name)
    )


def _findall_recursive(node: etree._Element, local_name: str) -> list[etree._Element]:
    """Recursively collect all descendants whose local name matches *local_name*."""
    results = []
    for child in node.iter():
        if _strip_ns(child.tag) == local_name:
            results.append(child)
    return results


def _text(node: etree._Element, *local_names: str) -> str:
    """
    Return stripped text content of the first matching descendant, or empty string.
    Searches for each name in order and returns the first non-empty result.
    """
    for name in local_names:
        for el in node.iter():
            if _strip_ns(el.tag) == name:
                t = (el.text or "").strip()
                if t:
                    return t
    return ""


def _make_id(xml_id: Optional[str], path: str) -> str:
    """
    Return the canonical element ID.  Prefers the explicit XML ``id=`` attribute;
    falls back to the SHA-256 hex digest of the XPath-style logical path.
    """
    if xml_id:
        return xml_id
    return hashlib.sha256(path.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Ontology helpers (mirrors utils.extract_ontology)
# ---------------------------------------------------------------------------


def _extract_ontology(uri: str) -> str:
    """Infer a short ontology label from a URI."""
    if not uri:
        return "UNKNOWN"
    if re.search(r"/obo/([A-Z]+)_", uri):
        m = re.search(r"/obo/([A-Z]+)_", uri)
        return m.group(1) if m else "UNKNOWN"
    if re.search(r"/odo/(ECSO)_", uri):
        return "ECSO"
    if "dwc/terms" in uri or "darwin" in uri:
        return "DWC"
    if "qudt" in uri:
        return "QUDT"
    return "UNKNOWN"


# ---------------------------------------------------------------------------
# Existing-annotation parsing helpers
# ---------------------------------------------------------------------------


def _parse_single_annotation(anno_node: etree._Element) -> Optional[dict[str, Any]]:
    """
    Parse a single ``<annotation>`` element into an OntologyTerm dict.
    Returns None if the annotation is malformed or missing a valueURI.
    """
    value_uri_el = None
    property_uri_el = None
    for child in anno_node:
        local = _strip_ns(child.tag)
        if local == "valueURI":
            value_uri_el = child
        elif local == "propertyURI":
            property_uri_el = child

    if value_uri_el is None:
        return None
    uri = (value_uri_el.text or "").strip()
    if not uri:
        return None

    label = value_uri_el.get("label", "")
    property_label = (
        property_uri_el.get("label", "contains")
        if property_uri_el is not None
        else "contains"
    )
    property_uri = (
        (property_uri_el.text or "").strip()
        if property_uri_el is not None
        else "http://www.w3.org/ns/oa#hasBody"
    )

    return {
        "label": label,
        "uri": uri,
        "ontology": _extract_ontology(uri),
        "confidence": 1.0,
        "propertyLabel": property_label,
        "propertyUri": property_uri,
    }


def _parse_child_annotations(node: etree._Element) -> list[dict[str, Any]]:
    """Parse direct-child ``<annotation>`` elements of *node*."""
    results = []
    for child in node:
        if _strip_ns(child.tag) == "annotation":
            term = _parse_single_annotation(child)
            if term:
                results.append(term)
    return results


def _parse_detached_annotations(
    root: etree._Element,
) -> dict[str, list[dict[str, Any]]]:
    """
    Parse the ``<annotations>`` detached-reference block (if present).
    Returns a mapping: references_id → list of OntologyTerm dicts.
    """
    mapping: dict[str, list[dict[str, Any]]] = {}
    annotations_block = None
    for child in root:
        if _strip_ns(child.tag) == "annotations":
            annotations_block = child
            break
    if annotations_block is None:
        return mapping

    for anno in annotations_block:
        if _strip_ns(anno.tag) != "annotation":
            continue
        ref = anno.get("references")
        if not ref:
            continue
        term = _parse_single_annotation(anno)
        if term:
            mapping.setdefault(ref, []).append(term)
    return mapping


# ---------------------------------------------------------------------------
# EML version validation
# ---------------------------------------------------------------------------


def _validate_eml_version(root: etree._Element) -> None:
    """
    Ensure the EML document is version 2.2.0 or later.
    Raises ValueError for unsupported versions.
    """
    # Collect version context from namespace and schemaLocation attributes
    version_context = " ".join(
        root.get(attr, "")
        for attr in (
            "{http://www.w3.org/2001/XMLSchema-instance}schemaLocation",
            "schemaLocation",
        )
    )
    # Also inspect namespace map
    for ns_uri in (root.nsmap or {}).values():
        if ns_uri:
            version_context += " " + ns_uri

    m = _EML_NS_RE.search(version_context)
    if m:
        minor = int(m.group(1))
        if minor < 2:
            raise ValueError(
                f"EML version 2.{minor} detected. "
                "This application only supports EML 2.2.0 or later."
            )
    else:
        # Strict fallback: reject anything that explicitly mentions 2.1
        if "eml-2.1" in version_context:
            raise ValueError(
                "EML 2.1 detected. This application only supports EML 2.2.0 or later."
            )


# ---------------------------------------------------------------------------
# Public: parse_eml
# ---------------------------------------------------------------------------


def parse_eml(xml_string: str) -> list[dict[str, Any]]:
    """
    Parse an EML XML string and return a list of annotatable target dicts.

    Each dict conforms to the AnnotatableElement schema (id, path, context,
    contextDescription, objectName, name, description, type,
    currentAnnotations, recommendedAnnotations, status).

    :param xml_string: Raw EML XML string
    :return: Ordered list of annotatable element dicts
    :raises ValueError: If the EML version is < 2.2.0 or the XML is malformed
    """
    try:
        root = etree.fromstring(xml_string.encode())
    except etree.XMLSyntaxError as exc:
        raise ValueError(f"Invalid XML: {exc}") from exc

    _validate_eml_version(root)

    elements: list[dict[str, Any]] = []
    detached = _parse_detached_annotations(root)

    # Locate the <dataset> node (namespace-agnostic)
    dataset_node = None
    for child in root:
        if _strip_ns(child.tag) == "dataset":
            dataset_node = child
            break

    if dataset_node is None:
        logger.warning("No <dataset> element found in EML document.")
        return elements

    # ------------------------------------------------------------------
    # 0. Dataset level
    # ------------------------------------------------------------------
    title = _text(dataset_node, "title")
    abstract = _text(dataset_node, "abstract", "para")
    dataset_annotations = _parse_child_annotations(dataset_node)
    path_dataset = "dataset"
    elements.append(
        {
            "id": "dataset-top-level",
            "path": path_dataset,
            "context": "Dataset Level",
            "contextDescription": "Annotations that apply to the entire dataset",
            "objectName": None,
            "name": title or "Dataset",
            "description": abstract or "No abstract provided",
            "type": "DATASET",
            "currentAnnotations": dataset_annotations,
            "recommendedAnnotations": [],
            "status": "APPROVED" if dataset_annotations else "PENDING",
        }
    )

    # ------------------------------------------------------------------
    # 1. Entities and their attributes
    # ------------------------------------------------------------------
    entity_configs = [
        ("dataTable", "DATATABLE", "Data Table Entity"),
        ("otherEntity", "OTHERENTITY", "Other Entity"),
        ("spatialRaster", "SPATIALRASTER", "Spatial Raster Entity"),
        ("spatialVector", "SPATIALVECTOR", "Spatial Vector Entity"),
    ]

    for entity_tag, entity_type, entity_label in entity_configs:
        entity_nodes = _findall_recursive(dataset_node, entity_tag)
        for entity_idx, entity_node in enumerate(entity_nodes):
            entity_name = (
                _text(entity_node, "entityName") or f"{entity_label} {entity_idx + 1}"
            )
            entity_desc = _text(entity_node, "entityDescription")
            object_name = _text(entity_node, "objectName")
            xml_id = entity_node.get("id")
            path_entity = f"dataset/{entity_tag}[{entity_idx}]"
            entity_id = _make_id(xml_id, path_entity)

            entity_annotations = _parse_child_annotations(entity_node)
            elements.append(
                {
                    "id": entity_id,
                    "path": path_entity,
                    "context": entity_name,
                    "contextDescription": entity_desc,
                    "objectName": object_name or None,
                    "name": entity_name,
                    "description": entity_desc or entity_label,
                    "type": entity_type,
                    "currentAnnotations": entity_annotations,
                    "recommendedAnnotations": [],
                    "status": "APPROVED" if entity_annotations else "PENDING",
                }
            )

            # Attributes within this entity
            attr_list_nodes = _findall_recursive(entity_node, "attribute")
            for attr_idx, attr_node in enumerate(attr_list_nodes):
                attr_name = _text(attr_node, "attributeName")
                attr_def = _text(attr_node, "attributeDefinition")
                attr_xml_id = attr_node.get("id")
                path_attr = f"{path_entity}/attributeList/attribute[{attr_idx}]"
                attr_id = _make_id(attr_xml_id, path_attr)

                attr_annotations = _parse_child_annotations(attr_node)
                elements.append(
                    {
                        "id": attr_id,
                        "path": path_attr,
                        "context": entity_name,
                        "contextDescription": entity_desc,
                        "objectName": object_name or None,
                        "name": attr_name,
                        "description": attr_def,
                        "type": "ATTRIBUTE",
                        "currentAnnotations": attr_annotations,
                        "recommendedAnnotations": [],
                        "status": "APPROVED" if attr_annotations else "PENDING",
                    }
                )

    # ------------------------------------------------------------------
    # 2. Geographic Coverage
    # ------------------------------------------------------------------
    geo_nodes = _findall_recursive(dataset_node, "geographicCoverage")
    for geo_idx, geo_node in enumerate(geo_nodes):
        geo_desc = _text(geo_node, "geographicDescription")
        geo_xml_id = geo_node.get("id")
        path_geo = f"dataset/coverage/geographicCoverage[{geo_idx}]"
        geo_id = _make_id(geo_xml_id, path_geo)

        direct_annotations = _parse_child_annotations(geo_node)
        detached_annotations = detached.get(geo_id, [])
        combined = direct_annotations + detached_annotations

        elements.append(
            {
                "id": geo_id,
                "path": path_geo,
                "context": "Geographic Coverage",
                "contextDescription": None,
                "objectName": None,
                "name": "Location",
                "description": geo_desc,
                "type": "COVERAGE",
                "currentAnnotations": combined,
                "recommendedAnnotations": [],
                "status": "APPROVED" if combined else "PENDING",
            }
        )

    logger.info("parse_eml: extracted %d annotatable elements.", len(elements))
    return elements


# ---------------------------------------------------------------------------
# Public: export_eml
# ---------------------------------------------------------------------------


def _build_annotation_el(
    parent: etree._Element,
    anno: dict[str, Any],
    references: Optional[str] = None,
) -> etree._Element:
    """
    Construct an ``<annotation>`` lxml element from an OntologyTerm dict.
    If *references* is provided the element gets a ``references`` attribute
    (detached style); otherwise it is inline.
    """
    anno_el = (
        etree.SubElement(parent, "annotation")
        if parent is not None
        else etree.Element("annotation")
    )
    if references:
        anno_el.set("references", references)

    prop_el = etree.SubElement(anno_el, "propertyURI")
    prop_el.set("label", anno.get("propertyLabel") or "contains")
    prop_el.text = anno.get("propertyUri") or "http://www.w3.org/ns/oa#hasBody"

    val_el = etree.SubElement(anno_el, "valueURI")
    val_el.set("label", anno.get("label", ""))
    val_el.text = anno.get("uri", "")

    return anno_el


def _remove_child_annotations(node: etree._Element) -> None:
    """Remove all direct-child ``<annotation>`` elements from *node*."""
    to_remove = [c for c in node if _strip_ns(c.tag) == "annotation"]
    for el in to_remove:
        node.remove(el)


def _insert_before_first_match(
    parent: etree._Element,
    new_child: etree._Element,
    *candidate_local_names: str,
) -> None:
    """
    Insert *new_child* before the first child of *parent* whose local name
    appears in *candidate_local_names*.  Appends if none found.
    """
    for i, child in enumerate(parent):
        if _strip_ns(child.tag) in candidate_local_names:
            parent.insert(i, new_child)
            return
    parent.append(new_child)


def export_eml(xml_string: str, elements: list[dict[str, Any]]) -> str:
    """
    Apply approved annotations from *elements* back into *xml_string* and return
    the resulting EML XML as a pretty-printed string.

    Only elements whose ``currentAnnotations`` list is non-empty are written;
    elements with an empty list have any previously existing annotations removed.

    :param xml_string: Original EML XML string (from the client)
    :param elements: List of AnnotatableElement dicts with user decisions applied
    :return: Updated EML XML string
    """
    try:
        root = etree.fromstring(xml_string.encode())
    except etree.XMLSyntaxError as exc:
        raise ValueError(f"Invalid XML: {exc}") from exc

    # Build lookup: id → element dict
    element_by_id: dict[str, dict[str, Any]] = {el["id"]: el for el in elements}

    dataset_node = None
    for child in root:
        if _strip_ns(child.tag) == "dataset":
            dataset_node = child
            break

    # ------------------------------------------------------------------
    # 1. Dataset level — inline annotations
    # ------------------------------------------------------------------
    if dataset_node is not None:
        dataset_model = element_by_id.get("dataset-top-level")
        if dataset_model:
            _remove_child_annotations(dataset_node)
            annos = dataset_model.get("currentAnnotations", [])
            # Insert before coverage / purpose / maintenance / contact etc.
            ref_candidates = (
                "coverage",
                "purpose",
                "maintenance",
                "contact",
                "publisher",
                "pubPlace",
                "methods",
                "project",
                "dataTable",
                "otherEntity",
                "spatialRaster",
                "spatialVector",
            )
            for anno in annos:
                anno_el = etree.Element("annotation")
                _build_annotation_el(None, anno)  # build children only
                # rebuild inline
                anno_el = etree.Element("annotation")
                prop_el = etree.SubElement(anno_el, "propertyURI")
                prop_el.set("label", anno.get("propertyLabel") or "contains")
                prop_el.text = (
                    anno.get("propertyUri") or "http://www.w3.org/ns/oa#hasBody"
                )
                val_el = etree.SubElement(anno_el, "valueURI")
                val_el.set("label", anno.get("label", ""))
                val_el.text = anno.get("uri", "")
                _insert_before_first_match(dataset_node, anno_el, *ref_candidates)

    # ------------------------------------------------------------------
    # 2. Entities and their attributes — inline annotations
    # ------------------------------------------------------------------
    entity_tags = ("dataTable", "otherEntity", "spatialRaster", "spatialVector")

    for entity_tag in entity_tags:
        entity_nodes = _findall_recursive(
            dataset_node if dataset_node is not None else root, entity_tag
        )
        for entity_idx, entity_node in enumerate(entity_nodes):
            xml_id = entity_node.get("id")
            path_entity = f"dataset/{entity_tag}[{entity_idx}]"
            entity_id = _make_id(xml_id, path_entity)
            entity_model = element_by_id.get(entity_id)

            if entity_model:
                _remove_child_annotations(entity_node)
                for anno in entity_model.get("currentAnnotations", []):
                    anno_el = etree.Element("annotation")
                    prop_el = etree.SubElement(anno_el, "propertyURI")
                    prop_el.set("label", anno.get("propertyLabel") or "contains")
                    prop_el.text = (
                        anno.get("propertyUri") or "http://www.w3.org/ns/oa#hasBody"
                    )
                    val_el = etree.SubElement(anno_el, "valueURI")
                    val_el.set("label", anno.get("label", ""))
                    val_el.text = anno.get("uri", "")
                    _insert_before_first_match(
                        entity_node,
                        anno_el,
                        "attributeList",
                        "constraint",
                        "spatialReference",
                        "geospatial",
                        "geometry",
                    )

            # Attributes
            attr_nodes = _findall_recursive(entity_node, "attribute")
            for attr_idx, attr_node in enumerate(attr_nodes):
                attr_xml_id = attr_node.get("id")
                path_attr = f"{path_entity}/attributeList/attribute[{attr_idx}]"
                attr_id = _make_id(attr_xml_id, path_attr)
                attr_model = element_by_id.get(attr_id)

                if attr_model:
                    _remove_child_annotations(attr_node)
                    for anno in attr_model.get("currentAnnotations", []):
                        anno_el = etree.SubElement(attr_node, "annotation")
                        prop_el = etree.SubElement(anno_el, "propertyURI")
                        prop_el.set("label", anno.get("propertyLabel") or "contains")
                        prop_el.text = (
                            anno.get("propertyUri") or "http://www.w3.org/ns/oa#hasBody"
                        )
                        val_el = etree.SubElement(anno_el, "valueURI")
                        val_el.set("label", anno.get("label", ""))
                        val_el.text = anno.get("uri", "")

    # ------------------------------------------------------------------
    # 3. Geographic Coverage — detached annotations block
    # ------------------------------------------------------------------
    geo_elements = [el for el in elements if el.get("type") == "COVERAGE"]
    if geo_elements:
        geo_nodes = _findall_recursive(
            dataset_node if dataset_node is not None else root, "geographicCoverage"
        )

        # Find or create <annotations> block on the document root
        annotations_block = None
        for child in root:
            if _strip_ns(child.tag) == "annotations":
                annotations_block = child
                break
        if annotations_block is None:
            annotations_block = etree.Element("annotations")
            # Insert after <dataset>, before <additionalMetadata>
            additional_meta = None
            dataset_pos = None
            for i, child in enumerate(root):
                local = _strip_ns(child.tag)
                if local == "dataset":
                    dataset_pos = i
                if local == "additionalMetadata":
                    additional_meta = i
                    break
            if additional_meta is not None:
                root.insert(additional_meta, annotations_block)
            elif dataset_pos is not None:
                root.insert(dataset_pos + 1, annotations_block)
            else:
                root.append(annotations_block)

        for geo_idx, geo_model in enumerate(geo_elements):
            geo_id = geo_model["id"]
            geo_node = geo_nodes[geo_idx] if geo_idx < len(geo_nodes) else None
            if geo_node is None:
                continue

            # Ensure the XML node carries the canonical id
            if geo_node.get("id") != geo_id:
                geo_node.set("id", geo_id)

            # Remove existing detached annotations referencing this id
            stale = [
                c
                for c in annotations_block
                if _strip_ns(c.tag) == "annotation" and c.get("references") == geo_id
            ]
            for el in stale:
                annotations_block.remove(el)

            # Add new ones
            for anno in geo_model.get("currentAnnotations", []):
                anno_el = etree.SubElement(annotations_block, "annotation")
                anno_el.set("references", geo_id)
                prop_el = etree.SubElement(anno_el, "propertyURI")
                prop_el.set("label", anno.get("propertyLabel") or "contains")
                prop_el.text = (
                    anno.get("propertyUri") or "http://www.w3.org/ns/oa#hasBody"
                )
                val_el = etree.SubElement(anno_el, "valueURI")
                val_el.set("label", anno.get("label", ""))
                val_el.text = anno.get("uri", "")

        # Clean up empty <annotations> block
        if len(annotations_block) == 0 and annotations_block in root:
            root.remove(annotations_block)

    result = etree.tostring(
        root, pretty_print=True, xml_declaration=True, encoding="UTF-8"
    )
    return result.decode()


__all__ = ["parse_eml", "export_eml"]
