"""
Pytest fixtures for FastAPI test client and mock payloads for the annotation engine.
"""

import pytest
from fastapi.testclient import TestClient
from webapp.run import app
from webapp.models.mock_objects import (
    MOCK_FRONTEND_PAYLOAD,
    MOCK_GEOGRAPHICCOVERAGE_RECOMMENDATIONS,
)


@pytest.fixture(scope="session")
def client():
    """
    Fixture for FastAPI test client using the application instance.
    """
    return TestClient(app)


@pytest.fixture(scope="session")
def mock_payload():
    """
    Fixture for providing a mock frontend payload for tests.
    """
    return MOCK_FRONTEND_PAYLOAD


@pytest.fixture(scope="session")
def mock_geo_coverage():
    """
    Fixture for providing mock geographic coverage recommendations for tests.
    """
    return MOCK_GEOGRAPHICCOVERAGE_RECOMMENDATIONS
