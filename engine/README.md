
![Experimental](https://img.shields.io/badge/status-experimental-orange) ![WIP](https://img.shields.io/badge/status-WIP-yellow)

# eml-annotation-engine

The EML Annotation Engine is a backend service for the [EML Annotation Studio](https://github.com/clnsmth/eml-annotation-studio), designed to provide semantic annotation recommendations and support for Ecological Metadata Language (EML) datasets. It exposes a RESTful API for recommending annotations for EML metadata, and proposing new ontology terms.

## Features
- EML attribute and geographic coverage recommendation engines
- REST API for annotation recommendations and term proposals
- Email notification system for new term proposals
- Mock and real recommender support for development and production
- Designed for integration with EML Annotation Studio frontend

## Getting Started

### Prerequisites
- Python 3.13+
- (Recommended) Create and activate a virtual environment:

```bash
conda env create -f environment-min.yml
conda activate annotation-engine
```

### Running the API

To start the FastAPI server (for development):

```bash
uvicorn webapp.run:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000

### Running Tests

To run the test suite:

```bash
pytest
```

### Configuration

Edit `webapp/config.py` to set email notification recipients, SMTP credentials, and mock/real recommender options.

## Project Structure
- `webapp/` - Main application code (API, services, models, utils)
- `tests/` - Unit and integration tests
- `README.md` - Project documentation

## License
See [LICENSE](LICENSE) for details.
