"""
Batch processing script for the Semantic EML Annotator.
Orchestrates the canonical ingestion, recommendation, annotation,
and export of large corpora of EML documents algorithmically.
"""

import os
import glob
import uuid
import argparse
from typing import List

import daiquiri
from pydantic import ValidationError

from webapp.services.eml_parser import parse_eml, export_eml
from webapp.services.core import (
    recommend_for_attribute,
    recommend_for_geographic_coverage,
)
from webapp.services.audit import generate_audit_report
from webapp.models.annotatable_element import AnnotatableElement, OntologyTerm

daiquiri.setup(level="INFO")
logger = daiquiri.getLogger(__name__)


def process_file(file_path: str, output_dir: str, confidence_threshold: float):
    """
    Processes a single EML file through the annotation pipeline.
    """
    filename = os.path.basename(file_path)
    logger.info("Processing file: %s", filename)

    with open(file_path, "r", encoding="utf-8") as f:
        xml_string = f.read()

    # 1. Parse EML
    try:
        elements: List[AnnotatableElement] = parse_eml(xml_string)
    except Exception as e:
        logger.error("Failed to parse %s: %s", filename, e)
        return

    # 2. Group by type for recommendation requests
    request_id = str(uuid.uuid4())
    attributes = []
    geos = []

    for el in elements:
        # Convert to dict for the core service
        el_dict = el.model_dump()
        if el.type == "ATTRIBUTE":
            attributes.append(el_dict)
        elif el.type == "GEOGRAPHICCOVERAGE":
            geos.append(el_dict)

    # 3. Get Recommendations
    rec_results = []
    if attributes:
        rec_results.extend(recommend_for_attribute(attributes, request_id=request_id))
    if geos:
        rec_results.extend(
            recommend_for_geographic_coverage(geos, request_id=request_id)
        )

    # Build a lookup map from returned rec_results
    # The recommender functions return dicts with 'id' and 'recommendations'
    rec_map = {}
    for result in rec_results:
        rec_map[result["id"]] = result.get("recommendations", [])

    # 4. Adopt Recommendations Algorithmically
    adopted_count = 0
    for el in elements:
        recs = rec_map.get(el.id, [])
        # convert recs to OntologyTerm objects
        try:
            el.recommendedAnnotations = [OntologyTerm(**r) for r in recs]
        except ValidationError as e:
            logger.warning("Validation error on recommendations for %s: %s", el.id, e)
            continue

        # Select best recommendation
        if el.recommendedAnnotations:
            best_rec = max(el.recommendedAnnotations, key=lambda x: x.confidence or 0.0)
            if (best_rec.confidence or 0.0) >= confidence_threshold:
                el.status = "APPROVED"
                # If there's an existing annotation we might want to preserve it, but
                # for algorithmic batch application we assume we just apply the highest confidence one.
                # In the event of a tie, max() naturally returns the first encountered.
                el.currentAnnotations = [best_rec]
                adopted_count += 1

    logger.info("Adopted %d recommendations for %s", adopted_count, filename)

    # 5. Export EML
    elements_dicts = [el.model_dump() for el in elements]
    updated_xml = export_eml(xml_string, elements_dicts)

    # 6. Generate Audit Report
    provenance = {
        "execution_mode": "batch",
        "script": "webapp/batch.py",
        "confidence_threshold": str(confidence_threshold),
        "source_file": filename,
        "batch_request_id": request_id,
    }
    audit_report = generate_audit_report(elements, provenance)

    # 7. Write to Output Directory
    out_xml_path = os.path.join(output_dir, filename)
    out_audit_path = os.path.join(output_dir, f"{filename}_audit.jsonl")

    with open(out_xml_path, "w", encoding="utf-8") as f:
        f.write(updated_xml)

    with open(out_audit_path, "w", encoding="utf-8") as f:
        f.write(audit_report)

    logger.info("Successfully wrote outputs for %s", filename)


def main():
    parser = argparse.ArgumentParser(
        description="Batch Runner for Semantic EML Annotator"
    )
    parser.add_argument(
        "--input-dir", required=True, help="Directory containing input .xml EML files"
    )
    parser.add_argument(
        "--output-dir", required=True, help="Directory to save output files"
    )
    parser.add_argument(
        "--confidence-threshold",
        type=float,
        default=0.8,
        help="Threshold to adopt a recommendation",
    )

    args = parser.parse_args()

    if not os.path.isdir(args.input_dir):
        logger.error("Input directory does not exist: %s", args.input_dir)
        return

    os.makedirs(args.output_dir, exist_ok=True)

    xml_files = glob.glob(os.path.join(args.input_dir, "*.xml"))
    logger.info("Found %d XML files to process.", len(xml_files))

    for file_path in xml_files:
        process_file(file_path, args.output_dir, args.confidence_threshold)


if __name__ == "__main__":
    main()
