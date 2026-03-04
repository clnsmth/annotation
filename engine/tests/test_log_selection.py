"""
Tests for the /api/log-selection endpoint using MOCK_SELECTION.
"""

from typing import Any

from webapp.models.mock_objects import MOCK_SELECTION


def test_log_selection_endpoint(client: Any) -> None:
    """
    Test that the /api/log-selection endpoint receives and responds correctly to a valid
    selection log payload.
    """
    response = client.post("/api/log-selection", json=MOCK_SELECTION)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "received"


def test_log_selection_missing_required_field(client: Any) -> None:
    """
    Test that POST /api/log-selection returns 422 when a required field is absent.
    """
    incomplete_payload = {
        "request_id": "54a68e57-2a96-43fe-99bf-5e0e5c195e53",
        "event_id": "0693d0c8-7105-4046-bff9-4a21fa089f40",
        "timestamp": "2025-12-22T15:35:07.273Z",
        "element_id": "8a90023e-72cc-4540-a4b2-d4532ea86c38",
        "element_name": "SurveyID",
        "element_type": "ATTRIBUTE",
        # 'selected' is intentionally omitted
        "not_selected": [],
    }
    response = client.post("/api/log-selection", json=incomplete_payload)
    assert response.status_code == 422
