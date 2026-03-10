"""
Pydantic models for annotatable EML elements and their ontology term annotations.
"""

from typing import Literal, Optional
from pydantic import BaseModel


class OntologyTerm(BaseModel):
    """
    Represents a single ontology term annotation applied to or recommended for an EML element.

    :cvar label: Human-readable label for the ontology term
    :cvar uri: Canonical URI of the ontology term
    :cvar ontology: Short ontology code (e.g. ECSO, ENVO, QUDT)
    :cvar confidence: Recommender confidence score (0.0–1.0)
    :cvar description: Optional term definition or description
    :cvar propertyLabel: Human-readable label for the annotation property
    :cvar propertyUri: URI of the annotation property
    :cvar attributeName: Source attribute name (for recommendation tracing)
    :cvar objectName: Source data object/file name (for recommendation tracing)
    :cvar request_id: UUID of the recommender request that produced this term
    """

    label: str
    uri: str
    ontology: str
    confidence: Optional[float] = None
    description: Optional[str] = None
    propertyLabel: Optional[str] = None
    propertyUri: Optional[str] = None
    attributeName: Optional[str] = None
    objectName: Optional[str] = None
    request_id: Optional[str] = None


ElementType = Literal[
    "ATTRIBUTE",
    "COVERAGE",
    "DATASET",
    "DATATABLE",
    "OTHERENTITY",
    "SPATIALRASTER",
    "SPATIALVECTOR",
    "OTHER",
]

AnnotationStatus = Literal["PENDING", "APPROVED", "IGNORED", "REVIEW_REQUIRED"]


class AnnotatableElement(BaseModel):
    """
    Represents a single annotatable target extracted from an EML document.

    :cvar id: Canonical element ID (from XML id= attribute or XPath hash fallback)
    :cvar path: XPath-style logical path within the EML document
    :cvar context: Parent entity name or descriptive context label
    :cvar contextDescription: Description of the parent entity (if available)
    :cvar objectName: Physical file/object name associated with this element
    :cvar name: Element name (e.g. attribute name, entity name, dataset title)
    :cvar description: Element definition or description text
    :cvar type: EML element type category
    :cvar currentAnnotations: Annotations currently applied to this element
    :cvar recommendedAnnotations: Annotations suggested by the recommender service
    :cvar status: Current annotation workflow status
    """

    id: str
    path: str
    context: str
    contextDescription: Optional[str] = None
    objectName: Optional[str] = None
    name: str
    description: str
    type: ElementType
    currentAnnotations: list[OntologyTerm] = []
    recommendedAnnotations: list[OntologyTerm] = []
    status: AnnotationStatus = "PENDING"


__all__ = ["OntologyTerm", "AnnotatableElement", "ElementType", "AnnotationStatus"]
