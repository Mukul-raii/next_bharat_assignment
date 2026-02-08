import React from "react";
import FileUpload from "./components/FileUpload";
import DocumentList from "./components/DocumentList";
import ChatInterface from "./components/ChatInterface";
import SessionInfo from "./components/SessionInfo";
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
      <header className="bg-white p-5 border-b border-gray-200 text-center flex justify-center items-center relative">
        <div className="text-center">
          <h1 className="m-0 text-gray-900 text-3xl font-medium tracking-tight">
            📄 Document Q&A Agent
          </h1>
          <p className="mt-2 text-gray-500 text-sm font-normal">
            Upload documents and ask questions
          </p>
        </div>
        <SessionInfo />
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
            <div className="flex flex-col items-center justify-center h-full text-center p-10 text-gray-500">
              <h2 className="text-2xl mb-2.5 text-gray-800 font-normal">
                👈 Select a document to start asking questions
              </h2>
              <p className="text-sm text-gray-400">
                Upload a document first, then select it from the list to chat
                with it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
