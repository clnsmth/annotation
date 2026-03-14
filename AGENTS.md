# Agent Instructions for Annotation Studio & Engine

This project consists of two main components:
1.  **Engine**: A FastAPI backend located in the `engine/` directory.
2.  **Studio**: A Vite/React frontend located in the `studio/` directory.

## Backend (Engine)

The backend is responsible for the annotation engine logic and email notifications.

### Environment Setup
- Use Pixi to manage the environment: `pixi install` (within the `engine/` directory).
- Primary source code is located in `engine/webapp/`.

### Development & Running
- **Running the server**: From the `engine/` directory, run:
  ```bash
  pixi run serve
  ```
- **Configuration**: Managed in `engine/webapp/config.py`.
  - For local development and testing, keep `USE_MOCK_RECOMMENDATIONS = True`.
- **External Dependencies**: Currently, there are no external database dependencies.

### Quality Control
- **Linting & Formatting**: Use `ruff` on both the source and tests.
  ```bash
  pixi run -e dev lint
  pixi run -e dev format
  ```
- **Testing**: Use `pytest` to run the test suite from the `engine/` directory.
  ```bash
  pixi run -e dev test
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

### Quality Control
- **Linting**: Use `eslint` to run checks from the `studio/` directory.
  ```bash
  npm run lint
  ```

## Commit Message Guidelines

As an AI agent, you **MUST STRICTLY ADHERE** to the following **Angular commit style** rules. This is critical for our automated release process via Python Semantic Release.

### 1. Header (First Line)
**Syntax:** `type(scope): <subject> (#pr_number) [#issue_number]`

- **Type** (Required): MUST be exactly one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- **Scope** (Required): The affected area (e.g., `engine`, `studio`). MUST be included to provide context.
- **Subject** (Required): A short, imperative summary. Use verbs like "add", "fix", "update" (NOT "added", "fixes", "updated").
- **PR Number** (Conditional): If there is an associated pull request, you MUST include its number in parentheses at the end of the subject line (e.g., `(#42)`).
- **Constraint**: The entire header line MUST be **under 52 characters**.

### 2. Body (After one blank line)
- **Content** (Required): You MUST provide a clear overview of the exact changes made AND the motivating rationale behind them (why the changes were necessary).
- **Constraint**: Wrap all lines in the body at **< 72 characters**.

### 3. Footer (After another blank line)
- **Content** (Optional): List any breaking changes or references to closed issues (e.g., `Closes #123`).

> [!TIP]
> If you are struggling to enforce the strict 72-character limit on body wrapping, please reference and execute the **Commit with Wrapping Workflow** located at `.agents/workflows/commit-with-wrapping.md`.

### Example of a Good Commit
```text
fix(engine): resolve edge case parsing failures (#42)

The previous parser implementation failed to handle nested
XML nodes properly, leading to skipped elements. This updates
the recursive logic to process all children accurately.
The rationale is to ensure 100% data extraction reliability.

Closes #123
```

## Pre-flight Checklist for Agents

Before submitting any changes, please ensure you have completed the following:

1.  **Backend Changes**:
    - [ ] Run `pixi run -e dev lint` and `pixi run -e dev format` from `engine/`.
    - [ ] Run `pixi run -e dev test` from `engine/` and ensure all tests pass.
2.  **Frontend Changes**:
    - [ ] Run `npm run lint` from `studio/` to ensure no linting warnings exist.
    - [ ] Manually verify UI changes and functionality by running the Vite development server.
3.  **Documentation**:
    - [ ] Update any relevant comments or documentation if the architecture or configuration changes.
    - [ ] Update this `AGENTS.md` file if any environment setup, tools, or best practices change.
4.  **Submission**:
    - [ ] **NEVER** commit directly to the `main` branch. All changes MUST be committed to a feature branch.
    - [ ] Create a Pull Request (PR) from your feature branch to the `main` branch.
    - [ ] Use the **Angular commit style** for the commit message.
    - [ ] Ensure the header is under 52 characters and the body is wrapped at < 72 characters.
    - [ ] Include issue references to automatically close related issues.
