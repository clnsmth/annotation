"""
Tests for the /api/log-behavior and /api/user-behavior endpoints.
"""

import json
from typing import Any
from unittest.mock import mock_open, patch

from webapp.config import Config
from webapp.models.mock_objects import (
    MOCK_CUSTOM_ANNOTATION,
    MOCK_REMOVAL,
    MOCK_SELECTION,
)


def test_log_behavior_endpoint(client: Any) -> None:
    """
    Test that the /api/log-behavior endpoint receives and responds correctly to a valid
    behavior log payload.
    """
    response = client.post("/api/log-behavior", json=MOCK_SELECTION)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "received"


def test_log_behavior_missing_required_field(client: Any) -> None:
    """
    Test that POST /api/log-behavior returns 422 when a required field is absent.
    """
    incomplete_payload = {
        "event_type": "selection",
        "request_id": "54a68e57-2a96-43fe-99bf-5e0e5c195e53",
        "event_id": "0693d0c8-7105-4046-bff9-4a21fa089f40",
        "timestamp": "2025-12-22T15:35:07.273Z",
        "element_id": "8a90023e-72cc-4540-a4b2-d4532ea86c38",
        "element_name": "SurveyID",
        "element_type": "ATTRIBUTE",
        # 'selected' is intentionally omitted
        "not_selected": [],
    }
    response = client.post("/api/log-behavior", json=incomplete_payload)
    assert response.status_code == 422


def test_log_behavior_missing_event_type(client: Any) -> None:
    """
    Test that POST /api/log-behavior returns 422 when event_type is absent.
    """
    payload_without_event_type = {
        "request_id": "54a68e57-2a96-43fe-99bf-5e0e5c195e53",
        "event_id": "0693d0c8-7105-4046-bff9-4a21fa089f40",
        "timestamp": "2025-12-22T15:35:07.273Z",
        "element_id": "8a90023e-72cc-4540-a4b2-d4532ea86c38",
        "element_name": "SurveyID",
        "element_type": "ATTRIBUTE",
        "selected": {
            "label": "plot identifier",
            "uri": "http://purl.dataone.org/odo/ECSO_00002432",
            "property_label": "contains measurements of type",
            "property_uri": "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
            "confidence": 0.85,
        },
        "not_selected": [],
    }
    response = client.post("/api/log-behavior", json=payload_without_event_type)
    assert response.status_code == 422


def test_log_behavior_invalid_event_type(client: Any) -> None:
    """
    Test that POST /api/log-behavior returns 422 when event_type is not a valid value.
    """
    payload = {**MOCK_SELECTION, "event_type": "invalid_type"}
    response = client.post("/api/log-behavior", json=payload)
    assert response.status_code == 422


def test_log_behavior_persists_to_jsonl(client: Any) -> None:
    """
    Test that POST /api/log-behavior appends the payload as a JSONL record to
    'user-behavior.jsonl'.
    """
    with patch("builtins.open", mock_open()) as mocked_file:
        response = client.post("/api/log-behavior", json=MOCK_SELECTION)
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
        assert record["event_type"] == "selection"


def test_log_behavior_jsonl_format(client: Any) -> None:
    """
    Test that multiple calls to POST /api/log-behavior each append a separate
    newline-delimited JSON record, producing valid JSONL output.
    """
    with patch("builtins.open", mock_open()) as mocked_file:
        client.post("/api/log-behavior", json=MOCK_SELECTION)
        client.post("/api/log-behavior", json=MOCK_SELECTION)

        assert mocked_file.call_count == 2
        for call in mocked_file.call_args_list:
            assert call == ((Config.USER_BEHAVIOR_LOG_PATH, "a"), {"encoding": "utf-8"})

        for call in mocked_file().write.call_args_list:
            line = call.args[0]
            if line.strip():
                record = json.loads(line.strip())
                assert "event_id" in record


def test_log_behavior_write_failure_returns_500(client: Any) -> None:
    """
    Test that POST /api/log-behavior returns 500 when the JSONL file cannot be written,
    ensuring write failures are never silently dropped.
    """
    with patch("builtins.open", side_effect=OSError("disk full")):
        response = client.post("/api/log-behavior", json=MOCK_SELECTION)
        assert response.status_code == 500


def test_log_behavior_custom_annotation(client: Any) -> None:
    """
    Test that POST /api/log-behavior accepts a custom_annotation event and persists it
    correctly to JSONL with event_type written to the record.
    """
    with patch("builtins.open", mock_open()) as mocked_file:
        response = client.post("/api/log-behavior", json=MOCK_CUSTOM_ANNOTATION)
        assert response.status_code == 200

        handle = mocked_file()
        written = "".join(call.args[0] for call in handle.write.call_args_list)
        record = json.loads(written.strip())
        assert record["event_type"] == "custom_annotation"
        assert (
            record["selected"]["label"] == MOCK_CUSTOM_ANNOTATION["selected"]["label"]
        )
        assert record["selected"]["uri"] == MOCK_CUSTOM_ANNOTATION["selected"]["uri"]
        assert (
            record["selected"]["confidence"]
            == MOCK_CUSTOM_ANNOTATION["selected"]["confidence"]
        )
        assert record["not_selected"] == []


def test_log_behavior_removal(client: Any) -> None:
    """
    Test that POST /api/log-behavior accepts a removal event and persists it correctly
    to JSONL with event_type written and confidence preserved.
    """
    with patch("builtins.open", mock_open()) as mocked_file:
        response = client.post("/api/log-behavior", json=MOCK_REMOVAL)
        assert response.status_code == 200

        handle = mocked_file()
        written = "".join(call.args[0] for call in handle.write.call_args_list)
        record = json.loads(written.strip())
        assert record["event_type"] == "removal"
        assert record["selected"]["uri"] == MOCK_REMOVAL["selected"]["uri"]
        assert (
            record["selected"]["confidence"] == MOCK_REMOVAL["selected"]["confidence"]
        )
        assert record["not_selected"] == []


def test_get_user_behavior_returns_list(client: Any) -> None:
    """
    Test that GET /api/user-behavior returns 200 and a JSON array.
    """
    jsonl_content = json.dumps(MOCK_SELECTION) + "\n"
    with (
        patch("builtins.open", mock_open(read_data=jsonl_content)),
        patch("os.path.exists", return_value=True),
    ):
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
    with (
        patch("builtins.open", mock_open(read_data=jsonl_content)),
        patch("os.path.exists", return_value=True),
    ):
        response = client.get("/api/user-behavior")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_get_user_behavior_read_failure_returns_500(client: Any) -> None:
    """
    Test that GET /api/user-behavior returns 500 when the log file cannot be read.
    """
    with (
        patch("os.path.exists", return_value=True),
        patch("builtins.open", side_effect=OSError("permission denied")),
    ):
        response = client.get("/api/user-behavior")
    assert response.status_code == 500
