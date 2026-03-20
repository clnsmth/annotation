"""
Selection strategies for determining which AI recommendations to auto-approve.
"""
from typing import Any, Dict


def select_attribute_recommendations(
    rec_data: Dict[str, Any], element: Dict[str, Any]
) -> None:
    """
    Selects the highest ranked recommendation and appends it to the element's current annotations.

    :param rec_data: The dictionary output from `recommend_for_attribute` for this matched element.
    :param element: The target EML `AnnotatableElement` dict to modify.
    """
    if rec_data and rec_data.get("recommendations"):
        # Select ONLY the highest ranked recommendation
        best_rec = rec_data["recommendations"][0]
        element.setdefault("currentAnnotations", []).append(best_rec)
        element["status"] = "APPROVED"


def select_coverage_recommendations(
    rec_data: Dict[str, Any], element: Dict[str, Any]
) -> None:
    """
    Selects all available geographic coverage recommendations and extends the element's annotations.

    :param rec_data: The dictionary output from `recommend_for_geographic_coverage`.
    :param element: The target EML `AnnotatableElement` dict to modify.
    """
    if rec_data and rec_data.get("recommendations"):
        # Select ALL available recommendations
        element.setdefault("currentAnnotations", []).extend(rec_data["recommendations"])
        element["status"] = "APPROVED"
