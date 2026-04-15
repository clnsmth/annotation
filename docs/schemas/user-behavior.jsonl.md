# Schema: `user-behavior.jsonl`

## Overview

`user-behavior.jsonl` is a newline-delimited JSON (JSONL) log file written by the
Engine whenever a user performs a trackable annotation behavior via the Studio. Each
line is a self-contained JSON object representing one behavior event. The file is
appended to by the `/api/log-behavior` endpoint and is intended to serve as a
training signal for improving AI recommendation engines over time.

**File path (configurable):** `user-behavior.jsonl`
**Written by:** `POST /api/log-behavior`
**Read by:** `GET /api/user-behavior`
**Format:** One JSON object per line (JSONL / NDJSON)

---

## Record Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `event_type` | `string` (enum) | Yes | Discriminator identifying the type of behavior event. One of `"selection"`, `"custom_annotation"`, or `"removal"`. |
| `request_id` | `string` (UUID) | Yes | Identifies the recommendation request associated with the event. For `selection` events, links the event back to a `/api/recommendations` call. For `custom_annotation` and `removal` events, a client-generated UUID is used. |
| `event_id` | `string` (UUID) | Yes | Unique identifier for this behavior event. |
| `timestamp` | `string` (ISO 8601) | Yes | Date and time the user performed the action, in UTC. |
| `element_id` | `string` (UUID) | Yes | Canonical ID of the annotatable EML element that was annotated. |
| `element_name` | `string` | Yes | Human-readable name of the annotated element (e.g., an attribute column name). |
| `element_type` | `string` | Yes | EML element type of the annotated element (e.g., `"ATTRIBUTE"`). |
| `selected` | [`SelectionItem`](#selectionitem) | Yes | The annotation term acted upon. |
| `not_selected` | `array` of [`SelectionItem`](#selectionitem) | Yes | The annotation terms that were presented but not chosen. Empty array for `custom_annotation` and `removal` events. |

### `SelectionItem`

Represents a single candidate ontology annotation — both the chosen term (`selected`)
and each unchosen alternative (`not_selected`) share this structure.

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | Yes | Human-readable label of the ontology term (e.g., `"plot identifier"`). |
| `uri` | `string` (URI) | Yes | Resolvable URI uniquely identifying the ontology term. |
| `property_label` | `string` | Yes | Human-readable label of the annotation property (e.g., `"contains measurements of type"`). |
| `property_uri` | `string` (URI) | Yes | URI of the annotation property. |
| `confidence` | `number` (float, 0–1) | Yes | Recommender confidence score for this candidate. For `custom_annotation` events, set to `1.0` (user-asserted). For `removal` events, the original confidence of the removed annotation is preserved. |

---

## Event Types

### `selection`
Logged when a user confirms one of the recommended annotation candidates. The
`selected` field contains the accepted recommendation. The `not_selected` field
contains all other candidates that were presented but not chosen.

### `custom_annotation`
Logged when a user adds a custom annotation not derived from the recommender.
The `selected` field contains the user-provided annotation with `confidence: 1.0`.
The `not_selected` field is an empty array.

### `removal`
Logged when a user removes an annotation back into the suggestions column.
The `selected` field contains the removed annotation with its original confidence
value preserved. The `not_selected` field is an empty array.

Re-insertion (a previously removed annotation being re-added) is an inferred
behavior: consumers can detect it by correlating a `removal` event followed by a
`selection` or `custom_annotation` event for the same concept on the same element.

---

## Example Records

### `selection` event

```json
{
  "event_type": "selection",
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

### `custom_annotation` event

```json
{
  "event_type": "custom_annotation",
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "event_id": "f0e1d2c3-b4a5-9678-fedc-ba0987654321",
  "timestamp": "2025-12-22T16:10:00.000000Z",
  "element_id": "8a90023e-72cc-4540-a4b2-d4532ea86c38",
  "element_name": "SurveyID",
  "element_type": "ATTRIBUTE",
  "selected": {
    "label": "survey identifier",
    "uri": "http://example.org/custom/survey-identifier",
    "property_label": "contains measurements of type",
    "property_uri": "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
    "confidence": 1.0
  },
  "not_selected": []
}
```

### `removal` event

```json
{
  "event_type": "removal",
  "request_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "event_id": "e1d2c3b4-a5f6-7890-edcb-a09876543210",
  "timestamp": "2025-12-22T16:20:00.000000Z",
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
  "not_selected": []
}
```

---

## Endpoint: `GET /api/user-behavior`

Returns the entire contents of the user-behavior log as a JSON array. Each
element in the array corresponds to one line in the underlying JSONL file.

### Request

```
GET /api/user-behavior
```

No query parameters or request body are required.

### Response

**200 OK** — a JSON array of behavior-event objects.

```json
[
  {
    "event_type": "selection",
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
    "not_selected": []
  }
]
```

Returns an **empty array** (`[]`) when the log file does not exist yet.

**500 Internal Server Error** — if the log file cannot be read.

### Example (curl)

```bash
curl http://localhost:8000/api/user-behavior
```

---

## Notes

- Each record is appended as a single line; no trailing commas or wrapping array is
  used. Standard JSONL parsers (e.g., `json.loads` line-by-line in Python) can read
  this file directly.
- `not_selected` captures the full set of candidates that were presented but not
  chosen. An empty array (`[]`) is used for `custom_annotation` and `removal` events
  where no alternatives were presented.
- `request_id` links a `selection` event to the originating `/api/recommendations`
  call, enabling downstream analysis to correlate model output with user decisions.
  For `custom_annotation` and `removal` events, `request_id` is a client-generated
  UUID with no corresponding recommendation request.
- `timestamp` is serialised in ISO 8601 format with microsecond precision by Pydantic's
  `model_dump_json()`.

