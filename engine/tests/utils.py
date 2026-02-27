"""
Test utilities for updating the recommendations snapshot using the FastAPI test client.
"""

import json
import os
from fastapi.testclient import TestClient
from fastapi import FastAPI
from webapp.models.mock_objects import MOCK_FRONTEND_PAYLOAD
from webapp.run import app
from webapp.api.api import router


def update_snapshot_recommendations_response() -> None:
    """
    Update the snapshot_recommendations_response.json file with the current
    response from the /api/recommendations endpoint using MOCK_FRONTEND_PAYLOAD.

    :raises AssertionError: If the response status code is not 200
    :raises Exception: If writing the snapshot file fails
    """
    payload = MOCK_FRONTEND_PAYLOAD
    response = TestClient(app).post("/api/recommendations", json=payload)
    assert response.status_code == 200, f"Request failed: {response.status_code}"
    data = response.json()
    snapshot_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "tests",
        "snapshot_recommendations_response.json",
    )
    print(f"Attempting to write snapshot to: {os.path.abspath(snapshot_path)}")
    try:
        with open(snapshot_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, sort_keys=False)
        print(f"Snapshot updated successfully: {os.path.abspath(snapshot_path)}")
    except Exception as e:
        print(f"Failed to update snapshot: {e}")
        raise


if __name__ == "__main__":
    # This allows the script to be run directly for updating the snapshot

    app = FastAPI()
    app.include_router(router)
    client = TestClient(app)

    update_snapshot_recommendations_response()
