import json
from webapp.services.audit import generate_audit_report
from webapp.models.annotatable_element import AnnotatableElement, OntologyTerm


def test_generate_audit_report():
    term = OntologyTerm(
        label="Test Term",
        uri="http://example.org/test",
        ontology="TEST",
        confidence=0.9,
    )
    element = AnnotatableElement(
        id="test_id_1",
        path="dataset/dataTable[0]",
        context="Test Context",
        name="Test Element",
        description="A test element",
        type="DATATABLE",
        currentAnnotations=[term],
        status="APPROVED",
    )

    provenance = {"user": "test_user", "version": "1.0"}

    report_str = generate_audit_report([element], provenance)
    lines = report_str.strip().split("\n")

    assert len(lines) == 2

    metadata_record = json.loads(lines[0])
    assert metadata_record["event_type"] == "audit_metadata"
    assert metadata_record["provenance"]["user"] == "test_user"

    decision_record = json.loads(lines[1])
    assert decision_record["event_type"] == "element_decision"
    assert decision_record["element"]["id"] == "test_id_1"
    assert decision_record["element"]["status"] == "APPROVED"
    assert len(decision_record["element"]["currentAnnotations"]) == 1
    assert decision_record["element"]["currentAnnotations"][0]["label"] == "Test Term"


def test_generate_audit_report_validates_ids():
    """Ensure that the audit report correctly segregates and maps object IDs for multiple entities."""
    element1 = AnnotatableElement(
        id="dt_123",
        path="dataset/dataTable[0]",
        context="DataTable",
        name="Water Quality",
        description="A list of measurements",
        type="DATATABLE",
        status="APPROVED",
    )
    element2 = AnnotatableElement(
        id="attr_456",
        path="dataset/dataTable[0]/attributeList/attribute[0]",
        context="DataTable",
        name="Temperature",
        description="Degrees C",
        type="ATTRIBUTE",
        status="PENDING",
    )

    report_str = generate_audit_report(
        [element1, element2], {"execution_mode": "batch"}
    )
    lines = report_str.strip().split("\n")
    assert len(lines) == 3

    meta = json.loads(lines[0])
    assert meta["event_type"] == "audit_metadata"

    rec1 = json.loads(lines[1])
    assert rec1["event_type"] == "element_decision"
    assert rec1["element"]["id"] == "dt_123"
    assert rec1["element"]["status"] == "APPROVED"

    rec2 = json.loads(lines[2])
    assert rec2["event_type"] == "element_decision"
    assert rec2["element"]["id"] == "attr_456"
    assert rec2["element"]["status"] == "PENDING"
