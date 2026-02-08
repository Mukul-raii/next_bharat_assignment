from config.azure_clients import AzureClients
from config.settings import BLOB_CONTAINER_NAME


class BlobStorageService:
    @staticmethod
    def upload_file(blob_name: str, file_content: bytes) -> str:
        """Upload file to Azure Blob Storage and return blob URL"""
        blob_service_client = AzureClients.get_blob_service_client()
        blob_client = blob_service_client.get_blob_client(
            container=BLOB_CONTAINER_NAME, blob=blob_name
        )
        blob_client.upload_blob(file_content, overwrite=True)
        return blob_client.url

    @staticmethod
    def delete_file(blob_name: str) -> bool:
        """Delete file from Azure Blob Storage"""
        try:
            blob_service_client = AzureClients.get_blob_service_client()
            blob_client = blob_service_client.get_blob_client(
                container=BLOB_CONTAINER_NAME, blob=blob_name
            )
            blob_client.delete_blob()
            return True
        except Exception:
            return False

    @staticmethod
    def get_file_url(blob_name: str) -> str:
        """Get URL for a blob"""
        blob_service_client = AzureClients.get_blob_service_client()
        blob_client = blob_service_client.get_blob_client(
            container=BLOB_CONTAINER_NAME, blob=blob_name
        )
        return blob_client.url

    @staticmethod
    def download_file(blob_name: str) -> bytes:
        """Download file from Azure Blob Storage"""
        blob_service_client = AzureClients.get_blob_service_client()
        blob_client = blob_service_client.get_blob_client(
            container=BLOB_CONTAINER_NAME, blob=blob_name
        )
        return blob_client.download_blob().readall()
