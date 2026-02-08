#!/usr/bin/env python3
"""
Test script for Q&A functionality
Run this after:
1. Uploading a document
2. AI Search indexer has processed it
"""

import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_qa(question: str, document_id: str = None):
    """Test the Q&A endpoint"""
    print(f"\n{'='*60}")
    print(f"Question: {question}")
    print(f"{'='*60}\n")
    
    payload = {
        "question": question,
    }
    
    if document_id:
        payload["document_id"] = document_id
        print(f"Filtering by document: {document_id}\n")
    
    try:
        response = requests.post(f"{BASE_URL}/ask", json=payload)
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"✅ Answer:")
            print(f"{result.get('answer')}\n")
            
            print(f"Confidence: {result.get('confidence')}")
            print(f"Chunks found: {result.get('chunks_found')}\n")
            
            if result.get('citations'):
                print(f"Citations ({len(result['citations'])} sources):")
                for i, citation in enumerate(result['citations'][:3], 1):
                    print(f"  [{i}] Document: {citation.get('document_id')}")
                    print(f"      {citation.get('text')}\n")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")


if __name__ == "__main__":
    print("🤖 Document Q&A Test Script")
    print("="*60)
    
    # Test questions
    questions = [
        "What is the main topic of the document?",
        "Can you summarize the key points?",
        "What are the important dates mentioned?",
    ]
    
    # If document_id provided as argument, use it
    doc_id = sys.argv[1] if len(sys.argv) > 1 else None
    
    for q in questions:
        test_qa(q, doc_id)
        input("\nPress Enter for next question...")
    
    print("\n✅ Test complete!")
