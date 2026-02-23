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
      <div className="flex h-full flex-col overflow-hidden bg-slate-50">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            Documents
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-slate-500">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Documents
        </h2>
        {onRefresh && (
          <button
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 transition hover:bg-white"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh"
          >
            Refresh
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="text-center">
            <p className="mb-1 text-sm text-slate-600">No documents yet</p>
            <p className="text-xs text-slate-400">Upload a file from chat</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`cursor-pointer border-b border-slate-200 px-4 py-3 transition-colors ${
                selectedDocumentId === doc.document_id
                  ? "bg-white"
                  : "hover:bg-white/70"
              }`}
              onClick={() => onSelectDocument(doc)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div
                    className="mb-1 truncate text-sm font-medium text-slate-900"
                    title={doc.filename}
                  >
                    {truncateFilename(doc.filename)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>
                      {DocumentController.formatFileSize(doc.file_size)}
                    </span>
                    <span>•</span>
                    <span>{formatDate(doc.upload_date)}</span>
                  </div>
                </div>
                <div className="shrink-0 pt-0.5">
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
