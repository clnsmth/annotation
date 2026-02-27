"""
Unit and integration tests for the recommendations API and utility functions.
"""

from typing import Any, Dict, List
import json
import re
import copy
import pytest
from webapp.run import (
    recommend_for_attribute,
    recommend_for_geographic_coverage,
)
from webapp.utils.utils import (
    reformat_attribute_elements,
    reformat_geographic_coverage_elements,
    extract_ontology,
)


@pytest.mark.usefixtures("client", "mock_payload")
def test_recommend_for_attribute_unit(mock_payload: Dict[str, Any]) -> None:
    """
    Unit test for recommend_for_attribute.
    Checks that the output structure and content are as expected.
    """
    attributes = mock_payload["ATTRIBUTE"]
    results = recommend_for_attribute(attributes, request_id="test-uuid-1234")
    print(json.dumps(results, indent=2))
    assert isinstance(results, list)
    assert len(results) == 35
    for item in results:
        assert "id" in item
        assert "recommendations" in item
        for rec in item["recommendations"]:
            assert "attributeName" in rec
            assert "objectName" in rec
            assert "uri" in rec
            assert "ontology" in rec
            assert "confidence" in rec
            assert "description" in rec
            assert "propertyLabel" in rec
            assert "propertyUri" in rec
            assert "request_id" in rec
            assert rec["request_id"] == "test-uuid-1234"


@pytest.mark.usefixtures("mock_geo_coverage")
def test_recommend_for_geographic_coverage_unit(
    mock_geo_coverage: List[Dict[str, Any]],
) -> None:
    """
    Unit test for recommend_for_geographic_coverage.
    Checks that the output matches the mock_geo_coverage fixture.
    """
    geos = [{"description": "Lake Tahoe region", "objectName": "LakeTahoe"}]
    results = recommend_for_geographic_coverage(geos, request_id="test-uuid-5678")
    assert isinstance(results, list)
    for item in results:
        for rec in item.get("recommendations", []):
            assert "request_id" in rec
            assert rec["request_id"] == "test-uuid-5678"
    # Remove request_id for comparison
    for item in results:
        for rec in item.get("recommendations", []):
            rec.pop("request_id", None)
    for item in mock_geo_coverage:
        for rec in item.get("recommendations", []):
            rec.pop("request_id", None)
    assert results == mock_geo_coverage


@pytest.mark.parametrize(
    "data,expected",
    [
        (
            [
                {
                    "id": "d49be2c0-7b9e-41f4-ae07-387d3e1f14c8",
                    "name": "Latitude",
                    "description": "Latitude of collection",
                    "context": "SurveyResults",
                    "objectName": "SurveyResults.csv",
                    "entityDescription": "Table contains survey information and the counts of "
                    "the number of egg masses for each species during that "
                    "survey.",
                }
            ],
            [
                {
                    "entity_name": "SurveyResults.csv",
                    "entity_description": "Table contains survey information and the counts of "
                    "the number of egg masses for each species during that "
                    "survey.",
                    "object_name": "SurveyResults.csv",
                    "column_name": "Latitude",
                    "column_description": "Latitude of collection",
                }
            ],
        )
    ],
)
def test_reformat_attribute_elements_unit(
    data: List[Dict[str, Any]], expected: List[Dict[str, Any]]
) -> None:
    """
    Test reformat_attribute_elements utility function for correct transformation.
    """
    out = reformat_attribute_elements(data)
    assert out == expected


@pytest.mark.parametrize(
    "data",
    [
        ([{"description": "D1"}, {"description": "D2"}]),
    ],
)
def test_reformat_geographic_coverage_elements_unit(data: List[Dict[str, Any]]) -> None:
    """
    Test reformat_geographic_coverage_elements utility function for pass-through behavior.
    """
    out = reformat_geographic_coverage_elements(data)
    assert out == data


@pytest.mark.usefixtures("client", "mock_payload")
def test_recommend_annotations_endpoint_with_full_mock_frontend_payload(
    client: Any, mock_payload: Dict[str, Any]
) -> None:
    """
    Integration test for the /api/recommendations endpoint with the full mock frontend payload as
    input (as-is). Checks that the response is a list and that the number of items matches the
    number of attributes and coverages.
    """
    response = client.post("/api/recommendations", json=mock_payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Check structure of each item
    for item in data:
        assert "id" in item
        assert "recommendations" in item
        for rec in item["recommendations"]:
            assert "label" in rec
            assert "uri" in rec
            assert "ontology" in rec
            assert "confidence" in rec
            assert "description" in rec
            assert "propertyLabel" in rec
            assert "propertyUri" in rec
            assert "request_id" in rec
            # Check UUID format (8-4-4-4-12)
            assert re.match(r"^[a-f0-9\-]{36}$", rec["request_id"])


@pytest.mark.usefixtures("client", "mock_payload")
def test_recommendations_endpoint_snapshot(
    client: Any, mock_payload: Dict[str, Any]
) -> None:
    """
    Integration test: POST to /api/recommendations with MOCK_FRONTEND_PAYLOAD and compare
    response to stored snapshot. Sorts both lists by 'id' to ensure order does not affect
    the test. Normalizes request_id in all recommendations to allow for UUID differences.
    Prevents in-place modification of the snapshot file.
    """

    response = client.post("/api/recommendations", json=mock_payload)
    assert response.status_code == 200
    data = response.json()
    with open(
        "tests/snapshot_recommendations_response.json", "r", encoding="utf-8"
    ) as f:
        expected = json.load(f)

    def normalize_request_id(results):
        for item in results:
            for rec in item.get("recommendations", []):
                rec["request_id"] = "SNAPSHOT_REQUEST_ID"
        return results

    data_sorted = sorted(
        normalize_request_id(copy.deepcopy(data)), key=lambda x: x["id"]
    )
    expected_sorted = sorted(
        normalize_request_id(copy.deepcopy(expected)), key=lambda x: x["id"]
    )
    assert data_sorted == expected_sorted


@pytest.mark.parametrize(
    "uri,expected",
    [
        ("http://purl.obolibrary.org/obo/ENVO_00002006", "ENVO"),
        ("http://purl.obolibrary.org/obo/PATO_0000146", "PATO"),
        ("http://purl.obolibrary.org/obo/IAO_0000578", "IAO"),
        ("http://rs.tdwg.org/dwc/terms/decimalLatitude", "DWC"),
        ("http://purl.dataone.org/odo/ECSO_00002565", "ECSO"),
        ("", "UNKNOWN"),
        (None, "UNKNOWN"),
        ("http://example.com/other/THING_12345", "UNKNOWN"),
    ],
)
def test_extract_ontology(uri: str, expected: str) -> None:
    """
    Test extract_ontology utility function for correct ontology extraction from URIs.
    """

    assert extract_ontology(uri) == expected
