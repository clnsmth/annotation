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
from webapp.utils.utils import (
    extract_ontology,
    merge_recommender_results,
    reformat_attribute_elements,
)
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
    Evidence Source: {proposal.term_details.evidence_source or "None provided"}
    --- Submitter Information ---
    Email: {proposal.submitter_info.email}
    ORCID: {proposal.submitter_info.orcid_id or "None provided"}
    Attribution Consent: {"Yes" if proposal.submitter_info.attribution_consent else "No"}
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


def _fetch_attribute_recommendations_batch(
    api_url: str, api_payload: List[Dict[str, Any]], object_name: str
) -> List[Dict[str, Any]]:
    """
    Submits attribute recommendations payload to the remote API in batches.
    """
    recommender_response: List[Dict[str, Any]] = []
    batch_size = Config.ANNOTATE_BATCH_SIZE
    for i in range(0, len(api_payload), batch_size):
        chunk = api_payload[i : i + batch_size]
        try:
            response = requests.post(api_url, json=chunk, timeout=60)
            response.raise_for_status()
            raw_response = response.json()
            chunk_response = _normalize_recommender_response(raw_response)
            recommender_response.extend(chunk_response)
        except requests.exceptions.RequestException as e:
            print(
                f"An error occurred for {object_name} (chunk {i // batch_size + 1}): {e}"
            )
            continue
    return recommender_response


# pylint: disable=too-many-locals
def recommend_for_attribute(
    attributes: List[Dict[str, Any]], request_id: str | None = None
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
            api_payload = reformat_attribute_elements(file_attributes)
            recommender_response = _fetch_attribute_recommendations_batch(
                api_url, api_payload, object_name
            )

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
    geos: List[Dict[str, Any]], request_id: str | None = None
) -> List[Dict[str, Any]]:
    """
    Recommender for geographic coverage elements.

    When USE_MOCK_RECOMMENDATIONS is True, returns pre-built mock data.
    Otherwise, converts each geographic coverage element to GeoJSON,
    resolves via geoenv data sources, and formats the mapped ENVO terms
    as annotation recommendations.

    :param geos: List of geographic coverage dictionaries
    :param request_id: The request UUID to include in each recommendation
    :return: List of recommendation results per geographic coverage
    """
    if Config.USE_MOCK_RECOMMENDATIONS:
        import copy

        results = []
        geo_ids = {g.get("id") for g in geos if g.get("id")}

        for mock_item in MOCK_GEOGRAPHICCOVERAGE_RECOMMENDATIONS:
            if mock_item.get("id") in geo_ids:
                # Deepcopy to prevent mutating the global mock object
                item_copy = copy.deepcopy(mock_item)
                for rec in item_copy.get("recommendations", []):
                    rec["request_id"] = request_id
                results.append(item_copy)

        return results

    # --- Real geoenv path ---
    import asyncio
    import json
    import daiquiri
    from geoenv.geometry import Geometry
    from geoenv.resolver import Resolver
    from geoenv.data_sources import (
        WorldTerrestrialEcosystems,
        EcologicalMarineUnits,
        EcologicalCoastalUnits,
    )
    from webapp.utils.eml_geo import GeographicCoverage

    logger = daiquiri.getLogger(__name__)
    final_output: List[Dict[str, Any]] = []

    for geo in geos:
        geo_id = geo.get("id")
        entry: Dict[str, Any] = {"id": geo_id, "recommendations": []}

        try:
            # Convert EML geographic coverage to GeoJSON
            geo_cov = GeographicCoverage(geo)
            geojson_str = geo_cov.to_geojson_geometry()
            if not geojson_str:
                logger.warning("No GeoJSON geometry for geo coverage '%s'.", geo_id)
                final_output.append(entry)
                continue

            geojson_dict = json.loads(geojson_str)
            geometry = Geometry(geojson_dict)

            # Resolve with all available data sources
            data_sources = [
                WorldTerrestrialEcosystems(),
                EcologicalMarineUnits(),
                EcologicalCoastalUnits(),
            ]
            resolver = Resolver(data_sources)
            response = asyncio.run(resolver.resolve(geometry))

            # Parse mapped properties from the response
            seen_uris: set = set()
            environments = response.data.get("properties", {}).get("environment", [])
            for env in environments:
                for mapped in env.get("mappedProperties", []):
                    uri = mapped.get("uri")
                    label = mapped.get("label")
                    if not uri or not label:
                        continue
                    if uri in seen_uris:
                        continue
                    seen_uris.add(uri)
                    entry["recommendations"].append(
                        {
                            "label": label,
                            "uri": uri,
                            "ontology": extract_ontology(uri),
                            "confidence": 0.90,
                            "description": "",
                            "propertyLabel": ("broad-scale environmental context"),
                            "propertyUri": (
                                "https://genomicsstandardsconsortium.github.io"
                                "/mixs/0000012/"
                            ),
                            "request_id": request_id,
                        }
                    )

        except Exception as e:
            logger.exception("Error resolving geo coverage '%s': %s", geo_id, e)

        final_output.append(entry)

    return final_output
