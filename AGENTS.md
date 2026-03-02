# Agent Instructions for Annotation Studio & Engine

This project consists of two main components:
1.  **Engine**: A FastAPI backend located in the `engine/` directory.
2.  **Studio**: A Vite/React frontend located in the `studio/` directory.

## Backend (Engine)

The backend is responsible for the annotation engine logic and email notifications.

### Environment Setup
- Use Conda to manage the environment: `conda env create -f engine/environment.yml`.
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
- **Testing**: There are currently no automated tests for the frontend. Please verify changes manually by running the development server.

## Pre-flight Checklist for Agents

Before submitting any changes, please ensure you have completed the following:

1.  **Backend Changes**:
    - [ ] Run `ruff check` and `ruff format` on `engine/webapp/` and `engine/tests/`.
    - [ ] Run `pytest` from the `engine/` directory and ensure all tests pass.
2.  **Frontend Changes**:
    - [ ] Manually verify UI changes and functionality by running the Vite development server.
3.  **Documentation**:
    - [ ] Update any relevant comments or documentation if the architecture or configuration changes.
