"""
Pydantic models for validating log-behavior POST requests in the annotation engine.
"""

from datetime import datetime
from typing import List, Literal
from pydantic import BaseModel


class SelectionItem(BaseModel):
    """
    Represents a selectable or non-selectable item in a log-behavior event.
    """

    label: str
    uri: str
    property_label: str
    property_uri: str
    confidence: float


class LogBehavior(BaseModel):
    """
    Pydantic model for validating the log-behavior POST payload.
    """

    event_type: Literal["selection", "custom_annotation", "removal"]
    request_id: str
    event_id: str
    timestamp: datetime
    element_id: str
    element_name: str
    element_type: str
    selected: SelectionItem
    not_selected: List[SelectionItem]


# Backward-compatible alias retained to avoid breaking existing imports.
# Should be removed once all callers have been updated to use LogBehavior directly.
LogSelection = LogBehavior
