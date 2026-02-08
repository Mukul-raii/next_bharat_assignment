import React from "react";
import type { Document } from "../types";
import { DocumentController } from "../controllers/DocumentController";

interface DocumentListProps {
  documents: Document[];
  loading?: boolean;
  onSelectDocument: (doc: Document) => void;
  selectedDocumentId?: string;
  onRefresh?: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  loading,
  onSelectDocument,
  selectedDocumentId,
  onRefresh,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getStatusBadge = (status: string, processed: boolean) => {
    if (processed) {
      return (
        <span className="text-xs text-green-700 font-medium">● Ready</span>
      );
    }
    if (status === "processing") {
      return (
        <span className="text-xs text-blue-600 font-medium">● Processing</span>
      );
    }
    return (
      <span className="text-xs text-gray-500 font-medium">● Uploaded</span>
    );
  };

  const truncateFilename = (filename: string, maxLength: number = 40) => {
    if (filename.length <= maxLength) return filename;

    const extension = filename.substring(filename.lastIndexOf("."));
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
    const truncatedName = nameWithoutExt.substring(
      0,
      maxLength - extension.length - 3
    );

    return `${truncatedName}...${extension}`;
  };

  if (loading) {
    return (
      <div className="bg-white flex-1 overflow-hidden flex flex-col border-l border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Documents
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white flex-1 overflow-hidden flex flex-col border-l border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Documents
        </h2>
        {onRefresh && (
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh"
          >
            ↻
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">No documents</p>
            <p className="text-xs text-gray-400">Upload a document to begin</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`px-6 py-4 cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-50 ${
                selectedDocumentId === doc.id
                  ? "bg-blue-50 border-l-2 border-l-blue-600"
                  : "border-l-2 border-l-transparent"
              }`}
              onClick={() => onSelectDocument(doc)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium text-gray-900 truncate mb-1"
                    title={doc.filename}
                  >
                    {truncateFilename(doc.filename)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {DocumentController.formatFileSize(doc.file_size)}
                    </span>
                    <span>•</span>
                    <span>{formatDate(doc.upload_date)}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  {getStatusBadge(doc.status, doc.processed)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
