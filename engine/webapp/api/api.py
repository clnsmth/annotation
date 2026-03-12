"""
API endpoints for the Semantic EML Annotator Backend.
"""

import json
import uuid
from typing import Any, Dict

import daiquiri
from fastapi import APIRouter, BackgroundTasks, HTTPException, Body, UploadFile, File
from fastapi.responses import JSONResponse, Response

from webapp.services.core import (
    ProposalRequest,
    send_email_notification,
    recommend_for_attribute,
    recommend_for_geographic_coverage,
)
from webapp.services.eml_parser import parse_eml, export_eml
from webapp.services.audit import generate_audit_report
from webapp.models.log_selection import LogSelection
from webapp.models.document_request import ExportRequest, AuditRequest

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
        # 1. Log to persistent mock database (file)
        # ADR 0001 specifies no external DB right now; we use a .jsonl stub
        # so that proposal records are safely preserved regardless of email failure.
        with open("proposals.jsonl", "a", encoding="utf-8") as f:
            f.write(proposal.model_dump_json() + "\n")

        # 2. Queue email dispatch
        background_tasks.add_task(send_email_notification, proposal)

        logger.info("Proposal logged to disk and email notification queued.")
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


@router.post("/api/documents/targets")
async def get_document_targets(file: UploadFile = File(...)) -> JSONResponse:
    """
    Accepts an uploaded EML file and returns the list of annotatable targets
    extracted by the canonical backend EML parser.

    :param file: Uploaded EML XML file (multipart/form-data)
    :return: JSONResponse containing a list of AnnotatableElement objects
    :raises HTTPException: 422 if the EML version is unsupported or the XML is malformed
    """
    try:
        contents = await file.read()
        xml_string = contents.decode("utf-8", errors="replace")
        elements = parse_eml(xml_string)
        logger.info(
            "get_document_targets: parsed %d elements from '%s'.",
            len(elements),
            file.filename,
        )
        return JSONResponse(content=elements, status_code=200)
    except ValueError as e:
        logger.warning("get_document_targets validation error: %s", e)
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        logger.exception("get_document_targets unexpected error: %s", e)
        raise HTTPException(
            status_code=500, detail="Internal server error parsing EML document."
        ) from e


@router.post("/api/documents/export")
def export_document(request: ExportRequest) -> Response:
    """
    Accepts an ExportRequest (original EML XML + annotatable elements with user
    decisions) and returns the updated EML XML with annotations applied.

    :param request: ExportRequest containing eml_xml and elements
    :return: Plain-text XML response with annotations applied
    :raises HTTPException: 422 if the XML is malformed, 500 on export errors
    """
    try:
        # Convert Pydantic models to plain dicts for the service layer
        elements_dicts = [el.model_dump() for el in request.elements]
        updated_xml = export_eml(request.eml_xml, elements_dicts)
        logger.info(
            "export_document: exported EML with %d elements.", len(elements_dicts)
        )
        return Response(content=updated_xml, media_type="application/xml")
    except ValueError as e:
        logger.warning("export_document validation error: %s", e)
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        logger.exception("export_document unexpected error: %s", e)
        raise HTTPException(
            status_code=500, detail="Internal server error exporting EML document."
        ) from e


@router.post("/api/documents/audit")
def export_audit(request: AuditRequest) -> Response:
    """
    Accepts an AuditRequest and returns a JSONL audit report of the decisions.

    :param request: AuditRequest containing elements and provenance
    :return: JSONL plain-text string
    :raises HTTPException: 500 on generation errors
    """
    try:
        report = generate_audit_report(request.elements, request.provenance)
        logger.info(
            "export_audit: generated audit report for %d elements.",
            len(request.elements),
        )
        # using application/x-ndjson as standard for JSONL
        return Response(content=report, media_type="application/x-ndjson")
    except Exception as e:
        logger.exception("export_audit unexpected error: %s", e)
        raise HTTPException(
            status_code=500, detail="Internal server error generating audit report."
        ) from e


__all__ = ["router"]
