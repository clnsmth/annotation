"""
Tests for the batch EML annotator runner script.
"""

from unittest.mock import patch, mock_open
import pytest

from webapp.batch import process_file
from webapp.models.annotatable_element import AnnotatableElement


@pytest.fixture
def mock_xml_content():
    return '<eml:eml><dataset><title>Mock EML</title><dataTable id="dt1"><attribute id="attr1"><attributeName>temp</attributeName></attribute></dataTable></dataset></eml:eml>'


@pytest.fixture
def mock_elements():
    return [
        AnnotatableElement(
            id="attr1",
            path="/eml/dataset/dataTable/attribute",
            context="dt1",
            name="temp",
            description="Temperature",
            type="ATTRIBUTE",
            status="PENDING",
        )
    ]


@patch("webapp.batch.generate_audit_report")
@patch("webapp.batch.export_eml")
@patch("webapp.batch.recommend_for_attribute")
@patch("webapp.batch.parse_eml")
def test_process_file_adopts_recommendation(
    mock_parse_eml,
    mock_recommend_for_attribute,
    mock_export_eml,
    mock_generate_audit_report,
    mock_xml_content,
    mock_elements,
):
    """
    Test that process_file correctly parses an EML, gets recommendations,
    algorithmically adopts passing recommendations, and writes outputs.
    """
    mock_parse_eml.return_value = mock_elements

    # Mock the recommender response
    mock_recommend_for_attribute.return_value = [
        {
            "id": "attr1",
            "recommendations": [
                {
                    "label": "Sea Surface Temperature",
                    "uri": "http://purl.dataone.org/odo/ECSO_00001227",
                    "ontology": "ECSO",
                    "confidence": 0.95,
                },
                {
                    "label": "Air Temperature",
                    "uri": "http://purl.dataone.org/odo/ECSO_00001226",
                    "ontology": "ECSO",
                    "confidence": 0.60,
                },
            ],
        }
    ]

    mock_export_eml.return_value = "<eml:eml>Annotated</eml:eml>"
    mock_generate_audit_report.return_value = '{"audit": "report"}'

    # Mock filesystem
    m_open = mock_open(read_data=mock_xml_content)
    with patch("builtins.open", m_open):
        with patch("os.makedirs"):
            process_file("input_dir/test.xml", "output_dir", 0.8)

    # Assertions
    mock_parse_eml.assert_called_once_with(mock_xml_content)
    mock_recommend_for_attribute.assert_called_once()

    # Verify the algorithmic adoption happened correctly
    element = mock_elements[0]
    assert element.status == "APPROVED"
    assert len(element.currentAnnotations) == 1
    assert element.currentAnnotations[0].label == "Sea Surface Temperature"

    # Export and audit should be called
    mock_export_eml.assert_called_once()
    mock_generate_audit_report.assert_called_once()

    # Files should be written
    write_calls = m_open().write.call_args_list
    assert any("<eml:eml>Annotated</eml:eml>" in call.args for call in write_calls)
    assert any('{"audit": "report"}' in call.args for call in write_calls)


@patch("webapp.batch.recommend_for_attribute")
@patch("webapp.batch.parse_eml")
def test_process_file_ignores_low_confidence(
    mock_parse_eml, mock_recommend_for_attribute, mock_elements, mock_xml_content
):
    """
    Test that recommendations below the threshold are not adopted.
    """
    mock_parse_eml.return_value = mock_elements
    mock_recommend_for_attribute.return_value = [
        {
            "id": "attr1",
            "recommendations": [
                {
                    "label": "Some Term",
                    "uri": "http://example.com/term",
                    "ontology": "TEST",
                    "confidence": 0.75,  # Below the 0.8 threshold
                }
            ],
        }
    ]

    m_open = mock_open(read_data=mock_xml_content)
    with patch("builtins.open", m_open):
        with patch("webapp.batch.export_eml"):
            with patch("webapp.batch.generate_audit_report"):
                process_file("input_dir/test.xml", "output_dir", 0.8)

    element = mock_elements[0]
    assert element.status == "PENDING"
    assert len(element.currentAnnotations) == 0
