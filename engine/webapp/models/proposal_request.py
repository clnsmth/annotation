"""
Pydantic models for proposal requests, term details, and submitter information in the annotation
engine.
"""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class TermDetails(BaseModel):
    """
    Data model for ontology term details.
    """

    label: str
    description: str
    evidence_source: Optional[str] = None


class SubmitterInfo(BaseModel):
    """
    Data model for submitter information.
    """

    email: EmailStr
    orcid_id: Optional[str] = None
    attribution_consent: bool


class ProposalRequest(BaseModel):
    """
    Data model for a vocabulary proposal request.
    """

    target_vocabulary: str
    term_details: TermDetails
    submitter_info: SubmitterInfo
    proposed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
