# Schema: `proposals.jsonl`

## Overview

`proposals.jsonl` is a newline-delimited JSON (JSONL) log file written by the Engine
whenever a user submits a new vocabulary term proposal via the Studio. Each line is a
self-contained JSON object representing one proposal. The file is appended to by the
`/api/proposals` endpoint and acts as a persistent stub database for proposal records
(see [ADR 0001](../adr/0001-backend-canonical-eml-pipeline.md)), ensuring proposals are
safely preserved regardless of downstream email-notification failures.

**File path (configurable):** `proposals.jsonl`
**Written by:** `POST /api/proposals`
**Format:** One JSON object per line (JSONL / NDJSON)

---

## Record Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `target_vocabulary` | `string` | Yes | Name or identifier of the vocabulary the proposed term should be added to. |
| `term_details` | [`TermDetails`](#termdetails) | Yes | Details about the proposed ontology term. |
| `submitter_info` | [`SubmitterInfo`](#submitterinfo) | Yes | Information about the person submitting the proposal. |
| `proposed_at` | `string` (ISO 8601) | Yes | Date and time the proposal was submitted, in UTC. Auto-populated by the server if not provided by the client. |

### `TermDetails`

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | Yes | Proposed human-readable label for the new term. |
| `description` | `string` | Yes | Definition or description of the proposed term. |
| `evidence_source` | `string` or `null` | No | Citation, URL, or reference that supports the term proposal. `null` when not provided. |

### `SubmitterInfo`

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | `string` (email) | Yes | Email address of the submitter. Used to send acknowledgement notifications. |
| `orcid_id` | `string` or `null` | No | ORCID identifier of the submitter (e.g., `"0000-0002-1825-0097"`). `null` when not provided. |
| `attribution_consent` | `boolean` | Yes | Whether the submitter consents to being attributed for the proposal. |

---

## Example Record

```json
{
  "target_vocabulary": "ECSO",
  "term_details": {
    "label": "soil organic carbon fraction",
    "description": "The mass fraction of organic carbon in a soil sample, expressed as a dimensionless ratio.",
    "evidence_source": "https://doi.org/10.1016/j.soilbio.2020.107901"
  },
  "submitter_info": {
    "email": "researcher@university.edu",
    "orcid_id": "0000-0002-1825-0097",
    "attribution_consent": true
  },
  "proposed_at": "2026-01-15T10:22:45.123456+00:00"
}
```

---

## Notes

- Each record is appended as a single line; no trailing commas or wrapping array is
  used. Standard JSONL parsers (e.g., `json.loads` line-by-line in Python) can read
  this file directly.
- `proposed_at` is set server-side at the moment the request is received, using
  `datetime.now(timezone.utc)`. It is serialised in ISO 8601 format with microsecond
  precision and UTC offset by Pydantic's `model_dump_json()`.
- `evidence_source` and `orcid_id` are optional fields; absent values are written as
  JSON `null`.
- The file is created (if not already present) at Engine startup before any requests
  are handled, so it always exists on disk even when empty.
