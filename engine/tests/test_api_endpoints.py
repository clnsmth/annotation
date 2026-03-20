"""
Tests for API endpoints: health check, proposals, and recommendations edge cases.
"""

from typing import Any, Dict
from unittest.mock import patch

import pytest


VALID_PROPOSAL_PAYLOAD: Dict[str, Any] = {
    "target_vocabulary": "TestVocab",
    "term_details": {
        "label": "test label",
        "description": "test description",
        "evidence_source": "test source",
    },
    "submitter_info": {
        "email": "test@example.com",
        "orcid_id": "0000-0000-0000-0000",
        "attribution_consent": True,
    },
}


@pytest.mark.usefixtures("client")
def test_health_check(client: Any) -> None:
    """
    Test that GET / returns 200 and the expected status message.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Semantic EML Annotator Backend is running."}


@pytest.mark.usefixtures("client")
def test_proposals_endpoint_success(client: Any) -> None:
    """
    Test that POST /api/proposals with a valid payload returns 200 and a success status.
    """
    response = client.post("/api/proposals", json=VALID_PROPOSAL_PAYLOAD)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"


@pytest.mark.usefixtures("client")
def test_proposals_endpoint_invalid_payload(client: Any) -> None:
    """
    Test that POST /api/proposals with a missing required field returns a 422 validation error.
    """
    response = client.post("/api/proposals", json={"invalid": "data"})
    assert response.status_code == 422


@pytest.mark.usefixtures("client")
def test_recommendations_empty_payload(client: Any) -> None:
    """
    Test that POST /api/recommendations with an empty dict returns 200 and an empty list.
    """
    response = client.post("/api/recommendations", json={})
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.usefixtures("client")
def test_recommendations_only_geographiccoverage(client: Any) -> None:
    """
    Test that POST /api/recommendations with only a GEOGRAPHICCOVERAGE key returns
    results for geographic coverage only.
    """
    payload = {
        "GEOGRAPHICCOVERAGE": [
            {"id": "geo-1", "description": "Arctic region", "objectName": "Arctic"}
        ]
    }
    response = client.post("/api/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    for item in data:
        assert "id" in item
        assert "recommendations" in item


@pytest.mark.usefixtures("client")
def test_recommendations_unrecognized_keys_only(client: Any) -> None:
    """
    Test that POST /api/recommendations with only unrecognized keys returns 200
    and an empty list.
    """
    payload = {"DATATABLE": [{"id": "x", "name": "y"}], "UNKNOWN": [{"foo": "bar"}]}
    response = client.post("/api/recommendations", json=payload)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.usefixtures("client")
@patch("webapp.services.core.Config.USE_MOCK_RECOMMENDATIONS", True)
def test_auto_annotate_document(client: Any) -> None:
    """
    Test that POST /api/documents/auto-annotate accepts an EML file,
    processes it through the recommendation pipeline, and returns updated XML.
    """
    from pathlib import Path

    # Use the existing example_eml.xml fixture
    fixture_path = Path(__file__).parent / "fixtures" / "example_eml.xml"
    with open(fixture_path, "rb") as f:
        file_content = f.read()

    response = client.post(
        "/api/documents/auto-annotate",
        files={"file": ("example_eml.xml", file_content, "application/xml")},
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/xml")

    # Simple check to ensure the returned content is non-empty XML
    xml_text = response.text
    assert "<?xml" in xml_text or "<eml:eml" in xml_text

    # Assert legacy annotations originally in example_eml.xml survived
    assert "http://qudt.org/vocab/unit/DEG" in xml_text, "Legacy attribute annotation lost"
    assert "http://purl.obolibrary.org/obo/ENVO_00000000" in xml_text, "Legacy coverage annotation lost"

    # Assert new AI recommendations were successfully aggregated
    assert "http://purl.dataone.org/odo/ECSO_00002130" in xml_text, "New attribute recommendation missing"
    assert "http://purl.obolibrary.org/obo/ENVO_00000020" in xml_text, "New coverage recommendation missing"
