import { useState, useEffect } from "react";
import { askQuestion as askQuestionApi } from "../api/documents";
import type { Message, Document } from "../types";
import { chatStorage } from "../services/chatStorage";

export function useChat(document: Document | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    if (document) {
      // Load chat history from IndexedDB
      loadChatHistory(document.document_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id]);

  const loadChatHistory = async (documentId: string) => {
    try {
      const savedHistory = await chatStorage.getChatHistory(documentId);

      if (savedHistory && savedHistory.length > 0) {
        setMessages(savedHistory);
      } else {
        // No history, show welcome message
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          type: "bot",
          text: `Hello! I'm ready to answer questions about "${document?.filename}". What would you like to know?`,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
      setHistoryLoaded(true);
    } catch (error) {
      console.error("Failed to load chat history:", error);
      // Fallback to welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: "bot",
        text: `Hello! I'm ready to answer questions about "${document?.filename}". What would you like to know?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      setHistoryLoaded(true);
    }
  };

  const saveChatHistory = async (updatedMessages: Message[]) => {
    if (document) {
      try {
        await chatStorage.saveChatHistory(
          document.document_id,
          updatedMessages
        );
      } catch (error) {
        console.error("Failed to save chat history:", error);
      }
    }
  };

  const sendMessage = async (question: string) => {
    if (!document || !question.trim() || loading) return;

    if (!document.processed) {
      throw new Error("Document is not yet processed");
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text: question,
      timestamp: new Date(),
    };

    const updatedWithUser = [...messages, userMessage];
    setMessages(updatedWithUser);
    setLoading(true);

    try {
      const response = await askQuestionApi(document.document_id, question);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        text: response.answer,
        timestamp: new Date(),
        citations: response.citations,
      };

      const finalMessages = [...updatedWithUser, botMessage];
      setMessages(finalMessages);
      await saveChatHistory(finalMessages);
    } catch (error: any) {
      // Mock response when endpoint not ready
      const mockAnswer = `I understand you're asking about "${question}". However, the document processing is not yet complete. Once ready, I'll be able to search through "${document.filename}" and provide accurate answers with citations.`;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        text: error.response?.data?.detail || mockAnswer,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedWithUser, botMessage];
      setMessages(finalMessages);
      await saveChatHistory(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (document) {
      try {
        await chatStorage.deleteChatHistory(document.document_id);
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          type: "bot",
          text: `Hello! I'm ready to answer questions about "${document.filename}". What would you like to know?`,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error("Failed to clear chat history:", error);
      }
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    clearChat,
    historyLoaded,
  };
}
