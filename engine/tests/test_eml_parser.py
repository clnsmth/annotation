"""
Tests for the backend canonical EML parser service (parse_eml, export_eml).

Uses a condensed version of the EXAMPLE_EML_XML fixture from studio/src/constants/mockData.ts
as the primary integration fixture, so the same document exercises both the engine
parser and the studio UI.
"""

import io
import os
import pytest
from webapp.services.eml_parser import parse_eml, export_eml


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

# The full EML 2.2.0 document from the Studio's mockData.ts
with open(os.path.join(FIXTURES_DIR, "example_eml.xml"), "r", encoding="utf-8") as f:
    EXAMPLE_EML_XML = f.read()

EML_21_XML = """\
<?xml version="1.0" encoding="UTF-8"?>
<eml:eml xmlns:eml="eml://ecoinformatics.org/eml-2.1.0"
  xsi:schemaLocation="eml://ecoinformatics.org/eml-2.1.0 eml.xsd"
  packageId="test.1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dataset>
    <title>Old EML Dataset</title>
  </dataset>
</eml:eml>
"""

MALFORMED_XML = "<eml:eml><dataset><unclosed>"


# ---------------------------------------------------------------------------
# parse_eml — version validation
# ---------------------------------------------------------------------------


class TestParseEmlVersionValidation:
    def test_rejects_eml_21(self):
        """EML 2.1 documents must be rejected with ValueError."""
        with pytest.raises(ValueError, match="2.1"):
            parse_eml(EML_21_XML)

    def test_rejects_malformed_xml(self):
        """Malformed XML must raise ValueError."""
        with pytest.raises(ValueError, match="Invalid XML"):
            parse_eml(MALFORMED_XML)

    def test_accepts_eml_220(self):
        """EML 2.2.0 documents must be parsed without error."""
        elements = parse_eml(EXAMPLE_EML_XML)
        assert isinstance(elements, list)
        assert len(elements) > 0


# ---------------------------------------------------------------------------
# parse_eml — element extraction
# ---------------------------------------------------------------------------


class TestParseEmlExtraction:
    @pytest.fixture(scope="class")
    def elements(self):
        return parse_eml(EXAMPLE_EML_XML)

    def test_element_count(self, elements):
        """Full fixture EML yields: 1 Dataset + 2 DataTables + 1 OtherEntity + 35 Attributes + 1 GeoCoverage = 40 elements."""
        assert len(elements) == 40

    def test_dataset_element_present(self, elements):
        """Dataset-level element has id='dataset-top-level' and type='DATASET'."""
        dataset = next((e for e in elements if e["type"] == "DATASET"), None)
        assert dataset is not None
        assert dataset["id"] == "dataset-top-level"
        assert "City of Seattle" in dataset["name"]
        assert "Cedar River" in dataset["description"]

    def test_entity_element_uses_xml_id(self, elements):
        """dataTable entity preserves its XML id= attribute."""
        entity = next(
            (
                e
                for e in elements
                if e["type"] == "DATATABLE" and e["name"] == "SurveyResults"
            ),
            None,
        )
        assert entity is not None
        assert entity["id"] == "24632bb8dbdace8be4693baf5c9e4b97"
        assert entity["name"] == "SurveyResults"
        assert entity["objectName"] == "SurveyResults.csv"

    def test_attribute_with_xml_id_preserved(self, elements):
        """Attribute with an XML id= retains that id."""
        lat = next(
            (
                e
                for e in elements
                if e["type"] == "ATTRIBUTE" and e["name"] == "Latitude"
            ),
            None,
        )
        assert lat is not None
        assert lat["id"] == "d49be2c0-7b9e-41f4-ae07-387d3e1f14c8"
        assert lat["objectName"] == "SurveyResults.csv"

    def test_attribute_existing_annotation_parsed(self, elements):
        """Latitude attribute's existing <annotation> is parsed into currentAnnotations."""
        lat = next(
            (
                e
                for e in elements
                if e["type"] == "ATTRIBUTE" and e["name"] == "Latitude"
            ),
            None,
        )
        assert lat is not None
        assert len(lat["currentAnnotations"]) == 1
        anno = lat["currentAnnotations"][0]
        assert anno["label"] == "Degree"
        assert "qudt" in anno["uri"]
        assert anno["ontology"] == "QUDT"
        assert anno["propertyLabel"] == "has unit"

    def test_attribute_no_annotation_pending(self, elements):
        """Attribute without existing annotations has status=PENDING."""
        target = next(
            (
                e
                for e in elements
                if e["type"] == "ATTRIBUTE" and e["name"] == "SurveyID"
            ),
            None,
        )
        assert target is not None
        assert target["status"] == "PENDING"
        assert target["currentAnnotations"] == []

    def test_geo_coverage_uses_xml_id(self, elements):
        """Geographic coverage element with XML id="geo-1" retains that id."""
        geo = next((e for e in elements if e["type"] == "COVERAGE"), None)
        assert geo is not None
        assert geo["id"] == "geo-1"
        assert "Cedar River" in geo["description"]

    def test_all_elements_have_required_fields(self, elements):
        """Every element dict contains all required AnnotatableElement fields."""
        required_keys = {
            "id",
            "path",
            "context",
            "name",
            "description",
            "type",
            "currentAnnotations",
            "recommendedAnnotations",
            "status",
        }
        for el in elements:
            assert required_keys.issubset(el.keys()), (
                f"Element missing keys: {required_keys - el.keys()!r}"
            )


# ---------------------------------------------------------------------------
# parse_eml — hash-based fallback ID
# ---------------------------------------------------------------------------


class TestParseEmlFallbackId:
    """When no XML id= is present, the fallback ID is the SHA-256 of the XPath path."""

    EML_NO_IDS = """\
<?xml version="1.0" encoding="UTF-8"?>
<eml:eml xmlns:eml="https://eml.ecoinformatics.org/eml-2.2.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="https://eml.ecoinformatics.org/eml-2.2.0 https://eml.ecoinformatics.org/eml-2.2.0/eml.xsd"
  packageId="test.2">
  <dataset>
    <title>No IDs Dataset</title>
    <dataTable>
      <entityName>NoIdTable</entityName>
      <attributeList>
        <attribute>
          <attributeName>ColA</attributeName>
          <attributeDefinition>Column A definition</attributeDefinition>
        </attribute>
      </attributeList>
    </dataTable>
  </dataset>
</eml:eml>
"""

    def test_fallback_id_is_sha256_hex(self):
        """IDs generated from XPath paths must be 64-character hex strings (SHA-256)."""
        import hashlib

        elements = parse_eml(self.EML_NO_IDS)
        # Entity fallback
        entity = next((e for e in elements if e["type"] == "DATATABLE"), None)
        assert entity is not None
        expected = hashlib.sha256("dataset/dataTable[0]".encode()).hexdigest()
        assert entity["id"] == expected

    def test_fallback_id_is_stable(self):
        """Re-parsing the same document yields identical fallback IDs."""
        elements1 = parse_eml(self.EML_NO_IDS)
        elements2 = parse_eml(self.EML_NO_IDS)
        ids1 = [e["id"] for e in elements1]
        ids2 = [e["id"] for e in elements2]
        assert ids1 == ids2


# ---------------------------------------------------------------------------
# export_eml — round-trip
# ---------------------------------------------------------------------------


class TestExportEml:
    def test_roundtrip_adds_attribute_annotation(self):
        """
        Parse → approve an annotation on SurveyID → export → re-parse.
        The SurveyID attribute must now carry the annotation in the output XML.
        """
        elements = parse_eml(EXAMPLE_EML_XML)
        target = next(e for e in elements if e["name"] == "SurveyID")
        target["currentAnnotations"] = [
            {
                "label": "Identifier",
                "uri": "http://purl.obolibrary.org/obo/IAO_0000578",
                "ontology": "IAO",
                "confidence": 1.0,
                "propertyLabel": "has unit",
                "propertyUri": "http://qudt.org/schema/qudt/hasUnit",
            }
        ]

        updated_xml = export_eml(EXAMPLE_EML_XML, elements)
        assert "<annotation>" in updated_xml
        assert "http://purl.obolibrary.org/obo/IAO_0000578" in updated_xml

        # Re-parse: SurveyID should now have 1 annotation
        re_elements = parse_eml(updated_xml)
        target_re = next(e for e in re_elements if e["name"] == "SurveyID")
        assert len(target_re["currentAnnotations"]) == 1
        assert target_re["currentAnnotations"][0]["label"] == "Identifier"

    def test_roundtrip_adds_geo_annotation_detached(self):
        """
        Approve a geographic coverage annotation → export → the output XML
        must contain a detached <annotations> block referencing 'geo-1'.
        """
        elements = parse_eml(EXAMPLE_EML_XML)
        geo = next(e for e in elements if e["type"] == "COVERAGE")
        geo["currentAnnotations"] = [
            {
                "label": "Freshwater lake",
                "uri": "http://purl.obolibrary.org/obo/ENVO_00000020",
                "ontology": "ENVO",
                "confidence": 0.9,
                "propertyLabel": "is about",
                "propertyUri": "http://purl.obolibrary.org/obo/IAO_0000136",
            }
        ]

        updated_xml = export_eml(EXAMPLE_EML_XML, elements)
        assert "<annotations>" in updated_xml
        assert 'references="geo-1"' in updated_xml
        assert "ENVO_00000020" in updated_xml

    def test_roundtrip_preserves_existing_annotation_on_latitude(self):
        """
        The Latitude attribute already has an annotation in the fixture.
        After a no-op export (no changes to currentAnnotations), the annotation
        must still be present in the output.
        """
        elements = parse_eml(EXAMPLE_EML_XML)
        updated_xml = export_eml(EXAMPLE_EML_XML, elements)
        re_elements = parse_eml(updated_xml)
        lat_re = next(e for e in re_elements if e["name"] == "Latitude")
        assert len(lat_re["currentAnnotations"]) == 1
        assert (
            lat_re["currentAnnotations"][0]["uri"] == "http://qudt.org/vocab/unit/DEG"
        )

    def test_export_rejects_malformed_xml(self):
        """export_eml must raise ValueError for malformed input XML."""
        with pytest.raises(ValueError, match="Invalid XML"):
            export_eml(MALFORMED_XML, [])


# ---------------------------------------------------------------------------
# API endpoint tests (via conftest TestClient)
# ---------------------------------------------------------------------------


class TestDocumentTargetsEndpoint:
    def test_valid_eml_returns_200_and_elements(self, client):
        """POST /api/documents/targets with valid EML 2.2.0 returns 200 + element list."""
        response = client.post(
            "/api/documents/targets",
            files={
                "file": (
                    "example.xml",
                    io.BytesIO(EXAMPLE_EML_XML.encode()),
                    "application/xml",
                )
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 40
        types = {el["type"] for el in data}
        assert "DATASET" in types
        assert "DATATABLE" in types
        assert "ATTRIBUTE" in types
        assert "COVERAGE" in types
        assert "OTHERENTITY" in types

    def test_eml_21_returns_422(self, client):
        """POST /api/documents/targets with EML 2.1 returns 422."""
        response = client.post(
            "/api/documents/targets",
            files={
                "file": ("old.xml", io.BytesIO(EML_21_XML.encode()), "application/xml")
            },
        )
        assert response.status_code == 422
        assert "2.1" in response.json()["detail"]

    def test_malformed_xml_returns_422(self, client):
        """POST /api/documents/targets with malformed XML returns 422."""
        response = client.post(
            "/api/documents/targets",
            files={
                "file": (
                    "bad.xml",
                    io.BytesIO(MALFORMED_XML.encode()),
                    "application/xml",
                )
            },
        )
        assert response.status_code == 422


class TestDocumentExportEndpoint:
    def test_export_roundtrip_returns_xml(self, client):
        """POST /api/documents/export returns XML with approved annotation injected."""
        elements = parse_eml(EXAMPLE_EML_XML)
        target = next(e for e in elements if e["name"] == "SurveyID")
        target["currentAnnotations"] = [
            {
                "label": "Identifier",
                "uri": "http://purl.obolibrary.org/obo/IAO_0000578",
                "ontology": "IAO",
                "confidence": 1.0,
                "propertyLabel": "has unit",
                "propertyUri": "http://qudt.org/schema/qudt/hasUnit",
            }
        ]

        payload = {
            "eml_xml": EXAMPLE_EML_XML,
            "elements": elements,
        }
        response = client.post("/api/documents/export", json=payload)
        assert response.status_code == 200
        assert "application/xml" in response.headers["content-type"]
        body = response.text
        assert "http://purl.obolibrary.org/obo/IAO_0000578" in body
        assert "<annotation>" in body

    def test_export_with_malformed_xml_returns_422(self, client):
        """POST /api/documents/export with malformed eml_xml returns 422."""
        payload = {"eml_xml": MALFORMED_XML, "elements": []}
        response = client.post("/api/documents/export", json=payload)
        assert response.status_code == 422
