from fastapi import HTTPException
from services.qa_service import QAService
from typing import Optional


class QAController:
    @staticmethod
    def ask_question(question: str, document_id: Optional[str] = None, session_id: Optional[str] = None) -> dict:
        """Controller for asking questions"""
        try:
            if not question or len(question.strip()) == 0:
                raise HTTPException(status_code=400, detail="Question cannot be empty")
            
            result = QAService.ask_question(question, document_id, session_id)
            
            if result.get("status") == "error":
                raise HTTPException(status_code=500, detail=result.get("error"))
            
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process question: {str(e)}")
