import React, { useState, useRef, useEffect } from "react";
import type { Document } from "../types";
import { useChat } from "../hooks/useChat";
import { ChatController } from "../controllers/ChatController";

interface ChatInterfaceProps {
  document: Document;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ document }) => {
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
    if (!input.trim() || loading) return;

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
    } catch (error: any) {
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

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 px-6 border-b border-gray-200 bg-white text-gray-900 flex justify-between items-center">
        <div>
          <h3 className="m-0 text-xl font-medium">💬 Chat with Document</h3>
          <p className="mt-1.5 text-sm text-gray-500">{document.filename}</p>
        </div>
        <div className="flex items-center gap-2.5">
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

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {!historyLoaded ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
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
                  <div className="leading-relaxed break-words text-sm">
                    {message.text}
                  </div>
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                      <strong className="block mb-2 font-medium text-gray-500">
                        📎 Sources:
                      </strong>
                      {message.citations.map((citation: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-gray-100 p-2.5 rounded-sm mt-1.5 text-gray-500 border-l-2 border-gray-300"
                        >
                          <div className="font-medium text-gray-800 text-xs mb-1">
                            {citation.source || `Source ${idx + 1}`}
                          </div>
                          <div className="text-gray-500 text-xs leading-normal mb-1">
                            {citation.text}
                          </div>
                          {citation.score && (
                            <div className="text-[0.7rem] text-gray-400">
                              Relevance: {(citation.score * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>
                      ))}
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

      <div className="p-5 px-6 border-t border-gray-200 flex gap-2.5 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            document.processed ? "Ask a question..." : "Wait for processing..."
          }
          disabled={loading || !document.processed}
          className="flex-1 p-3 px-4 border border-gray-300 rounded text-sm outline-none transition-colors duration-150 focus:border-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim() || !document.processed}
          className="px-5 h-[42px] border-none rounded bg-gray-900 text-white text-sm cursor-pointer transition-all duration-150 flex-shrink-0 font-medium hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "⏳" : "📤"}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
