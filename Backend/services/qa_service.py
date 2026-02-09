from typing import Dict, List, Optional
import time
import logging

import requests
from config.settings import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_API_VERSION,
    AZURE_OPENAI_DEPLOYMENT_NAME,
    AZURE_OPENAI_ENDPOINT,
    AZURE_SEARCH_ENDPOINT,
    AZURE_SEARCH_INDEX_NAME,
    AZURE_SEARCH_KEY,
    OPENAI_API_KEY,
)
from openai import AzureOpenAI, OpenAI, RateLimitError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QAService:
    """Service for Question & Answer using Azure AI Search and OpenAI"""

    @staticmethod
    def search_documents(
        query: str, document_id: Optional[str] = None, top: int = 5
    ) -> List[Dict]:
        """
        Search Azure AI Search index for relevant document chunks

        Args:
            query: User's question
            document_id: Optional filter by specific document
            top: Number of results to return

        Returns:
            List of relevant document chunks with scores
        """
        logger.info(f"🔍 Searching documents - Query: '{query}', Document ID: {document_id}, Top: {top}")
        
        if not all([AZURE_SEARCH_ENDPOINT, AZURE_SEARCH_KEY, AZURE_SEARCH_INDEX_NAME]):
            raise Exception("Azure AI Search not properly configured")

        endpoint = AZURE_SEARCH_ENDPOINT.rstrip("/")
        url = f"{endpoint}/indexes/{AZURE_SEARCH_INDEX_NAME}/docs/search?api-version=2023-11-01"

        headers = {"Content-Type": "application/json", "api-key": AZURE_SEARCH_KEY}

        # Build search payload - use actual fields from blob indexer
        # Search in both content and merged_content (merged_content has OCR results)
        payload = {
            "search": query,
            "searchFields": "content,merged_content",
            "top": top,
            "highlight": "content,merged_content",
            "count": True,
        }

        # Note: Azure Blob indexer doesn't have a direct document_id field
        # So we'll search all documents and filter results after retrieval
        # This is not ideal but works for the current setup

        try:
            response = requests.post(url, headers=headers, json=payload)

            if response.status_code == 200:
                result = response.json()

                # Process results to extract useful information
                processed_results = []
                for doc in result.get("value", []):
                    # Extract document_id from base64 encoded path
                    import base64

                    encoded_path = doc.get("metadata_storage_path", "")
                    try:
                        encoded_path += "=" * (4 - len(encoded_path) % 4)
                        decoded_path = base64.b64decode(encoded_path).decode("utf-8")
                        # Extract document_id from path: .../documents/doc_id/filename
                        if "/documents/" in decoded_path:
                            extracted_doc_id = decoded_path.split("/documents/")[
                                1
                            ].split("/")[0]
                        else:
                            extracted_doc_id = "unknown"
                    except:
                        extracted_doc_id = "unknown"
                        print("Merged Content ", doc.get("Merged content", ""))
                        print("Content ", doc.get("content", ""))
                    processed_results.append(
                        {
                            "document_id": extracted_doc_id,
                            "content": doc.get("merged_content")
                            or doc.get("content", ""),
                            "text": doc.get("merged_content") or doc.get("content", ""),
                            "merged_content": doc.get("merged_content", ""),
                            "metadata_storage_path": decoded_path
                            if "decoded_path" in locals()
                            else "",
                            "@search.score": doc.get("@search.score", 0),
                            "@search.highlights": doc.get("@search.highlights", {}),
                        }
                    )

                # Filter by document_id if specified (post-filter since Azure Blob indexer doesn't have this field)
                if document_id:
                    before_filter = len(processed_results)
                    processed_results = [
                        r for r in processed_results if r["document_id"] == document_id
                    ]
                    logger.info(f"📄 Filtered by document_id: {before_filter} → {len(processed_results)} results")
                    
                    # If no results, try wildcard search for this document
                    if len(processed_results) == 0:
                        logger.info("⚠️ No results found, trying wildcard search")
                        payload["search"] = "*"
                        payload["top"] = 20
                        resp2 = requests.post(url, headers=headers, json=payload)
                        if resp2.status_code == 200:
                            for doc in resp2.json().get("value", []):
                                path = doc.get("metadata_storage_path", "")
                                if document_id in base64.b64decode(path + "=" * (4 - len(path) % 4)).decode("utf-8", errors="ignore"):
                                    processed_results.append({
                                        "document_id": document_id,
                                        "content": doc.get("merged_content") or doc.get("content", ""),
                                        "text": doc.get("merged_content") or doc.get("content", ""),
                                        "@search.score": 1.0,
                                    })

                logger.info(f"✅ Search completed: Found {len(processed_results)} relevant chunks")
                for i, result in enumerate(processed_results[:2], 1):  # Log first 2 results
                    content_preview = result.get("content", "")[:150]
                    logger.info(f"  Result {i}: Score={result.get('@search.score', 0):.2f}, DocID={result.get('document_id')}, Content={content_preview}...")

                return processed_results
            else:
                raise Exception(
                    f"Search failed: {response.status_code} - {response.text}"
                )

        except Exception as e:
            raise Exception(f"Error searching documents: {str(e)}")

    @staticmethod
    def generate_answer(question: str, context_chunks: List[Dict]) -> Dict:
        """
        Generate answer using Azure OpenAI GPT with retrieved context

        Args:
            question: User's question
            context_chunks: Relevant chunks from search

        Returns:
            Dict with answer and citations
        """
        logger.info(f"🤖 Generating answer for question: '{question}'")
        logger.info(f"📚 Using {len(context_chunks)} context chunks")
        
        # Check if using Azure OpenAI or regular OpenAI
        use_azure = all(
            [AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT_NAME]
        )

        if not use_azure and not OPENAI_API_KEY:
            raise Exception("Neither Azure OpenAI nor OpenAI API key configured")

        # Build context from chunks
        context = "\n\n".join(
            [
                f"[Document {i + 1}] {chunk.get('merged_content') or chunk.get('content', chunk.get('text', ''))}"
                for i, chunk in enumerate(context_chunks)
            ]
        )

        if not context:
            logger.warning("⚠️ No context available to generate answer")
            return {
                "answer": "I couldn't find relevant information in the uploaded documents to answer your question.",
                "citations": [],
                "confidence": "low",
            }
        
        # Log context preview
        context_preview = context[:500] + "..." if len(context) > 500 else context
        logger.info(f"📝 Context preview (first 500 chars):\n{context_preview}")

        # Create prompt for GPT
        system_prompt = """You are a helpful AI assistant that answers questions based on provided document excerpts.

Rules:
1. Answer ONLY based on the provided context
2. If the answer is not in the context, say "I don't have enough information to answer that"
3. Be concise and accurate
4. Reference which document(s) you used in your answer
5. If you're uncertain, indicate that"""

        # Create combined prompt for reasoning models (o-series doesn't support system messages well)
        # Combine system instructions with user prompt for better results
        combined_prompt = f"""{system_prompt}

Context from documents:
{context}

Question: {question}

Please provide a clear answer based on the context above."""

        # Log the full prompt being sent
        logger.info(f"📤 Sending prompt to OpenAI (length: {len(combined_prompt)} chars)")
        logger.info(f"💬 Full prompt:\n{'='*60}\n{combined_prompt}\n{'='*60}")

        try:
            # Use Azure OpenAI if configured, otherwise use regular OpenAI
            if use_azure:
                client = AzureOpenAI(
                    api_key=AZURE_OPENAI_API_KEY,
                    api_version=AZURE_OPENAI_API_VERSION,
                    azure_endpoint=AZURE_OPENAI_ENDPOINT,
                    timeout=20.0,  # Reduced from 30 to 20 seconds
                    max_retries=0,  # Disable automatic retries, we'll handle manually
                )
                
                # Retry logic for rate limits
                max_retries = 2  # Allow 2 retries for better reliability
                retry_delay = 5  # Wait 5 seconds between retries
                
                for attempt in range(max_retries):
                    try:
                        logger.info(f"🚀 Calling Azure OpenAI API (attempt {attempt + 1}/{max_retries})")
                        logger.info(f"   Model: {AZURE_OPENAI_DEPLOYMENT_NAME}")
                        
                        # Optimized parameters for document Q&A
                        response = client.chat.completions.create(
                            model=AZURE_OPENAI_DEPLOYMENT_NAME,
                            messages=[{"role": "user", "content": combined_prompt}],
                            temperature=0.3,  # Low temperature for factual, consistent answers
                            max_tokens=1200,  # Sufficient for detailed responses
                            top_p=0.95,  # High-quality token selection
                            frequency_penalty=0.3,  # Reduce repetition
                            presence_penalty=0.1,  # Encourage focused answers
                        )
                        
                        logger.info(f"✅ Received response from OpenAI")
                        logger.info(f"   Tokens used: {response.usage.total_tokens if response.usage else 'N/A'}")
                        logger.info(f"   Answer length: {len(response.choices[0].message.content)} chars")
                        logger.info(f"📩 AI Response: {response.choices[0].message.content[:300]}...")
                        
                        break  # Success, exit retry loop
                    except RateLimitError as e:
                        logger.error(f"⚠️ Rate limit error: {str(e)[:200]}")
                        if attempt < max_retries - 1:
                            logger.info(f"⏳ Retrying after {retry_delay} seconds...")
                            time.sleep(retry_delay)
                            continue
                        else:
                            # Return friendly error message instead of raising
                            return {
                                "answer": "I'm currently experiencing high demand. Please try again in a minute.",
                                "citations": [],
                                "confidence": "none",
                                "error": "rate_limit"
                            }
                    except Exception as e:
                        # Catch timeout and other errors
                        error_msg = str(e)
                        logger.error(f"❌ Error calling OpenAI: {error_msg[:300]}")
                        if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                            return {
                                "answer": "The request timed out. Please try again with a simpler question.",
                                "citations": [],
                                "confidence": "none",
                                "error": "timeout"
                            }
                        # Re-raise other exceptions
                        raise
            else:
                client = OpenAI(
                    api_key=OPENAI_API_KEY,
                    timeout=20.0,
                    max_retries=0
                )
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
                    ],
                    temperature=0.3,
                    max_tokens=500,
                )

            answer = response.choices[0].message.content

            # Extract citations (document IDs mentioned in chunks)
            citations = []
            for i, chunk in enumerate(context_chunks, 1):
                # Get document ID from chunk
                doc_id = chunk.get("document_id", "unknown")
                content = chunk.get("content", chunk.get("text", ""))

                # Truncate content for citation
                citation_text = content[:300] + "..." if len(content) > 300 else content

                citations.append(
                    {
                        "document_id": doc_id,
                        "source": f"Document {i}",
                        "text": citation_text,
                        "score": chunk.get("@search.score", 0),
                    }
                )

            logger.info(f"📋 Generated {len(citations)} citations")
            
            return {
                "answer": answer,
                "citations": citations,
                "confidence": "high" if len(context_chunks) > 0 else "low",
            }

        except Exception as e:
            logger.error(f"❌ Error generating answer: {str(e)}")
            raise Exception(f"Error generating answer: {str(e)}")

    @staticmethod
    def ask_question(
        question: str,
        document_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> Dict:
        """
        Complete Q&A pipeline: search + generate answer

        Args:
            question: User's question
            document_id: Optional filter by specific document
            session_id: Optional session ID for tracking

        Returns:
            Dict with answer, citations, and metadata
        """
        logger.info(f"\n{'='*80}")
        logger.info(f"🎯 NEW Q&A REQUEST")
        logger.info(f"   Question: '{question}'")
        logger.info(f"   Document ID: {document_id}")
        logger.info(f"   Session ID: {session_id}")
        logger.info(f"{'='*80}\n")
        
        try:
            # Step 1: Search for relevant chunks
            search_results = QAService.search_documents(question, document_id, top=5)

            if not search_results:
                return {
                    "question": question,
                    "answer": "No relevant information found in the uploaded documents.",
                    "citations": [],
                    "confidence": "none",
                    "status": "success",
                }

            # Step 2: Generate answer with GPT
            result = QAService.generate_answer(question, search_results)

            return {
                "question": question,
                "answer": result["answer"],
                "citations": result["citations"],
                "confidence": result["confidence"],
                "chunks_found": len(search_results),
                "status": "success",
            }

        except Exception as e:
            return {
                "question": question,
                "answer": None,
                "error": str(e),
                "status": "error",
            }
