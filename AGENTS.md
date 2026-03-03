# Agent Instructions for Annotation Studio & Engine

This project consists of two main components:
1.  **Engine**: A FastAPI backend located in the `engine/` directory.
2.  **Studio**: A Vite/React frontend located in the `studio/` directory.

## Backend (Engine)

The backend is responsible for the annotation engine logic and email notifications.

### Environment Setup
- Use Conda to manage the environment: `conda env create -f engine/environment-min.yml`.
- Primary source code is located in `engine/webapp/`.

### Development & Running
- **Running the server**: From the `engine/` directory, run:
  ```bash
  uvicorn webapp.run:app --reload
  ```
- **Configuration**: Managed in `engine/webapp/config.py`.
  - For local development and testing, keep `USE_MOCK_RECOMMENDATIONS = True`.
- **External Dependencies**: Currently, there are no external database dependencies.

### Quality Control
- **Linting & Formatting**: Use `ruff` on both the source and tests.
  ```bash
  ruff check engine/webapp/ engine/tests/
  ruff format engine/webapp/ engine/tests/
  ```
- **Testing**: Use `pytest` to run the test suite from the `engine/` directory.
  ```bash
  pytest
  ```

## Frontend (Studio)

The frontend is a React application built with Vite and TypeScript.

### Environment Setup
- Use NPM for dependency management: `npm install` (within the `studio/` directory).

### Development & Running
- **Running the server**: From the `studio/` directory, run:
  ```bash
  npm run dev
  ```
- **Testing**: Use `vitest` to run the test suite from the `studio/` directory.
  ```bash
  npm test
  ```

## Commit Message Guidelines

We use the **Angular commit style** to streamline the release process via Python Semantic Release.

### Format
`type(scope): <subject> [#issue]`

- **Type**: Must be one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`.
- **Scope**: (Optional) The module or area of the change (e.g., `engine`, `studio`, `api`).
- **Subject**: A short, imperative-voice summary (e.g., "add login endpoint").
- **Body**: (Optional) Detailed explanation.
- **Footer**: (Optional) For breaking changes or issue references (e.g., `Closes #123`).

### Constraints
- **Imperative Voice**: Use "add", "fix", "update" instead of "added", "fixes", "updated".
- **Header Length**: Keep the header (type + scope + subject) under **52 characters**.
- **Body Length**: Wrap the body text at **72 characters**.
- **Issue Referencing**: Automatically close issues using keywords (e.g., `Closes #123`) in the footer or subject when relevant.

## Pre-flight Checklist for Agents

Before submitting any changes, please ensure you have completed the following:

1.  **Backend Changes**:
    - [ ] Run `ruff check` and `ruff format` on `engine/webapp/` and `engine/tests/`.
    - [ ] Run `pytest` from the `engine/` directory and ensure all tests pass.
2.  **Frontend Changes**:
    - [ ] Manually verify UI changes and functionality by running the Vite development server.
3.  **Documentation**:
    - [ ] Update any relevant comments or documentation if the architecture or configuration changes.
    - [ ] Update this `AGENTS.md` file if any environment setup, tools, or best practices change.
4.  **Submission**:
    - [ ] Use the **Angular commit style** for the commit message.
    - [ ] Ensure the header is under 52 characters and the body is wrapped at 72 characters.
    - [ ] Include issue references to automatically close related issues.
