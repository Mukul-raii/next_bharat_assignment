from fastapi import APIRouter, Query, Header
from controllers.qa_controller import QAController
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/v1", tags=["Q&A"])


class QuestionRequest(BaseModel):
    question: str
    document_id: Optional[str] = None
    session_id: Optional[str] = None


@router.post("/ask")
def ask_question(request: QuestionRequest):
    """
    Ask a question about uploaded documents
    
    - **question**: The question to ask
    - **document_id**: Optional - Filter answers to specific document
    - **session_id**: Optional - Session tracking
    """
    return QAController.ask_question(
        question=request.question,
        document_id=request.document_id,
        session_id=request.session_id
    )


@router.get("/ask")
def ask_question_get(
    question: str = Query(..., description="Question to ask"),
    document_id: str = Query(None, description="Optional document ID filter"),
    session_id: str = Query(None, description="Optional session ID")
):
    """Ask a question via GET request (for simple queries)"""
    return QAController.ask_question(
        question=question,
        document_id=document_id,
        session_id=session_id
    )
