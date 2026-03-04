"""
Tests for utility functions: merge_recommender_results and _normalize_recommender_response.
"""

from typing import Any, Dict, List

from webapp.utils.utils import merge_recommender_results
from webapp.services.core import _normalize_recommender_response


_VALID_REC: Dict[str, Any] = {
    "column_name": "col1",
    "concept_name": "Water",
    "concept_id": "http://purl.obolibrary.org/obo/ENVO_00002006",
    "confidence": 0.95,
    "concept_definition": "Liquid water.",
}

_SOURCE_ITEM: Dict[str, Any] = {
    "id": "abc-123",
    "name": "col1",
    "objectName": "data.csv",
}


def test_merge_recommender_results_unknown_eml_type() -> None:
    """
    merge_recommender_results returns an empty list when the eml_type is not in MERGE_CONFIG.
    """
    results = merge_recommender_results([_SOURCE_ITEM], [_VALID_REC], "UNKNOWN_TYPE")
    assert results == []


def test_merge_recommender_results_no_column_name_matches() -> None:
    """
    merge_recommender_results returns an empty list when no recommender item matches
    a source item by column_name.
    """
    rec_no_match: Dict[str, Any] = {**_VALID_REC, "column_name": "unrelated_col"}
    results = merge_recommender_results([_SOURCE_ITEM], [rec_no_match], "ATTRIBUTE")
    assert results == []


def test_merge_recommender_results_malformed_recommender_item() -> None:
    """
    merge_recommender_results gracefully handles a recommender item that is missing
    required fields, resulting in an entry with an empty recommendations list.
    """
    malformed_rec: Dict[str, Any] = {"column_name": "col1"}  # missing concept_name etc.
    results = merge_recommender_results([_SOURCE_ITEM], [malformed_rec], "ATTRIBUTE")
    assert isinstance(results, list)
    assert len(results) == 1
    assert results[0]["id"] == "abc-123"
    assert results[0]["recommendations"] == []


def test_merge_recommender_results_happy_path() -> None:
    """
    merge_recommender_results correctly merges a matching source item and recommender item.
    """
    results = merge_recommender_results([_SOURCE_ITEM], [_VALID_REC], "ATTRIBUTE")
    assert len(results) == 1
    assert results[0]["id"] == "abc-123"
    recs = results[0]["recommendations"]
    assert len(recs) == 1
    assert recs[0]["label"] == "Water"
    assert recs[0]["uri"] == "http://purl.obolibrary.org/obo/ENVO_00002006"
    assert recs[0]["ontology"] == "ENVO"
    assert recs[0]["confidence"] == 0.95
    assert recs[0]["attributeName"] == "col1"
    assert recs[0]["objectName"] == "data.csv"


# ---------------------------------------------------------------------------
# _normalize_recommender_response
# ---------------------------------------------------------------------------


def test_normalize_recommender_response_dict_caps_at_five() -> None:
    """
    _normalize_recommender_response limits each column to 5 items when the input
    is a dict keyed by column name.
    """
    raw: Dict[str, List[Dict[str, Any]]] = {
        "col1": [{"concept_name": str(i)} for i in range(10)]
    }
    result = _normalize_recommender_response(raw)
    assert len(result) == 5
    assert all(r["column_name"] == "col1" for r in result)


def test_normalize_recommender_response_dict_preserves_existing_column_name() -> None:
    """
    _normalize_recommender_response does not overwrite column_name if already present.
    """
    raw: Dict[str, List[Dict[str, Any]]] = {
        "col1": [{"concept_name": "A", "column_name": "existing_col"}]
    }
    result = _normalize_recommender_response(raw)
    assert result[0]["column_name"] == "existing_col"


def test_normalize_recommender_response_list_passthrough() -> None:
    """
    _normalize_recommender_response returns the list unchanged when the input is a list.
    """
    raw: List[Dict[str, Any]] = [{"concept_name": "A"}, {"concept_name": "B"}]
    result = _normalize_recommender_response(raw)
    assert result == raw
