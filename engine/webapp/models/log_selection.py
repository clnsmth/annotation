"""
Pydantic models for validating log-selection POST requests in the annotation engine.
"""

from typing import List
from pydantic import BaseModel


class SelectionItem(BaseModel):
    """
    Represents a selectable or non-selectable item in a log-selection event.
    """

    label: str
    uri: str
    property_label: str
    property_uri: str
    confidence: float


class LogSelection(BaseModel):
    """
    Pydantic model for validating the log-selection POST payload.
    """

    request_id: str
    event_id: str
    timestamp: str  # ISO 8601 string, could use datetime with custom parsing
    element_id: str
    element_name: str
    element_type: str
    selected: SelectionItem
    not_selected: List[SelectionItem]
