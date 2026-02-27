"""
API endpoints for the Semantic EML Annotator Backend.
"""

import json
import uuid
from typing import Any, Dict

import daiquiri
from fastapi import APIRouter, BackgroundTasks, HTTPException, Body
from fastapi.responses import JSONResponse

from webapp.services.core import (
    ProposalRequest,
    send_email_notification,
    recommend_for_attribute,
    recommend_for_geographic_coverage,
)
from webapp.models.log_selection import LogSelection

daiquiri.setup()
logger = daiquiri.getLogger(__name__)

router = APIRouter()


@router.get("/")
def read_root() -> Dict[str, str]:
    """
    Health check endpoint for the backend service.

    :return: A status message indicating the backend is running
    """
    logger.info("Health check endpoint called.")
    return {"message": "Semantic EML Annotator Backend is running."}


@router.post("/api/proposals")
async def submit_proposal(
    proposal: ProposalRequest, background_tasks: BackgroundTasks
) -> Dict[str, str]:
    """
    Receives a new term proposal and queues an email notification.

    :param proposal: The proposal request payload
    :param background_tasks: FastAPI background task manager
    :return: Status message
    :raises HTTPException: If an error occurs during processing
    """
    try:
        background_tasks.add_task(send_email_notification, proposal)
        logger.info("Proposal received and email notification queued.")
        return {"status": "success", "message": "Proposal received and processing."}
    except Exception as e:
        logger.exception("Error processing proposal: %s", e)
        raise HTTPException(
            status_code=500, detail="Internal server error processing proposal."
        ) from e


@router.post("/api/recommendations")
def recommend_annotations(payload: Dict[str, Any] = Body(...)) -> JSONResponse:
    """
    Accepts a JSON payload of EML metadata elements grouped by type (e.g. ATTRIBUTE,
    GEOGRAPHICCOVERAGE), parses the types, fans out to respective recommendation engines, and
    combines the results. Implements a gateway aggregation pattern for annotation recommendations.
    If no recognized types are present, returns the original mock response for backward
    compatibility.

    :param payload: The request payload containing EML metadata elements
    :return: JSONResponse with the recommendations or an empty list
    :raises HTTPException: If an error occurs during processing
    """
    logger.info("Received recommendation payload: %s", json.dumps(payload, indent=2))
    results = []
    request_id = str(uuid.uuid4())
    try:
        if "ATTRIBUTE" in payload:
            recommended_attributes = recommend_for_attribute(
                payload["ATTRIBUTE"], request_id=request_id
            )
            results.append(recommended_attributes)
        if "GEOGRAPHICCOVERAGE" in payload:
            recommended_geographic_coverage = recommend_for_geographic_coverage(
                payload["GEOGRAPHICCOVERAGE"], request_id=request_id
            )
            results.append(recommended_geographic_coverage)
        if results:
            flat_results = [item for sublist in results for item in sublist]
            logger.info("Returning %d recommendation results.", len(flat_results))
            return JSONResponse(content=flat_results, status_code=200)
        logger.warning("No recognized types in payload. Returning empty list.")
        return JSONResponse(content=[], status_code=200)
    except Exception as e:
        logger.exception("Error in /api/recommendations: %s", e)
        raise HTTPException(
            status_code=500, detail="Internal server error processing recommendations."
        ) from e


@router.post("/api/log-selection")
async def log_selection(payload: LogSelection):
    """
    Receives a log-selection POST payload, prints it for debugging, and returns a status response.

    :param payload: The validated log-selection payload
    :return: Status message indicating receipt
    """
    print("\n--- 🐍 Incoming Python Beacon ---")
    print(json.dumps(payload.model_dump(), indent=2))
    print("---------------------------------\n")
    return {"status": "received"}


__all__ = ["router"]
