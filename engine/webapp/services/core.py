"""
Core business logic and data models for the Semantic EML Annotator Backend.
"""

from itertools import groupby
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any
import smtplib
import requests
from webapp.config import Config
from webapp.utils.utils import merge_recommender_results
from webapp.models.mock_objects import (
    MOCK_RAW_ATTRIBUTE_RECOMMENDATIONS_BY_FILE,
    MOCK_GEOGRAPHICCOVERAGE_RECOMMENDATIONS,
)
from webapp.models.proposal_request import ProposalRequest


def send_email_notification(proposal: ProposalRequest) -> None:
    """
    Sends an email with the proposal details to the configured recipient.
    Credentials and recipient are set via config.py only.

    :param proposal: The proposal request payload
    :return: None
    """
    recipient = Config.VOCABULARY_PROPOSAL_RECIPIENT
    smtp_server = Config.SMTP_SERVER
    smtp_port = Config.SMTP_PORT
    smtp_user = Config.SMTP_USER
    smtp_password = Config.SMTP_PASSWORD
    if not recipient:
        print(
            "Warning: VOCABULARY_PROPOSAL_RECIPIENT not set. Skipping email dispatch."
        )
        print(f"Payload received: {proposal.model_dump_json(indent=2)}")
        return
    if not smtp_user or not smtp_password:
        print("Warning: SMTP credentials not set. Cannot send email.")
        return
    msg = MIMEMultipart()
    msg["From"] = smtp_user
    msg["To"] = recipient
    msg["Subject"] = f"New Ontology Term Proposal: {proposal.term_details.label}"
    body = f"""
    New Term Proposal Received via Semantic EML Annotator
    --- Context ---
    Target Vocabulary/Category: {proposal.target_vocabulary}
    --- Term Details ---
    Label: {proposal.term_details.label}
    Description: 
    {proposal.term_details.description}
    Evidence Source: {proposal.term_details.evidence_source or 'None provided'}
    --- Submitter Information ---
    Email: {proposal.submitter_info.email}
    ORCID: {proposal.submitter_info.orcid_id or 'None provided'}
    Attribution Consent: {'Yes' if proposal.submitter_info.attribution_consent else 'No'}
    """
    msg.attach(MIMEText(body, "plain"))
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_user, recipient, text)
        server.quit()
        print(f"Proposal email successfully sent to {recipient}")
    except (smtplib.SMTPException, OSError) as e:
        print(f"Failed to send email: {e}")


def _normalize_recommender_response(raw_response):
    """
    Normalize the recommender API response to a flat list of dicts.
    """
    recommender_response = []
    if isinstance(raw_response, dict):
        for col_name, recs in raw_response.items():
            for r in recs[:5]:
                if "column_name" not in r:
                    r["column_name"] = col_name
                recommender_response.append(r)
    elif isinstance(raw_response, list):
        recommender_response = raw_response
    return recommender_response


# pylint: disable=too-many-locals
def recommend_for_attribute(
    attributes: List[Dict[str, Any]], request_id: str = None
) -> List[Dict[str, Any]]:
    """
    Groups attributes by objectName, sends to API (or gets mock per file), and merges results.

    :param attributes: List of attribute dictionaries
    :param request_id: The request UUID to include in each recommendation object
    :return: List of merged recommendation results for attributes
    """
    api_url = Config.API_URL
    attributes.sort(key=lambda x: x.get("objectName", "unknown"))
    final_output: List[Dict[str, Any]] = []
    # Group by File (object_name)
    for object_name, group_iter in groupby(
        attributes, key=lambda x: x.get("objectName", "unknown")
    ):
        file_attributes = list(group_iter)
        recommender_response: List[Dict[str, Any]] = []
        if Config.USE_MOCK_RECOMMENDATIONS:
            recommender_response = MOCK_RAW_ATTRIBUTE_RECOMMENDATIONS_BY_FILE.get(
                object_name, []
            )
            # Merge results for this file group using the retrieved mock data
            file_results = merge_recommender_results(
                file_attributes, recommender_response, "ATTRIBUTE"
            )
            # Add request_id to each recommendation in each result
            for item in file_results:
                for rec in item.get("recommendations", []):
                    rec["request_id"] = request_id
            final_output.extend(file_results)
        else:
            # REAL API LOGIC
            api_payload = [
                {k: v for k, v in i.items() if k != "id"} for i in file_attributes
            ]
            try:
                response = requests.post(api_url, json=api_payload, timeout=60)
                response.raise_for_status()
                raw_response = response.json()
                recommender_response = _normalize_recommender_response(raw_response)
            except requests.exceptions.RequestException as e:
                print(f"An error occurred for {object_name}: {e}")
                continue
            # Merge results for this file group
            file_results = merge_recommender_results(
                file_attributes, recommender_response, "ATTRIBUTE"
            )
            for item in file_results:
                for rec in item.get("recommendations", []):
                    rec["request_id"] = request_id
            final_output.extend(file_results)
    return final_output


def recommend_for_geographic_coverage(
    geos: List[Dict[str, Any]], request_id: str = None
) -> List[Dict[str, Any]]:
    """
    Stub recommender for geographic coverage elements.

    :param geos: List of geographic coverage dictionaries
    :param request_id: The request UUID to include in each recommendation object
    :return: Mock recommendations if enabled, otherwise an empty list
    """
    # pylint: disable=unused-argument
    if Config.USE_MOCK_RECOMMENDATIONS:
        results = MOCK_GEOGRAPHICCOVERAGE_RECOMMENDATIONS.copy()
        # Add request_id to each recommendation in each result
        for item in results:
            for rec in item.get("recommendations", []):
                rec["request_id"] = request_id
        return results
    return []
