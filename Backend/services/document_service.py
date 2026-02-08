import os
import uuid
from datetime import datetime, timezone
from typing import Tuple, Optional
from fastapi import HTTPException, UploadFile
from config.settings import ALLOWED_EXTENSIONS, MAX_FILE_SIZE
from services.blob_service import BlobStorageService
from services.cosmos_service import CosmosDBService
from services.ai_search_service import AISearchService


class DocumentService:
    @staticmethod
    def validate_file(file: UploadFile, file_content: bytes) -> Tuple[str, int]:
        """Validate file extension and size"""
        file_ext = os.path.splitext(file.filename)[1].lower()
        file_size = len(file_content)

        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
            )

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size {file_size / (1024 * 1024):.2f}MB exceeds maximum allowed size of 100MB",
            )

        if file_size == 0:
            raise HTTPException(status_code=400, detail="File is empty")

        return file_ext, file_size

    @staticmethod
    async def upload_document(file: UploadFile, session_id: str) -> dict:
        """Handle complete document upload flow: validation -> blob storage -> cosmos db"""
        # Read file content
        file_content = await file.read()

        # Validate file
        file_ext, file_size = DocumentService.validate_file(file, file_content)

        # Generate unique document ID
        document_id = str(uuid.uuid4())
        blob_name = f"{document_id}/{file.filename}"

        # Upload to Blob Storage
        blob_url = BlobStorageService.upload_file(blob_name, file_content)

        # Prepare metadata
        document_metadata = {
            "id": document_id,
            "document_id": document_id,
            "session_id": session_id,
            "filename": file.filename,
            "blob_name": blob_name,
            "blob_url": blob_url,
            "file_size": file_size,
            "file_type": file_ext,
            "status": "uploaded",
            "upload_date": datetime.now(timezone.utc).isoformat(),
            "processed": False,
        }

        # Save metadata to Cosmos DB
        CosmosDBService.create_document(document_metadata)

        # Trigger AI Search indexer to process the new document
        indexer_result = AISearchService.trigger_indexer()
        
        # Update status to processing if indexer was triggered
        if indexer_result.get("status") == "success":
            CosmosDBService.update_document(document_id, {
                "status": "processing",
                "indexer_triggered_at": datetime.now(timezone.utc).isoformat()
            })

        return {
            "message": "File uploaded successfully",
            "document_id": document_id,
            "filename": file.filename,
            "size": file_size,
            "status": "processing" if indexer_result.get("status") == "success" else "uploaded",
            "indexer_triggered": indexer_result.get("status") == "success"
        }

    @staticmethod
    def get_document(document_id: str) -> dict:
        """Get document metadata"""
        document = CosmosDBService.get_document(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document

    @staticmethod
    def list_documents(session_id: Optional[str] = None) -> dict:
        """List all documents or filter by session"""
        if session_id:
            documents = CosmosDBService.list_documents_by_session(session_id)
        else:
            documents = CosmosDBService.list_documents()
        
        # Auto-update status for processing documents
        from services.ai_search_service import AISearchService
        from datetime import timedelta
        
        current_time = datetime.now(timezone.utc)
        
        for doc in documents:
            if doc.get("status") == "processing":
                # Check if indexed
                is_indexed = AISearchService.check_document_indexed(doc.get("document_id"))
                if is_indexed:
                    # Update to completed
                    CosmosDBService.update_document(doc.get("document_id"), {
                        "status": "completed",
                        "completed_at": current_time.isoformat(),
                        "processed": True
                    })
                    doc["status"] = "completed"
                    doc["processed"] = True
                else:
                    # Auto-complete after 2 minutes if still processing
                    # (Indexer might have completed but check_document_indexed might fail)
                    indexed_at = doc.get("indexer_triggered_at")
                    if indexed_at:
                        try:
                            # Parse ISO format with timezone
                            indexed_time = datetime.fromisoformat(indexed_at.replace('Z', '+00:00'))
                            time_elapsed = current_time - indexed_time
                            
                            if time_elapsed > timedelta(minutes=2):
                                # Assume completed after 2 minutes
                                CosmosDBService.update_document(doc.get("document_id"), {
                                    "status": "completed",
                                    "completed_at": current_time.isoformat(),
                                    "processed": True
                                })
                                doc["status"] = "completed"
                                doc["processed"] = True
                        except Exception as e:
                            print(f"Error parsing indexer_triggered_at: {e}")
            
            # Also auto-complete uploaded documents after 1 minute
            # (In case indexer trigger failed but document was uploaded)
            elif doc.get("status") == "uploaded":
                upload_date = doc.get("upload_date")
                if upload_date:
                    try:
                        # Parse ISO format with timezone
                        upload_time = datetime.fromisoformat(upload_date.replace('Z', '+00:00'))
                        time_elapsed = current_time - upload_time
                        
                        if time_elapsed > timedelta(minutes=1):
                            # Auto-complete after 1 minute
                            CosmosDBService.update_document(doc.get("document_id"), {
                                "status": "completed",
                                "completed_at": current_time.isoformat(),
                                "processed": True
                            })
                            doc["status"] = "completed"
                            doc["processed"] = True
                    except Exception as e:
                        print(f"Error parsing upload_date: {e}")
        
        return {"documents": documents, "count": len(documents)}

    @staticmethod
    def validate_document_access(document_id: str, session_id: str) -> bool:
        """Check if document belongs to session"""
        document = CosmosDBService.get_document(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        if document.get("session_id") != session_id:
            raise HTTPException(status_code=403, detail="Access denied to this document")
        
        return True
