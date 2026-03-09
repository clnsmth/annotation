# ADR 0001: Backend Canonical EML Processing Pipeline

- Status: Accepted
- Date: 2026-03-09

## Context
The project currently includes two components:
- Engine (FastAPI backend) for recommendations.
- Studio (React frontend) that currently parses EML in the browser, assigns element IDs, and calls the backend recommender.

We have two primary use cases:
1) Human-in-the-loop annotation via Studio.
2) Batch/autonomous processing of thousands of EML documents (no UI) that runs recommendation(s), selects annotations algorithmically, and writes them back into EML.

Without a shared canonical pipeline, the batch use case would require duplicating frontend functionality (parsing, ID assignment, merging/export), creating drift and maintenance risk.

## Decision
We will adopt a backend-canonical pipeline (“Option A”):

- The Engine will become the single source of truth for:
  - Parsing EML documents.
  - Extracting annotatable targets.
  - Assigning canonical element/target IDs.
  - Coordinating recommender calls and returning recommendations keyed by those IDs.
  - Applying selected annotations back into EML and exporting updated EML.
  - Emitting an audit/report trail of recommendations and decisions.

- The Studio will become a thin client that:
  - Uploads an EML document to the backend.
  - Renders backend-returned targets and recommendations.
  - Captures user decisions (approve/ignore/override/add).
  - Sends decisions to the backend for application/export.

- Batch processing will be implemented as a backend/CLI-driven orchestrator that uses the same backend endpoints/services as Studio.

Constraints acknowledged:
- Batch mode does not require storing outputs server-side, but does require an audit/report artifact.
- Studio does not need offline operation; backend availability is assumed.
- Sending full EML documents to the backend is acceptable.

## Consequences
### Positive
- Avoids duplication between Studio and batch processing.
- Canonical parsing/export behavior across all execution modes.
- Canonical ID assignment simplifies joining targets, recommendations, UI decisions, exports, and audit trails.
- Enables consistent validation and error handling.

### Negative / Tradeoffs
- Studio depends on backend availability.
- Backend takes on responsibility for parsing, ID strategy, and EML mutation/serialization.
- Full EML documents traverse the network to the backend.

## Migration Plan (Phased)

### Phase 1: Introduce backend document endpoints
- Add backend capabilities to ingest EML and return extracted targets with canonical IDs.
- Add backend capability to apply decisions and export updated EML.
- Add backend capability to produce an audit/report artifact.

### Phase 2: Switch Studio to backend-derived targets
- Studio uploads EML and uses backend-returned targets/IDs.
- Studio no longer parses EML or generates IDs.

### Phase 3: Backend-owned export/apply
- Studio only submits decisions; backend applies and returns updated EML.

### Phase 4: Batch runner
- Implement batch orchestration to process large corpora:
  - ingest EML,
  - request recommendations,
  - select/adopt annotations algorithmically,
  - export updated EML,
  - emit per-document audit reports.

## Deferred Design Details (Tracked)
The following are acknowledged as important and will be specified during implementation:
- Canonical ID strategy (deterministic vs mapping-based), and its stability guarantees.
- Annotation writing strategy (inline vs detached `<annotations>` references) and consistency rules.
- Audit/report format (JSON/JSONL), required fields, and version/provenance metadata.
- Recommender provenance/version reporting (source identifiers, request IDs, model versions where available).
