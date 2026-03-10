"""
Pydantic request/response models for the document ingestion and export endpoints.
"""

from pydantic import BaseModel, Field
from webapp.models.annotatable_element import AnnotatableElement


class ExportRequest(BaseModel):
    """
    Request body for the /api/documents/export endpoint.

    :cvar eml_xml: Raw EML XML string to annotate and export
    :cvar elements: List of annotatable elements with user decisions applied
    """

    eml_xml: str
    elements: list[AnnotatableElement]


class AuditRequest(BaseModel):
    """
    Request body for the /api/documents/audit endpoint.

    :cvar elements: List of annotatable elements with user decisions applied
    :cvar provenance: Optional dictionary of provenance metadata
    """

    elements: list[AnnotatableElement]
    provenance: dict[str, str] = Field(default_factory=dict)


__all__ = ["ExportRequest", "AuditRequest"]
