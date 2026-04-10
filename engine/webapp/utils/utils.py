"""
Utility functions for ontology extraction, recommendation merging, and EML data formatting.
"""

import json
import os
import re
from collections import defaultdict
from typing import Any, Dict, List, Optional

import daiquiri
from pydantic import BaseModel
from webapp.config import Config

daiquiri.setup()
logger = daiquiri.getLogger(__name__)


def append_jsonl(path: str, record: BaseModel) -> None:
    """
    Append a Pydantic model as a newline-delimited JSON record to a file.

    :param path: File path to append to
    :param record: Pydantic model instance to serialise
    :raises OSError: If the file cannot be opened or written
    """
    with open(path, "a", encoding="utf-8") as f:
        f.write(record.model_dump_json() + "\n")


def read_jsonl(path: str) -> List[Dict[str, Any]]:
    """
    Read all records from a newline-delimited JSON file and return them as a list.

    :param path: File path to read from
    :return: List of parsed JSON objects; empty list if the file does not exist
    :raises OSError: If the file exists but cannot be read
    :raises json.JSONDecodeError: If a line is not valid JSON
    """
    if not os.path.exists(path):
        return []
    records: List[Dict[str, Any]] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                records.append(json.loads(line))
    return records


def extract_ontology(uri: Optional[str]) -> str:
    """
    Parses the ontology code (ENVO, PATO, IAO, ECSO, DWC) from a URI string.

    :param uri: The URI string to parse
    :return: The ontology code as a string, or 'UNKNOWN' if not found
    """
    if not uri:
        logger.warning("extract_ontology called with empty or None uri.")
        return "UNKNOWN"
    match = re.search(r"/obo/([A-Z]+)_", uri)
    if match:
        return match.group(1)
    match_ecso = re.search(r"/odo/(ECSO)_", uri)
    if match_ecso:
        return match_ecso.group(1)
    if "dwc/terms" in uri:
        return "DWC"
    if "oboe" in uri.lower():
        return "OBOE"
    logger.warning("extract_ontology could not parse ontology from uri: %s", uri)
    return "UNKNOWN"


def merge_recommender_results(
    source_items: List[Dict[str, Any]],
    recommender_items: List[Dict[str, Any]],
    eml_type: str = "ATTRIBUTE",
) -> List[Dict[str, Any]]:
    """
    Joins recommender response back to source items using 'column_name'.

    :param source_items: List of source item dictionaries
    :param recommender_items: List of recommender result dictionaries
    :param eml_type: EML type (e.g., 'ATTRIBUTE')
    :return: List of merged result dictionaries, each with an 'id' and 'recommendations'
    """
    config = Config.MERGE_CONFIG.get(eml_type)
    if not config:
        logger.error("No merge config found for eml_type: %s", eml_type)
        return []

    rec_lookup: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for rec in recommender_items:
        key = rec.get("column_name")
        if key:
            rec_lookup[key].append(rec)

    merged_results: List[Dict[str, Any]] = []
    for item in source_items:
        match_val = item.get("name")
        if match_val in rec_lookup:
            entry = {"id": item["id"], "recommendations": []}
            for rec_data in rec_lookup[match_val]:
                try:
                    annot = {
                        "label": rec_data["concept_name"],
                        "uri": rec_data["concept_id"],
                        "ontology": extract_ontology(rec_data["concept_id"]),
                        "confidence": rec_data["confidence"],
                        "description": rec_data["concept_definition"],
                        "propertyLabel": config["property_label"],
                        "propertyUri": config["property_uri"],
                        "attributeName": item.get("name"),
                        "objectName": item.get("objectName"),
                    }
                    entry["recommendations"].append(annot)
                except (KeyError, TypeError, ValueError) as e:
                    logger.exception(
                        "Error merging recommender result for item %s: %s",
                        item.get("id"),
                        e,
                    )
            # Keep only the top-N recommendations by confidence
            max_recs = Config.MAX_RECOMMENDATIONS_PER_ELEMENT
            entry["recommendations"].sort(
                key=lambda r: r.get("confidence", 0.0),
                reverse=True,
            )
            entry["recommendations"] = entry["recommendations"][:max_recs]
            merged_results.append(entry)
    logger.info("Merged %d source items with recommender results.", len(merged_results))
    return merged_results


def reformat_attribute_elements(
    attributes: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Transform attribute elements to the format expected by the attribute recommender.

    :param attributes: List of attribute dictionaries
    :return: List of reformatted attribute dictionaries
    """
    reformatted: List[Dict[str, Any]] = []
    for attr in attributes:
        try:
            reformatted.append(
                {
                    "column_id": attr.get("id", ""),
                    "column_name": attr.get("name", ""),
                    "column_description": attr.get("description", ""),
                    "object_name": attr.get("objectName", ""),
                    "entity_name": attr.get("context") or attr.get("objectName", ""),
                    "entity_description": attr.get("contextDescription", ""),
                }
            )
        except (KeyError, TypeError, ValueError) as e:
            logger.exception("Error reformatting attribute element: %s", e)
    logger.info("Reformatted %d attribute elements.", len(reformatted))
    return reformatted


def reformat_geographic_coverage_elements(
    geos: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Stub: Transform geographic coverage elements to the format expected by the geographic coverage
    recommender. For now, returns input unchanged.

    :param geos: List of geographic coverage dictionaries
    :return: List of geographic coverage dictionaries (unchanged)
    """
    logger.info("Reformatting %d geographic coverage elements (stub).", len(geos))
    return geos
