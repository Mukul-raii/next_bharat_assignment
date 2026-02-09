"""
Embedding Service for generating query embeddings
Uses Azure OpenAI text-embedding-3-small (same as skillset)
"""
from typing import List
import logging
from openai import AzureOpenAI
from config.settings import (
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_API_VERSION,
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Singleton client instance
_embedding_client = None


def get_embedding_client() -> AzureOpenAI:
    """Get or create singleton Azure OpenAI client for embeddings"""
    global _embedding_client
    if _embedding_client is None:
        logger.info("Initializing Azure OpenAI embedding client")
        _embedding_client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            timeout=20.0,
            max_retries=2
        )
    return _embedding_client


def generate_query_embedding(query: str) -> List[float]:
    """
    Generate embedding vector for a search query
    
    Args:
        query: Search query text
        
    Returns:
        List of 1536 floats representing the embedding vector
        
    Raises:
        Exception: If embedding generation fails
    """
    try:
        logger.info(f"Generating embedding for query: '{query[:50]}...'")
        
        client = get_embedding_client()
        
        # Try configured deployment first, then fallbacks
        deployment_names = [
            AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
            "text-embedding-3-small",
            "text-embedding-ada-002",
            "embedding"
        ]
        
        last_error = None
        for deployment_name in deployment_names:
            try:
                logger.info(f"Trying deployment: {deployment_name}")
                response = client.embeddings.create(
                    model=deployment_name,
                    input=query,
                    encoding_format="float"
                )
                
                embedding = response.data[0].embedding
                logger.info(f"✅ Generated embedding with {len(embedding)} dimensions using {deployment_name}")
                return embedding
                
            except Exception as e:
                last_error = e
                if "DeploymentNotFound" in str(e) or "404" in str(e):
                    logger.warning(f"⚠️ Deployment '{deployment_name}' not found, trying next...")
                    continue
                else:
                    # Other error, raise immediately
                    raise
        
        # If we get here, all deployments failed
        raise Exception(
            f"Failed to find working embedding deployment. Tried: {', '.join(deployment_names)}. "
            f"Last error: {str(last_error)}. "
            f"Please check EMBEDDING_DEPLOYMENT_FIX.md for setup instructions."
        )
        
    except Exception as e:
        logger.error(f"❌ Error generating embedding: {str(e)}")
        raise Exception(f"Failed to generate query embedding: {str(e)}")


def generate_batch_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for multiple texts in batch
    More efficient than individual calls
    
    Args:
        texts: List of text strings to embed
        
    Returns:
        List of embedding vectors
    """
    try:
        logger.info(f"Generating batch embeddings for {len(texts)} texts")
        
        client = get_embedding_client()
        
        response = client.embeddings.create(
            model=AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
            input=texts,
            encoding_format="float"
        )
        
        embeddings = [item.embedding for item in response.data]
        
        logger.info(f"✅ Generated {len(embeddings)} embeddings")
        
        return embeddings
        
    except Exception as e:
        logger.error(f"❌ Error generating batch embeddings: {str(e)}")
        raise Exception(f"Failed to generate batch embeddings: {str(e)}")


# Test function
if __name__ == "__main__":
    # Test embedding generation
    test_query = "What is the main topic of this document?"
    
    try:
        embedding = generate_query_embedding(test_query)
        print(f"✅ Success! Generated embedding with {len(embedding)} dimensions")
        print(f"First 5 values: {embedding[:5]}")
    except Exception as e:
        print(f"❌ Error: {e}")
