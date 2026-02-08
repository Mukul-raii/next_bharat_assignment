import axios from "axios";
import { getSessionId } from "../utils/session";
import API_URL from "./config";
import type {
  UploadResponse,
  DocumentListResponse,
  Document,
  AskResponse,
} from "../types";

// Upload document
export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(`${API_URL}/api/v1/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-Session-Id": getSessionId(),
    },
  });

  return response.data;
}

// List user's documents (filtered by session)
export async function listMyDocuments(): Promise<DocumentListResponse> {
  const sessionId = getSessionId();

  const response = await axios.get(`${API_URL}/api/v1/documents`, {
    params: { session_id: sessionId },
  });

  return response.data;
}

// Get specific document
export async function getDocument(documentId: string): Promise<Document> {
  const response = await axios.get(`${API_URL}/api/v1/documents/${documentId}`);
  return response.data;
}

// Ask question about document
export async function askQuestion(
  documentId: string,
  question: string
): Promise<AskResponse> {
  const response = await axios.post(
    `${API_URL}/api/v1/ask`,
    {
      document_id: documentId,
      question: question,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": getSessionId(),
      },
    }
  );

  return response.data;
}
