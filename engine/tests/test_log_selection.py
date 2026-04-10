"""
Tests for the /api/log-selection and /api/user-behavior endpoints.
"""

import json
from typing import Any
from unittest.mock import mock_open, patch

from webapp.config import Config
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


def test_log_selection_persists_to_jsonl(client: Any) -> None:
    """
    Test that POST /api/log-selection appends the payload as a JSONL record to
    'user-behavior.jsonl'.
    """
    with patch("builtins.open", mock_open()) as mocked_file:
        response = client.post("/api/log-selection", json=MOCK_SELECTION)
        assert response.status_code == 200

        mocked_file.assert_called_once_with(
            Config.USER_BEHAVIOR_LOG_PATH, "a", encoding="utf-8"
        )
        handle = mocked_file()
        written = "".join(call.args[0] for call in handle.write.call_args_list)
        record = json.loads(written.strip())
        assert record["event_id"] == MOCK_SELECTION["event_id"]
        assert record["element_name"] == MOCK_SELECTION["element_name"]
        assert record["selected"]["uri"] == MOCK_SELECTION["selected"]["uri"]


def test_log_selection_jsonl_format(client: Any) -> None:
    """
    Test that multiple calls to POST /api/log-selection each append a separate
    newline-delimited JSON record, producing valid JSONL output.
    """
    with patch("builtins.open", mock_open()) as mocked_file:
        client.post("/api/log-selection", json=MOCK_SELECTION)
        client.post("/api/log-selection", json=MOCK_SELECTION)

        assert mocked_file.call_count == 2
        for call in mocked_file.call_args_list:
            assert call == ((Config.USER_BEHAVIOR_LOG_PATH, "a"), {"encoding": "utf-8"})

        for call in mocked_file().write.call_args_list:
            line = call.args[0]
            if line.strip():
                record = json.loads(line.strip())
                assert "event_id" in record


def test_log_selection_write_failure_returns_500(client: Any) -> None:
    """
    Test that POST /api/log-selection returns 500 when the JSONL file cannot be written,
    ensuring write failures are never silently dropped.
    """
    with patch("builtins.open", side_effect=OSError("disk full")):
        response = client.post("/api/log-selection", json=MOCK_SELECTION)
        assert response.status_code == 500


def test_get_user_behavior_returns_list(client: Any) -> None:
    """
    Test that GET /api/user-behavior returns 200 and a JSON array.
    """
    jsonl_content = json.dumps(MOCK_SELECTION) + "\n"
    with patch("builtins.open", mock_open(read_data=jsonl_content)), \
         patch("os.path.exists", return_value=True):
        response = client.get("/api/user-behavior")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["event_id"] == MOCK_SELECTION["event_id"]


def test_get_user_behavior_empty_when_no_file(client: Any) -> None:
    """
    Test that GET /api/user-behavior returns an empty list when the log file
    does not exist.
    """
    with patch("os.path.exists", return_value=False):
        response = client.get("/api/user-behavior")
    assert response.status_code == 200
    assert response.json() == []


def test_get_user_behavior_multiple_records(client: Any) -> None:
    """
    Test that GET /api/user-behavior returns all records from the JSONL file.
    """
    line = json.dumps(MOCK_SELECTION)
    jsonl_content = line + "\n" + line + "\n"
    with patch("builtins.open", mock_open(read_data=jsonl_content)), \
         patch("os.path.exists", return_value=True):
        response = client.get("/api/user-behavior")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_get_user_behavior_read_failure_returns_500(client: Any) -> None:
    """
    Test that GET /api/user-behavior returns 500 when the log file cannot be read.
    """
    with patch("os.path.exists", return_value=True), \
         patch("builtins.open", side_effect=OSError("permission denied")):
        response = client.get("/api/user-behavior")
    assert response.status_code == 500
