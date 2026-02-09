from datetime import datetime

from controllers.document_controller import DocumentController
from fastapi import APIRouter, File, Header, HTTPException, Query, UploadFile
from services.ai_search_service import AISearchService
from services.cosmos_service import CosmosDBService

router = APIRouter(prefix="/api/v1", tags=["documents"])


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    x_session_id: str = Header(..., description="User session ID"),
):
    """Upload a document (PDF, JPG, PNG, DOCX) to Azure Blob Storage and store metadata in Cosmos DB"""
    return await DocumentController.upload_document(file, x_session_id)


@router.get("/documents")
def list_documents(
    session_id: str = Query(None, description="Filter documents by session ID"),
):
    """List uploaded documents (Filtered by session_id)"""
    return DocumentController.list_documents(session_id)


@router.get("/documents/{document_id}")
def get_document(document_id: str):
    """Get document metadata by ID"""
    return DocumentController.get_document(document_id)


@router.get("/documents/{document_id}/status")
def check_document_status(document_id: str):
    """Check document indexing status. Frontend polls this endpoint after upload."""

    try:
        document = CosmosDBService.get_document(document_id)

        # If document does not exist
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        status = document.get("status", "unknown")

        # If already completed, nothing else to do
        if status == "completed":
            return {
                "document_id": document_id,
                "status": "completed",
                "message": "Document is indexed and ready",
            }

        # If not indexed yet, return processing state
        if not AISearchService.check_document_indexed(document_id):
            return {
                "document_id": document_id,
                "status": status,
                "message": "Document is being indexed...",
            }

        # document is indexed, updating status to completed
        CosmosDBService.update_document(
            document_id,
            {
                "status": "completed",
                "processed": True,
                "completed_at": datetime.utcnow().isoformat(),
            },
        )

        return {
            "document_id": document_id,
            "status": "completed",
            "message": "Document indexed successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/indexer/trigger")
def trigger_indexer():
    """Manually trigger AI Search indexer to process documents"""
    result = AISearchService.trigger_indexer()
    return result


@router.get("/indexer/status")
def get_indexer_status():
    """Get the status of AI Search indexer"""
    result = AISearchService.get_indexer_status()
    return result
