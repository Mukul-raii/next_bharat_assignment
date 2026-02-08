from fastapi import File, HTTPException, UploadFile
from services.document_service import DocumentService
from models.document import DocumentUploadResponse, DocumentListResponse


class DocumentController:
    @staticmethod
    async def upload_document(file: UploadFile, session_id: str) -> DocumentUploadResponse:
        """Controller for document upload"""
        try:
            result = await DocumentService.upload_document(file, session_id)
            return result
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    @staticmethod
    def get_document(document_id: str) -> dict:
        """Controller for getting document metadata"""
        try:
            return DocumentService.get_document(document_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to fetch document: {str(e)}"
            )

    @staticmethod
    def list_documents(session_id: str = None) -> DocumentListResponse:
        """Controller for listing documents (optionally filtered by session)"""
        try:
            return DocumentService.list_documents(session_id)
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to fetch documents: {str(e)}"
            )
