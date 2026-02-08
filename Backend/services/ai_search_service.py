import os
import requests
import base64
from typing import Optional
from config.settings import (
    AZURE_SEARCH_ENDPOINT,
    AZURE_SEARCH_KEY,
    AZURE_SEARCH_INDEXER_NAME,
    AZURE_SEARCH_INDEX_NAME
)


class AISearchService:
    @staticmethod
    def check_document_indexed(document_id: str) -> bool:
        """
        Check if a document has been indexed in AI Search
        
        Args:
            document_id: Document ID to check
            
        Returns:
            True if document is indexed, False otherwise
        """
        if not all([AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_KEY, AZURE_SEARCH_INDEX_NAME]):
            return False
        
        endpoint = AZURE_SEARCH_ENDPOINT.rstrip('/')
        url = f"{endpoint}/indexes/{AZURE_SEARCH_INDEX_NAME}/docs/search?api-version=2023-11-01"
        
        headers = {
            "Content-Type": "application/json",
            "api-key": AZURE_SEARCH_KEY
        }
        
        # Get all documents and check their paths
        # The path is base64 encoded and contains: ...documents/document_id/filename
        payload = {
            "search": "*",
            "top": 100  # Check up to 100 documents
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                
                # Check if any document path contains our document_id
                for doc in result.get("value", []):
                    encoded_path = doc.get("metadata_storage_path", "")
                    
                    try:
                        # Decode base64 path
                        # Add padding if needed
                        encoded_path += '=' * (4 - len(encoded_path) % 4)
                        decoded_path = base64.b64decode(encoded_path).decode('utf-8')
                        
                        # Check if our document_id is in the path
                        if f"/documents/{document_id}/" in decoded_path or f"/documents/{document_id}" in decoded_path:
                            return True
                    except:
                        continue
                
                return False
            else:
                return False
                
        except Exception:
            return False
    
    @staticmethod
    def trigger_indexer(indexer_name: Optional[str] = None) -> dict:
        """
        Trigger Azure AI Search indexer to process new documents
        
        Args:
            indexer_name: Name of the indexer to run (uses default from settings if not provided)
            
        Returns:
            dict with status and message
        """
        if not indexer_name:
            indexer_name = AZURE_SEARCH_INDEXER_NAME
            
        if not all([AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_KEY, indexer_name]):
            return {
                "status": "skipped",
                "message": "AI Search not configured"
            }
        
        # Remove trailing slash from endpoint
        endpoint = AZURE_SEARCH_ENDPOINT.rstrip('/')
        
        # Azure AI Search REST API endpoint to run indexer
        url = f"{endpoint}/indexers/{indexer_name}/run?api-version=2023-11-01"
        
        headers = {
            "Content-Type": "application/json",
            "api-key": AZURE_SEARCH_KEY
        }
        
        try:
            response = requests.post(url, headers=headers)
            
            if response.status_code == 202:
                return {
                    "status": "success",
                    "message": f"Indexer '{indexer_name}' triggered successfully"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to trigger indexer: {response.status_code} - {response.text}"
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error triggering indexer: {str(e)}"
            }
    
    @staticmethod
    def get_indexer_status(indexer_name: Optional[str] = None) -> dict:
        """Get the status of an indexer"""
        if not indexer_name:
            indexer_name = AZURE_SEARCH_INDEXER_NAME
            
        if not all([AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_KEY, indexer_name]):
            return {"status": "error", "message": "AI Search not configured"}
        
        endpoint = AZURE_SEARCH_ENDPOINT.rstrip('/')
        url = f"{endpoint}/indexers/{indexer_name}/status?api-version=2023-11-01"
        
        headers = {
            "Content-Type": "application/json",
            "api-key": AZURE_SEARCH_KEY
        }
        
        try:
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "status": "error",
                    "message": f"Failed to get indexer status: {response.status_code}"
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error getting indexer status: {str(e)}"
            }
