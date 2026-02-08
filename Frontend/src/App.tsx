import React from "react";
import FileUpload from "./components/FileUpload";
import DocumentList from "./components/DocumentList";
import ChatInterface from "./components/ChatInterface";
import { useDocuments } from "./hooks/useDocuments";
import type { Document } from "./types";

function App() {
  const { documents, loading, refetch } = useDocuments();
  const [selectedDocument, setSelectedDocument] =
    React.useState<Document | null>(null);

  const handleUploadSuccess = () => {
    refetch();
  };

  const handleSelectDocument = (doc: Document) => {
    setSelectedDocument(doc);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 ">
        <div className="max-w-7xl  px-2 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 uppercase tracking-wide">
              Document Q&A
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              Upload documents and ask questions
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row mx-auto gap-[1px] p-0 h-auto lg:h-[calc(100vh-100px)] bg-gray-200">
        <div className="flex-1 lg:flex-none lg:w-[350px] flex flex-col gap-[1px] bg-gray-200">
          <FileUpload onUploadSuccess={handleUploadSuccess} />
          <DocumentList
            documents={documents}
            loading={loading}
            onSelectDocument={handleSelectDocument}
            selectedDocumentId={selectedDocument?.id}
            onRefresh={refetch}
          />
        </div>

        <div className="flex-1 bg-white overflow-hidden min-h-[500px] lg:min-h-0">
          {selectedDocument ? (
            <ChatInterface document={selectedDocument} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 text-gray-400">
              <div className="text-4xl mb-3 text-gray-300">←</div>
              <h2 className="text-lg font-medium text-gray-600 mb-1">
                Select a document
              </h2>
              <p className="text-sm text-gray-400">
                Upload a document first, then select it from the list to start
                asking questions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
