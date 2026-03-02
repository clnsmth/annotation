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

- Annotation recommendations for EML attributes and geographic coverage
- REST API for annotation recommendations and ontology term proposals
- Email notifications for new term proposals
- User selection logging to feed back into recommender training and improvement
- Mock recommender for local development; real recommender for production
- Interactive UI with upload → annotate → export workflow

## Project Structure

```
annotation/
├── engine/   # Python/FastAPI backend
└── studio/   # React/TypeScript frontend
```

See [`engine/README.md`](engine/README.md) and
[`studio/README.md`](studio/README.md) for component-specific documentation.

## Getting Started

### Prerequisites

- [Python 3.13+](https://www.python.org/) and
  [Conda](https://docs.conda.io/) (for the engine)
- [Node.js](https://nodejs.org/) (for the studio)

### Engine

```bash
conda env create -f engine/environment-min.yml
conda activate annotation-engine
cd engine
uvicorn webapp.run:app --reload
```

The API will be available at <http://localhost:8000>.

### Studio

```bash
cd studio
npm install
# Add your Gemini API key to studio/.env.local
npm run dev
```

The app will be available at <http://localhost:3000>.

## License

This project is licensed under the [MIT License](LICENSE).
