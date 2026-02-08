from typing import List, Optional
from config.azure_clients import AzureClients
from models.document import DocumentMetadata


class CosmosDBService:
    @staticmethod
    def create_document(document_data: dict) -> dict:
        """Create a new document record in Cosmos DB (MongoDB API)"""
        collection = AzureClients.get_cosmos_container()
        result = collection.insert_one(document_data)
        document_data['_id'] = str(result.inserted_id)
        return document_data

    @staticmethod
    def get_document(document_id: str) -> Optional[dict]:
        """Get document by ID"""
        try:
            collection = AzureClients.get_cosmos_container()
            document = collection.find_one({"document_id": document_id})
            if document and '_id' in document:
                document['_id'] = str(document['_id'])
            return document
        except Exception:
            return None

    @staticmethod
    def list_documents() -> List[dict]:
        """List all documents ordered by upload date"""
        collection = AzureClients.get_cosmos_container()
        documents = list(collection.find().sort("upload_date", -1))
        for doc in documents:
            if '_id' in doc:
                doc['_id'] = str(doc['_id'])
        return documents

    @staticmethod
    def list_documents_by_session(session_id: str) -> List[dict]:
        """List documents for specific session"""
        collection = AzureClients.get_cosmos_container()
        documents = list(collection.find({"session_id": session_id}).sort("upload_date", -1))
        for doc in documents:
            if '_id' in doc:
                doc['_id'] = str(doc['_id'])
        return documents

    @staticmethod
    def update_document(document_id: str, update_data: dict) -> dict:
        """Update document metadata"""
        collection = AzureClients.get_cosmos_container()
        result = collection.find_one_and_update(
            {"document_id": document_id},
            {"$set": update_data},
            return_document=True
        )
        if result and '_id' in result:
            result['_id'] = str(result['_id'])
        return result

    @staticmethod
    def delete_document(document_id: str) -> bool:
        """Delete document from Cosmos DB"""
        try:
            collection = AzureClients.get_cosmos_container()
            result = collection.delete_one({"document_id": document_id})
            return result.deleted_count > 0
        except Exception:
            return False
