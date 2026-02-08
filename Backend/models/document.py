from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DocumentMetadata(BaseModel):
    id: str
    document_id: str
    session_id: str
    filename: str
    blob_name: str
    file_size: int
    file_type: str
    status: str
    upload_date: str
    processed: bool
    processed_date: Optional[str] = None
    error_message: Optional[str] = None


class DocumentUploadResponse(BaseModel):
    message: str
    document_id: str
    filename: str
    size: int
    status: str


class DocumentListResponse(BaseModel):
    documents: list
    count: int
