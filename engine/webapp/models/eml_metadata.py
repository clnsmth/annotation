"""
Pydantic model for EML metadata elements used in the annotation engine.
"""

from pydantic import BaseModel


class EMLMetadata(BaseModel):
    """
    Data model for EML metadata elements.
    """

    elements: dict = {}
