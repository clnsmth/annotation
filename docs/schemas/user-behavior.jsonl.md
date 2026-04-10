# Schema: `user-behavior.jsonl`

## Overview

`user-behavior.jsonl` is a newline-delimited JSON (JSONL) log file written by the
Engine whenever a user confirms an annotation selection via the Studio. Each line is
a self-contained JSON object representing one selection event. The file is appended
to by the `/api/log-selection` endpoint and is intended to serve as a training signal
for improving AI recommendation engines over time.

**File path (configurable):** `user-behavior.jsonl`
**Written by:** `POST /api/log-selection`
**Format:** One JSON object per line (JSONL / NDJSON)

---

## Record Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `request_id` | `string` (UUID) | Yes | Identifies the recommendation request that produced the candidates shown to the user. Ties the event back to a `/api/recommendations` call. |
| `event_id` | `string` (UUID) | Yes | Unique identifier for this selection event. |
| `timestamp` | `string` (ISO 8601) | Yes | Date and time the user made the selection, in UTC. |
| `element_id` | `string` (UUID) | Yes | Canonical ID of the annotatable EML element that was annotated. |
| `element_name` | `string` | Yes | Human-readable name of the annotated element (e.g., an attribute column name). |
| `element_type` | `string` | Yes | EML element type of the annotated element (e.g., `"ATTRIBUTE"`). |
| `selected` | [`SelectionItem`](#selectionitem) | Yes | The annotation term the user chose. |
| `not_selected` | `array` of [`SelectionItem`](#selectionitem) | Yes | The annotation terms that were presented but not chosen. May be an empty array. |

### `SelectionItem`

Represents a single candidate ontology annotation — both the chosen term (`selected`)
and each unchosen alternative (`not_selected`) share this structure.

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | Yes | Human-readable label of the ontology term (e.g., `"plot identifier"`). |
| `uri` | `string` (URI) | Yes | Resolvable URI uniquely identifying the ontology term. |
| `property_label` | `string` | Yes | Human-readable label of the annotation property (e.g., `"contains measurements of type"`). |
| `property_uri` | `string` (URI) | Yes | URI of the annotation property. |
| `confidence` | `number` (float, 0–1) | Yes | Recommender confidence score for this candidate. |

---

## Example Record

```json
{
  "request_id": "54a68e57-2a96-43fe-99bf-5e0e5c195e53",
  "event_id": "0693d0c8-7105-4046-bff9-4a21fa089f40",
  "timestamp": "2025-12-22T15:35:07.273000Z",
  "element_id": "8a90023e-72cc-4540-a4b2-d4532ea86c38",
  "element_name": "SurveyID",
  "element_type": "ATTRIBUTE",
  "selected": {
    "label": "plot identifier",
    "uri": "http://purl.dataone.org/odo/ECSO_00002432",
    "property_label": "contains measurements of type",
    "property_uri": "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
    "confidence": 0.85
  },
  "not_selected": [
    {
      "label": "lake identifier",
      "uri": "http://purl.dataone.org/odo/ECSO_00002565",
      "property_label": "contains measurements of type",
      "property_uri": "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
      "confidence": 0.95
    },
    {
      "label": "study location identifier",
      "uri": "http://purl.dataone.org/odo/ECSO_00002767",
      "property_label": "contains measurements of type",
      "property_uri": "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
      "confidence": 0.75
    }
  ]
}
```

---

## Notes

- Each record is appended as a single line; no trailing commas or wrapping array is
  used. Standard JSONL parsers (e.g., `json.loads` line-by-line in Python) can read
  this file directly.
- `not_selected` captures the full set of candidates that were presented but not
  chosen. An empty array (`[]`) indicates the user accepted a recommendation without
  any alternative being shown.
- `request_id` links a selection event to the originating `/api/recommendations` call,
  enabling downstream analysis to correlate model output with user decisions.
- `timestamp` is serialised in ISO 8601 format with microsecond precision by Pydantic's
  `model_dump_json()`.
