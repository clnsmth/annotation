import pytest
from webapp.services.core import recommend_for_geographic_coverage
from webapp.config import Config

@pytest.mark.skipif(not getattr(Config, 'TEST_WITH_REAL_REQUESTS', False),
                    reason="TEST_WITH_REAL_REQUESTS is False")
def test_recommend_for_geographic_coverage_real_request():
    """
    Integration test that makes a real request to geoenv if TEST_WITH_REAL_REQUESTS is True.
    """
    geos = [
        {
            "id": "jeff-dozier",
            "name": "Location",
            "description": "Jeff Dozier Snow Study Site (Mammoth, CA)",
            "context": "Geographic Coverage",
            "west": -119.02888,
            "east": -119.02888,
            "north": 37.64313,
            "south": 37.64313,
        }
    ]

    # Temporarily force mock off for this test if we are in real request mode
    original_mock = Config.USE_MOCK_RECOMMENDATIONS
    Config.USE_MOCK_RECOMMENDATIONS = False
    try:
        results = recommend_for_geographic_coverage(geos, request_id="test-real-request")
        assert len(results) == 1
        assert results[0]["id"] == "jeff-dozier"
        # We expect some recommendations from real geoenv for these coordinates
        assert len(results[0]["recommendations"]) > 0

        # Verify a known recommendation
        labels = [r["label"] for r in results[0]["recommendations"]]
        assert "temperate" in labels
    finally:
        Config.USE_MOCK_RECOMMENDATIONS = original_mock
