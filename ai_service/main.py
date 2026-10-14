"""
ai_service/main.py

FastAPI application — Healthcare RAG AI Microservice
Endpoints:
  POST /api/chat        – runs the LangGraph RAG pipeline
  POST /api/upload-doc  – processes and indexes a medical document
  GET  /health          – health check
"""

from __future__ import annotations

import os
import shutil
import tempfile
from typing import Any, Dict, List, Optional

import aiofiles
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

# ── Application ────────────────────────────────────────────────────────────
app = FastAPI(
    title="Healthcare RAG AI Service",
    description="LangGraph-powered RAG pipeline for personalised medical Q&A",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic models ────────────────────────────────────────────────────────

class HealthProfile(BaseModel):
    age:                 Optional[int]   = None
    blood_group:         Optional[str]   = None
    allergies:           Optional[str]   = None
    pre_existing_cond:   Optional[str]   = None
    current_medications: Optional[str]   = None


class ChatMessage(BaseModel):
    role:    str
    content: str


class ChatRequest(BaseModel):
    query:          str                        = Field(..., min_length=1, max_length=4000)
    user_id:        str
    health_profile: Optional[HealthProfile]   = None
    history:        Optional[List[ChatMessage]] = None


class ChatResponse(BaseModel):
    answer:  str
    sources: List[Dict[str, str]] = []


class UploadResponse(BaseModel):
    success:      bool
    message:      str
    chunks_indexed: int = 0


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "healthcare-rag-ai-service",
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Run the LangGraph pipeline. Queries about reports, labs, cholesterol, and
    similar clinical terms are forced through FAISS retrieval.
    """
    from rag_engine.langgraph_agent import run_rag_pipeline, should_force_rag

    profile_dict: Dict[str, Any] = {}
    if request.health_profile:
        profile_dict = request.health_profile.model_dump(exclude_none=True)

    history_list: List[Dict[str, str]] = []
    if request.history:
        history_list = [h.model_dump() for h in request.history]

    force_rag = should_force_rag(request.query)

    try:
        result = run_rag_pipeline(
            query=request.query,
            user_id=request.user_id,
            health_profile=profile_dict,
            history=history_list,
            force_rag=force_rag,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(exc)}")

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
    )


@app.post("/api/upload-doc", response_model=UploadResponse)
async def upload_document(
    file:     UploadFile = File(...),
    user_id:  str        = Form(...),
    doc_id:   str        = Form(...),
):
    """
    Receive an uploaded document from Express, extract text,
    chunk it, embed it, and index it into the user's FAISS store.
    """
    from rag_engine.document_processor import index_document

    # Validate content type
    allowed_types = {
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    # Save to a temp file
    suffix = os.path.splitext(file.filename or "upload")[1] or ".bin"
    tmp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp_path = tmp.name
            content  = await file.read()
            tmp.write(content)

        chunks_indexed = index_document(
            file_path=tmp_path,
            mime_type=file.content_type,
            user_id=user_id,
        )

        return UploadResponse(
            success=True,
            message=f"Document indexed successfully. {chunks_indexed} chunks added.",
            chunks_indexed=chunks_indexed,
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Indexing error: {str(exc)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ── Startup event: preload models ──────────────────────────────────────────

@app.on_event("startup")
async def preload_models():
    """Eagerly load the fine-tuned classifier and embedding model on startup."""
    print("[Startup] Preloading AI models …")
    try:
        from rag_engine.langgraph_agent import _get_classifier, _get_embed_model
        _get_classifier()
        _get_embed_model()
        print("[Startup] Models loaded successfully.")
    except Exception as exc:
        print(f"[Startup] Model preload warning: {exc}")
