"""
Service for generating an audit report artifact from a set of annotatable elements.
"""

import json
from datetime import datetime, timezone
from typing import Optional

from webapp.models.annotatable_element import AnnotatableElement


def generate_audit_report(
    elements: list[AnnotatableElement],
    provenance: Optional[dict[str, str]] = None,
) -> str:
    """
    Generates a JSONL (JSON Lines) formatted audit report detailing annotation
    recommendations, decisions, and metadata.

    :param elements: List of annotatable elements with user decisions
    :param provenance: Optional provenance metadata dictionary
    :return: A JSONL formatted string
    """
    if provenance is None:
        provenance = {}

    provenance_record = {
        "event_type": "audit_metadata",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "provenance": provenance,
    }

    lines = [json.dumps(provenance_record)]

    for element in elements:
        record = {
            "event_type": "element_decision",
            "element": element.model_dump(exclude_unset=True),
        }
        lines.append(json.dumps(record))

    return "\n".join(lines) + "\n"


__all__ = ["generate_audit_report"]
