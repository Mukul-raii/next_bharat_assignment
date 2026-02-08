from pymongo import MongoClient
from azure.storage.blob import BlobServiceClient
from config.settings import (
    AZURE_STORAGE_CONNECTION_STRING,
    COSMOS_CONNECTION_STRING,
    COSMOS_DATABASE,
    COSMOS_CONTAINER,
)


class AzureClients:
    _blob_service_client = None
    _mongo_client = None
    _cosmos_collection = None

    @classmethod
    def get_blob_service_client(cls) -> BlobServiceClient:
        if cls._blob_service_client is None:
            cls._blob_service_client = BlobServiceClient.from_connection_string(
                AZURE_STORAGE_CONNECTION_STRING
            )
        return cls._blob_service_client

    @classmethod
    def get_cosmos_container(cls):
        if cls._cosmos_collection is None:
            cls._mongo_client = MongoClient(COSMOS_CONNECTION_STRING)
            database = cls._mongo_client[COSMOS_DATABASE]
            cls._cosmos_collection = database[COSMOS_CONTAINER]
        return cls._cosmos_collection
