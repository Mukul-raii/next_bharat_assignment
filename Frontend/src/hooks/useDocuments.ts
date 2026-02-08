import { useState, useEffect, useCallback } from "react";
import { listMyDocuments } from "../api/documents";
import type { Document } from "../types";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listMyDocuments();
      setDocuments(response.documents);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch documents");
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();

    // Auto-refresh to check for document processing status updates
    // Check every 10 seconds - simple and consistent
    const interval = setInterval(() => {
      fetchDocuments();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [fetchDocuments]); // Only depend on fetchDocuments, NOT documents

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
  };
}
