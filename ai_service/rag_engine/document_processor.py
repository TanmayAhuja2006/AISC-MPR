"""
ai_service/rag_engine/document_processor.py

Handles PDF / image parsing, text chunking, embedding, and FAISS indexing.
Called by the FastAPI /api/upload-doc endpoint.
"""

from __future__ import annotations

import os
import re
from typing import List

import numpy as np
from dotenv import load_dotenv

load_dotenv()

CHUNK_SIZE    = int(os.getenv("CHUNK_SIZE",    "800"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))


# ═══════════════════════════════════════════════════════════════════════════
# Text extraction
# ═══════════════════════════════════════════════════════════════════════════

def _extract_text_from_pdf(file_path: str) -> str:
    from pypdf import PdfReader
    reader = PdfReader(file_path)
    pages  = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(pages)


def _extract_text_from_image(file_path: str) -> str:
    """
    Basic image OCR placeholder.
    Returns a descriptive message since pytesseract is not required.
    Replace with pytesseract.image_to_string() if Tesseract is installed.
    """
    return (
        f"[Image document: {os.path.basename(file_path)}] "
        "OCR processing is available when Tesseract is installed. "
        "The image has been stored and associated with your account."
    )


def extract_text(file_path: str, mime_type: str) -> str:
    """Dispatch extraction based on MIME type."""
    if mime_type == "application/pdf":
        return _extract_text_from_pdf(file_path)
    elif mime_type.startswith("image/"):
        return _extract_text_from_image(file_path)
    else:
        return ""


# ═══════════════════════════════════════════════════════════════════════════
# Chunking
# ═══════════════════════════════════════════════════════════════════════════

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split text into overlapping chunks by character count."""
    text   = re.sub(r'\s+', ' ', text).strip()
    chunks = []
    start  = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return [c.strip() for c in chunks if c.strip()]


# ═══════════════════════════════════════════════════════════════════════════
# Embedding + Indexing
# ═══════════════════════════════════════════════════════════════════════════

def index_document(
    file_path: str,
    mime_type: str,
    user_id: str,
) -> int:
    """
    Full pipeline: extract → chunk → embed → add to user's FAISS store.
    Returns the number of chunks indexed.
    """
    from rag_engine.langgraph_agent import _get_embed_model, get_faiss_store

    text   = extract_text(file_path, mime_type)
    if not text.strip():
        return 0

    chunks = chunk_text(text)
    if not chunks:
        return 0

    embed_model = _get_embed_model()
    embeddings  = embed_model.encode(chunks, convert_to_numpy=True, show_progress_bar=False)

    store = get_faiss_store(user_id)
    store.add_texts(chunks, embeddings)

    return len(chunks)
