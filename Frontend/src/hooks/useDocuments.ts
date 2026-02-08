import { useState, useEffect, useCallback, useRef } from "react";
import { listMyDocuments } from "../api/documents";
import type { Document } from "../types";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousDocsRef = useRef<Document[]>([]);

  const fetchDocuments = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const response = await listMyDocuments();
      const newDocs = response.documents;

      // Only update state if documents actually changed
      const hasChanged = hasDocumentsChanged(previousDocsRef.current, newDocs);

      if (hasChanged) {
        setDocuments(newDocs);
        previousDocsRef.current = newDocs;
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || "Failed to fetch documents");
      console.error("Error fetching documents:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Helper function to check if documents changed
  const hasDocumentsChanged = (oldDocs: Document[], newDocs: Document[]) => {
    // Different count means something changed
    if (oldDocs.length !== newDocs.length) return true;

    // Check if any document status or key properties changed
    for (let i = 0; i < newDocs.length; i++) {
      const oldDoc = oldDocs.find(
        (d) => d.document_id === newDocs[i].document_id
      );
      if (!oldDoc) return true; // New document

      // Check if status changed (most important for UI updates)
      if (oldDoc.status !== newDocs[i].status) return true;

      // Check if processing state changed
      if (oldDoc.processed !== newDocs[i].processed) return true;
    }

    return false; // No meaningful changes
  };

  useEffect(() => {
    // Initial fetch with loading indicator
    fetchDocuments(true);

    // Auto-refresh to check for status updates (without loading indicator)
    // Only updates UI when status actually changes
    const interval = setInterval(() => {
      fetchDocuments(false); // Silent refresh
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
  };
}
