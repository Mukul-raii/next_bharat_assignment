import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Document } from "../types";
import { useChat } from "../hooks/useChat";
import { ChatController } from "../controllers/ChatController";
import FileUpload from "./FileUpload";

interface ChatInterfaceProps {
  document: Document | null;
  onUploadSuccess?: (documentId?: string) => void;
  onRequestOpenDocuments?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  document,
  onUploadSuccess,
  onRequestOpenDocuments,
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendMessage, clearChat, historyLoaded } =
    useChat(document);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !document) return;

    if (!document.processed) {
      alert("⏳ Please wait for the document to be processed first.");
      return;
    }

    const validation = ChatController.validateQuestion(input);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      await sendMessage(input);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (
      window.confirm(
        "Are you sure you want to clear the chat history for this document?"
      )
    ) {
      clearChat();
    }
  };

  // Show empty state when no document is selected
  if (!document) {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Document Q&A
            </h2>
            <p className="text-xs text-slate-500">
              AI-powered document intelligence
            </p>
          </div>
          {onRequestOpenDocuments && (
            <button
              type="button"
              onClick={onRequestOpenDocuments}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 lg:hidden"
            >
              📄 Documents
            </button>
          )}
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 p-8">
          <div className="w-full max-w-2xl text-center">
            <div className="mb-8">
              <div className="mb-4 text-6xl">📄</div>
              <h2 className="mb-2 text-2xl font-semibold text-slate-900">
                Welcome to Document Q&A
              </h2>
              <p className="text-slate-600">
                Upload a document to start asking questions
              </p>
            </div>

            <div className="mx-auto w-full max-w-xl">
              <FileUpload
                onUploadSuccess={(docId?: string) => {
                  if (onUploadSuccess) {
                    onUploadSuccess(docId);
                  }
                }}
              />
            </div>

            <div className="mt-8 text-left">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">
                ✨ What you can do:
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Upload PDF, DOCX, PNG, or JPG files</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Ask questions about your documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Get AI-powered answers with citations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Chat history is saved automatically</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-5 text-gray-900">
        <div>
          <h3 className="m-0 text-xl font-medium">💬 Chat with Document</h3>
          <p className="mt-1.5 text-sm text-gray-500">{document.filename}</p>
        </div>
        <div className="flex items-center gap-2.5">
          {onRequestOpenDocuments && (
            <button
              type="button"
              onClick={onRequestOpenDocuments}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 lg:hidden"
            >
              📄 Docs
            </button>
          )}
          {!document.processed && (
            <span className="bg-gray-100 text-gray-500 py-1.5 px-3 rounded-sm text-xs font-medium uppercase tracking-wide">
              ⏳ Processing...
            </span>
          )}
          {historyLoaded && messages.length > 1 && (
            <button
              className="bg-transparent border border-gray-300 rounded px-2.5 py-1.5 text-lg cursor-pointer transition-all duration-150 flex items-center justify-center hover:border-gray-500 hover:bg-gray-50"
              onClick={handleClearChat}
              title="Clear chat history"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-6">
        {!historyLoaded ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            <p>Loading chat history...</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 mb-6 animate-fadeIn ${
                  message.type === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div className="text-2xl flex-shrink-0 opacity-60">
                  {message.type === "user" ? "👤" : "🤖"}
                </div>
                <div
                  className={`max-w-[75%] p-3.5 px-4 rounded border ${
                    message.type === "user"
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div
                    className={`leading-relaxed text-sm prose prose-sm max-w-none ${
                      message.type === "user" ? "prose-invert" : "prose-slate"
                    }`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                      <strong className="block mb-2 font-medium text-gray-600 text-xs uppercase tracking-wide">
                        📎 References
                      </strong>
                      {message.citations.map((citation, idx: number) => {
                        // Format the reference location
                        const location = [];
                        if (citation.page_number) {
                          location.push(`Page ${citation.page_number}`);
                        }
                        if (citation.section) {
                          location.push(citation.section);
                        }
                        if (citation.chunk_id) {
                          location.push(`Chunk ${citation.chunk_id}`);
                        }
                        const locationStr =
                          location.length > 0
                            ? location.join(", ")
                            : `Reference ${idx + 1}`;

                        return (
                          <div
                            key={idx}
                            className="bg-gray-50 p-3 rounded mb-2 border-l-3 border-blue-400 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-semibold text-gray-800 text-xs">
                                📄 {locationStr}
                              </div>
                            </div>
                            <div className="text-gray-600 text-xs leading-relaxed italic border-l-2 border-gray-300 pl-2">
                              "
                              {citation.text.length > 200
                                ? citation.text.substring(0, 200) + "..."
                                : citation.text}
                              "
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div
                    className={`text-xs mt-2 ${
                      message.type === "user"
                        ? "text-white/50"
                        : "text-gray-400"
                    }`}
                  >
                    {ChatController.formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 mb-6 animate-fadeIn">
                <div className="text-2xl flex-shrink-0 opacity-60">🤖</div>
                <div className="max-w-[75%] bg-white p-3.5 px-4 rounded border border-gray-200">
                  <div className="flex gap-1 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-typing"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-typing delay-100"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-typing delay-200"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="flex shrink-0 gap-2.5 border-t border-gray-200 bg-white p-5 px-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            document.processed ? "Ask a question..." : "Wait for processing..."
          }
          disabled={loading || !document.processed}
          className="flex-1 rounded border border-gray-300 p-3 px-4 text-sm outline-none transition-colors duration-150 focus:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim() || !document.processed}
          className="h-[42px] shrink-0 cursor-pointer rounded border-none bg-gray-900 px-5 text-sm font-medium text-white transition-all duration-150 hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          {loading ? "⏳" : "📤"}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
