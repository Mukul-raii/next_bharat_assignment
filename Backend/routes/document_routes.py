from fastapi import APIRouter, File, UploadFile, Header, Query
from controllers.document_controller import DocumentController
from services.ai_search_service import AISearchService
from services.cosmos_service import CosmosDBService
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["documents"])


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    x_session_id: str = Header(..., description="User session ID")
):
    """Upload a document (PDF, JPG, PNG, DOCX) to Azure Blob Storage and store metadata in Cosmos DB"""
    return await DocumentController.upload_document(file, x_session_id)


@router.get("/documents")
def list_documents(session_id: str = Query(None, description="Filter documents by session ID")):
    """List uploaded documents (optionally filtered by session_id)"""
    return DocumentController.list_documents(session_id)


@router.get("/documents/{document_id}")
def get_document(document_id: str):
    """Get document metadata by ID"""
    return DocumentController.get_document(document_id)


@router.get("/documents/{document_id}/status")
def check_document_status(document_id: str):
    """
    Check if document has been indexed and update status in Cosmos DB
    Frontend should poll this after upload to update UI
    """
    try:
        # Get current document
        document = CosmosDBService.get_document(document_id)
        if not document:
            return {"error": "Document not found", "status": "error"}
        
        current_status = document.get("status", "unknown")
        
        # Check if already completed
        if current_status == "completed":
            return {
                "document_id": document_id,
                "status": "completed",
                "message": "Document is indexed and ready"
            }
        
        # Check if indexed in AI Search
        is_indexed = AISearchService.check_document_indexed(document_id)
        
        if is_indexed and current_status != "completed":
            # Update to completed
            CosmosDBService.update_document(document_id, {
                "status": "completed",
                "completed_at": datetime.utcnow().isoformat(),
                "processed": True
            })
            return {
                "document_id": document_id,
                "status": "completed",
                "message": "Document indexed successfully"
            }
        elif current_status == "processing":
            return {
                "document_id": document_id,
                "status": "processing",
                "message": "Document is being indexed..."
            }
        else:
            return {
                "document_id": document_id,
                "status": current_status,
                "message": f"Document status: {current_status}"
            }
            
    except Exception as e:
        return {
            "error": str(e),
            "status": "error"
        }


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

