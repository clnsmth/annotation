"""
Tests for the /api/log-selection endpoint using MOCK_SELECTION.
"""

from webapp.models.mock_objects import MOCK_SELECTION


def test_log_selection_endpoint(client):
    """
    Test that the /api/log-selection endpoint receives and responds correctly to a valid
    selection log payload.
    """
    response = client.post("/api/log-selection", json=MOCK_SELECTION)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "received"
