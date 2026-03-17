![Experimental](https://img.shields.io/badge/status-experimental-orange) ![WIP](https://img.shields.io/badge/status-WIP-yellow) [![CI](https://github.com/clnsmth/annotation/actions/workflows/ci.yml/badge.svg)](https://github.com/clnsmth/annotation/actions/workflows/ci.yml)

# Annotation Studio & Engine

A web application for creating semantic annotations for [Ecological Metadata
Language (EML)](https://eml.ecoinformatics.org/) datasets. The project
consists of two components:

- **Engine** – A [FastAPI](https://fastapi.tiangolo.com/) backend that serves
  annotation recommendations and manages ontology term proposals.
- **Studio** – A [React](https://react.dev/) / [Vite](https://vite.dev/)
  frontend where users upload EML files, review AI-generated annotation
  suggestions, and export the annotated metadata.

## Features

- AI-powered annotation recommendations for EML elements
- REST API for annotation recommendations and ontology term proposals, with email notifications for new proposals
- User selection logging to feed back into recommender training and improvement
- Interactive UI with upload → annotate → export workflow

## Project Structure

```
annotation/
├── engine/   # Python/FastAPI backend
└── studio/   # React/TypeScript frontend
```

See [`engine/README.md`](engine/README.md) and
[`studio/README.md`](studio/README.md) for component-specific documentation.
For production server setup, see the
[Deployment Guide](docs/deployment.md).

## Getting Started

### Prerequisites

- [Pixi](https://pixi.sh) (for the engine)
- [Node.js](https://nodejs.org/) (for the studio)

### Engine

```bash
cd engine
pixi install
pixi run serve
```

The API will be available at <http://localhost:8000>.

### Studio

```bash
cd studio
npm install
npm run dev
```

The app will be available at <http://localhost:3000>.

You can check the Studio code for linting errors with:

```bash
cd studio
npm run lint
```

## License

This project is licensed under the [MIT License](LICENSE).
