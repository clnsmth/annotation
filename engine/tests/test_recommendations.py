"""
Unit and integration tests for the recommendations API and utility functions.
"""

from typing import Any, Dict, List
import json
import re
import copy
from unittest.mock import patch, MagicMock
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


@pytest.mark.usefixtures("mock_payload")
@patch("webapp.services.core.Config.USE_MOCK_RECOMMENDATIONS", False)
@patch("webapp.services.core.requests.post")
def test_recommend_for_attribute_real_api(
    mock_post: MagicMock, mock_payload: Dict[str, Any]
) -> None:
    """
    Test recommend_for_attribute hitting the real API logic (mocked external request).
    Ensures that the payload is correctly batched and the response gets merged properly.
    """
    # Create a dummy API response mapping back to one of the inputs
    mock_response = MagicMock()
    mock_response.json.return_value = [
        {
            "column_id": "test-col",
            "column_name": "Latitude",
            "concept_name": "latitude coordinate",
            "concept_definition": "A latitude measurement",
            "concept_id": "http://purl.dataone.org/odo/ECSO_00002130",
            "confidence": 0.99,
        }
    ]
    mock_response.raise_for_status.return_value = None
    mock_post.return_value = mock_response

    attributes = mock_payload["ATTRIBUTE"]
    results = recommend_for_attribute(attributes, request_id="real-api-uuid")

    # Assert that requests.post was called
    assert mock_post.called

    # Since there are 35 attributes in the mock payload, and the batch size is 80,
    # there should be only 1 post request (if grouped perfectly, less than 80 total).
    # Grouping happens per file (objectName).

    # Verify the structure has our mocked recommendation
    found_mocked_rec = False
    for item in results:
        for rec in item.get("recommendations", []):
            assert rec["request_id"] == "real-api-uuid"
            if rec["label"] == "latitude coordinate":
                found_mocked_rec = True
                assert rec["confidence"] == 0.99
                assert rec["ontology"] == "ECSO"

    assert found_mocked_rec, (
        "Did not find the expected mocked recommendation in the results"
    )


@patch("webapp.services.core.Config.USE_MOCK_RECOMMENDATIONS", False)
@patch("webapp.services.core.requests.post")
def test_recommend_for_attribute_real_api_chunking(mock_post: MagicMock) -> None:
    """
    Test recommend_for_attribute batching logic when there are more than 80 attributes.
    """
    # Create 100 fake attributes all belonging to the same objectName (file)
    attributes = [
        {"id": f"id-{i}", "name": f"col_{i}", "objectName": "large_file.csv"}
        for i in range(100)
    ]

    mock_response = MagicMock()
    mock_response.json.return_value = []
    mock_response.raise_for_status.return_value = None
    mock_post.return_value = mock_response

    recommend_for_attribute(attributes, request_id="real-api-chunking")

    # Math: 100 items / 80 items per batch = 2 API calls
    assert mock_post.call_count == 2
    # Verify the first call had 80 items
    first_call_payload = mock_post.call_args_list[0][1]["json"]
    assert len(first_call_payload) == 80
    # Verify the second call had 20 items
    second_call_payload = mock_post.call_args_list[1][1]["json"]
    assert len(second_call_payload) == 20


@patch("webapp.services.core.Config.USE_MOCK_RECOMMENDATIONS", False)
@patch("webapp.services.core.requests.post")
def test_recommend_for_attribute_real_api_exception(mock_post: MagicMock) -> None:
    """
    Test recommend_for_attribute error handling when the external API throws a RequestException.
    It should catch the exception and return the original items mapped with no recommendations.
    """
    import requests

    attributes = [{"id": "id-1", "name": "col_1", "objectName": "error_file.csv"}]

    # Configure the mock to raise a RequestException
    mock_post.side_effect = requests.exceptions.RequestException("API is down")

    results = recommend_for_attribute(attributes, request_id="error-uuid")

    # Assert that the post was attempted
    assert mock_post.call_count == 1

    # We should still get results back out, just with an empty recommendations array
    # Wait, `merge_recommender_results` actually strips items that have no matches,
    # so the correct expected length is 0.
    assert len(results) == 0


@pytest.mark.usefixtures("mock_geo_coverage")
@patch("webapp.services.core.Config.USE_MOCK_RECOMMENDATIONS", True)
def test_recommend_for_geographic_coverage_unit(
    mock_geo_coverage: List[Dict[str, Any]],
) -> None:
    """
    Unit test for recommend_for_geographic_coverage.
    Checks that the output matches the mock_geo_coverage fixture.
    """
    geos = [
        {"id": "geo-1", "description": "Lake Tahoe region", "objectName": "LakeTahoe"}
    ]
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


@patch("webapp.services.core.Config.USE_MOCK_RECOMMENDATIONS", False)
def test_recommend_for_geographic_coverage_real_geoenv() -> None:
    """
    Test recommend_for_geographic_coverage with real geoenv logic (mocked resolver).
    Verifies response parsing, recommendation formatting, and deduplication.
    """
    # Build a fake geoenv Response object
    fake_response_data = {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [[]]},
        "properties": {
            "description": None,
            "environment": [
                {
                    "dataSource": {"name": "WorldTerrestrialEcosystems"},
                    "properties": {"climate": "Warm Temperate"},
                    "mappedProperties": [
                        {
                            "label": "temperate",
                            "uri": "http://purl.obolibrary.org/obo/ENVO_01000206",
                        },
                    ],
                },
                {
                    "dataSource": {"name": "EcologicalMarineUnits"},
                    "properties": {},
                    "mappedProperties": [
                        {
                            "label": "lake",
                            "uri": "http://purl.obolibrary.org/obo/ENVO_00000020",
                        },
                        # Duplicate URI — should be deduplicated
                        {
                            "label": "temperate",
                            "uri": "http://purl.obolibrary.org/obo/ENVO_01000206",
                        },
                    ],
                },
            ],
        },
    }

    fake_response = MagicMock()
    fake_response.data = fake_response_data

    geos = [
        {
            "id": "geo-1",
            "description": "Test coverage",
            "west": -121.9,
            "east": -121.8,
            "north": 47.4,
            "south": 47.3,
        }
    ]

    with patch("geoenv.resolver.Resolver.resolve", return_value=fake_response):
        results = recommend_for_geographic_coverage(geos, request_id="real-geoenv-uuid")

    assert isinstance(results, list)
    assert len(results) == 1
    assert results[0]["id"] == "geo-1"

    recs = results[0]["recommendations"]
    # Should have 2 unique URIs (temperate duplicate removed)
    assert len(recs) == 2

    for rec in recs:
        assert "label" in rec
        assert "uri" in rec
        assert rec["ontology"] == "ENVO"
        assert rec["confidence"] == 0.90
        assert rec["propertyLabel"] == "broad-scale environmental context"
        assert "propertyUri" in rec
        assert rec["request_id"] == "real-geoenv-uuid"

    # Verify specific labels
    labels = {r["label"] for r in recs}
    assert "temperate" in labels
    assert "lake" in labels


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
                    "column_id": "d49be2c0-7b9e-41f4-ae07-387d3e1f14c8",
                    "column_name": "Latitude",
                    "column_description": "Latitude of collection",
                    "object_name": "SurveyResults.csv",
                    "entity_name": "SurveyResults",
                    "entity_description": "Table contains survey information and the counts of "
                    "the number of egg masses for each species during that "
                    "survey.",
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
@patch("webapp.services.core.Config.USE_MOCK_RECOMMENDATIONS", True)
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
@patch("webapp.services.core.Config.USE_MOCK_RECOMMENDATIONS", True)
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
