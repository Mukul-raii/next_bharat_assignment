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

  const getStatusEmoji = (status: string, processed: boolean) => {
    if (processed) return "✅";
    if (status === "uploaded") return "📤";
    if (status === "processing") return "⏳";
    return "📄";
  };

  const truncateFilename = (filename: string, maxLength: number = 35) => {
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
      <div className="bg-white p-6 flex-1 overflow-hidden flex flex-col">
        <h2 className="mt-0 text-gray-900 text-xl mb-5 font-medium">
          📚 Your Documents
        </h2>
        <div className="text-center text-gray-400 py-[60px] px-5">
          <p className="text-[0.95rem] mb-2 text-gray-600">
            Loading documents...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 flex-1 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-5">
        <h2 className="m-0 text-gray-900 text-xl font-medium">
          📚 Your Documents
        </h2>
        {onRefresh && (
          <button
            className="bg-transparent border border-gray-300 rounded p-1.5 px-2.5 text-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-gray-600 hover:border-gray-800 hover:bg-gray-50 hover:rotate-90 active:rotate-180 disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh document list"
          >
            🔄
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="text-center text-gray-400 py-[60px] px-5">
          <p className="text-[0.95rem] mb-2 text-gray-600">No documents yet</p>
          <small className="text-gray-400 text-sm">
            Upload your first document to get started
          </small>
        </div>
      ) : (
        <div className="overflow-y-auto flex flex-col gap-[1px] bg-gray-200 -m-2 p-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`p-4 border-none rounded-none cursor-pointer transition-all duration-150 flex justify-between items-center bg-white border-l-2 border-transparent hover:bg-gray-50 hover:border-gray-800 ${
                selectedDocumentId === doc.id
                  ? "bg-gray-100 border-gray-900"
                  : ""
              }`}
              onClick={() => onSelectDocument(doc)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xl flex-shrink-0 opacity-60">
                  {getStatusEmoji(doc.status, doc.processed)}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-normal text-gray-900 text-sm break-words leading-snug max-w-full"
                    title={doc.filename}
                  >
                    {truncateFilename(doc.filename)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {DocumentController.formatFileSize(doc.file_size)} •{" "}
                    {formatDate(doc.upload_date)}
                  </div>
                </div>
              </div>
              {doc.processed ? (
                <span className="px-2.5 py-1 rounded-sm text-[0.7rem] font-medium flex-shrink-0 tracking-wide uppercase bg-gray-200 text-gray-800">
                  Ready
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-sm text-[0.7rem] font-medium flex-shrink-0 tracking-wide uppercase bg-gray-100 text-gray-600 flex items-center gap-1">
                  Processing...
                  <span className="inline-flex gap-0.5">
                    <span className="animate-dot-pulse">.</span>
                    <span className="animate-dot-pulse delay-75">.</span>
                    <span className="animate-dot-pulse delay-150">.</span>
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;
