import React from "react";
import DocumentList from "./components/DocumentList";
import ChatInterface from "./components/ChatInterface";
import { useDocuments } from "./hooks/useDocuments";
import type { Document } from "./types";

function App() {
  const { documents, loading, refetch } = useDocuments();
  const [selectedDocumentId, setSelectedDocumentId] = React.useState<
    string | null
  >(null);
  const [isDocumentsDrawerOpen, setIsDocumentsDrawerOpen] =
    React.useState(false);

  // Get the latest version of selected document from documents array
  const selectedDocument = React.useMemo(() => {
    if (!selectedDocumentId) return null;
    return (
      documents.find((doc) => doc.document_id === selectedDocumentId) || null
    );
  }, [selectedDocumentId, documents]);

  const handleUploadSuccess = async (uploadedDocumentId?: string) => {
    await refetch();
    if (uploadedDocumentId) {
      setSelectedDocumentId(uploadedDocumentId);
    }
  };

  const handleSelectDocument = (doc: Document) => {
    setSelectedDocumentId(doc.document_id);
    setIsDocumentsDrawerOpen(false);
  };

  const handleNewChat = () => {
    setSelectedDocumentId(null);
    setIsDocumentsDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 ">
      <div className="relative mx-auto flex h-screen w-full  overflow-hidden bg-white  md:rounded-2xl md:border md:border-slate-200">
        <aside className="hidden w-[320px] border-r border-slate-200 bg-slate-50 lg:flex lg:flex-col">
          <div className="flex h-[72px] items-center justify-between border-b border-slate-200 px-5">
            <div>
              <h1 className="text-base font-semibold text-slate-900">
                Documents
              </h1>
              <p className="text-xs text-slate-500">
                Choose a file to chat with
              </p>
            </div>
            <button
              type="button"
              onClick={handleNewChat}
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white"
            >
              + New Chat
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <DocumentList
              documents={documents}
              loading={loading}
              onSelectDocument={handleSelectDocument}
              selectedDocumentId={selectedDocumentId || undefined}
              onRefresh={refetch}
            />
          </div>
        </aside>

        <div className="flex min-h-0 flex-1">
          <ChatInterface
            document={selectedDocument}
            onUploadSuccess={handleUploadSuccess}
            onRequestOpenDocuments={() => setIsDocumentsDrawerOpen(true)}
          />
        </div>

        {isDocumentsDrawerOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
              onClick={() => setIsDocumentsDrawerOpen(false)}
              aria-label="Close documents panel"
            />
            <aside className="fixed left-0 top-0 z-40 flex h-full w-[85vw] max-w-[340px] flex-col border-r border-slate-200 bg-white shadow-xl lg:hidden">
              <div className="flex h-[72px] items-center justify-between border-b border-slate-200 px-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Documents
                  </h2>
                  <p className="text-xs text-slate-500">Select document</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
                    onClick={handleNewChat}
                  >
                    + New Chat
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
                    onClick={() => setIsDocumentsDrawerOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <DocumentList
                  documents={documents}
                  loading={loading}
                  onSelectDocument={handleSelectDocument}
                  selectedDocumentId={selectedDocumentId || undefined}
                  onRefresh={refetch}
                />
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
