"""
Entrypoint for the Semantic EML Annotator Backend.

- Instantiates the FastAPI app
- Adds CORS middleware
- Includes the API router
- Runs the app with Uvicorn if executed as main
"""

import pathlib
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from webapp.api.api import router
from webapp.services.core import (
    recommend_for_attribute,
    recommend_for_geographic_coverage,
    send_email_notification,
)
from webapp.models.proposal_request import ProposalRequest, TermDetails, SubmitterInfo


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the proposals file if it doesn't exist
    proposals_file = pathlib.Path("proposals.jsonl")
    proposals_file.touch(exist_ok=True)
    yield


app: FastAPI = FastAPI(title="Semantic EML Annotator Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

__all__ = [
    "recommend_for_attribute",
    "recommend_for_geographic_coverage",
    "app",
    "send_email_notification",
    "ProposalRequest",
    "TermDetails",
    "SubmitterInfo",
]

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
