import { askQuestion } from "../api/documents";

export class ChatController {
  static async askQuestion(documentId: string, question: string) {
    try {
      const response = await askQuestion(documentId, question);
      return {
        success: true,
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || "Failed to get answer",
      };
    }
  }

  static validateQuestion(question: string): {
    valid: boolean;
    error?: string;
  } {
    if (!question.trim()) {
      return {
        valid: false,
        error: "Question cannot be empty",
      };
    }

    if (question.length > 1000) {
      return {
        valid: false,
        error: "Question is too long (max 1000 characters)",
      };
    }

    return { valid: true };
  }

  static formatTimestamp(date: Date): string {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  static formatCitationReference(citation: any): string {
    const parts = [];

    if (citation.page_number) {
      parts.push(`Page ${citation.page_number}`);
    }

    if (citation.section) {
      parts.push(citation.section);
    }

    if (citation.chunk_id) {
      parts.push(`Chunk ${citation.chunk_id}`);
    }

    return parts.length > 0 ? parts.join(", ") : "Reference";
  }

  static getSimilarityLabel(score: number): string {
    if (score >= 0.9) return "Excellent Match";
    if (score >= 0.8) return "High Relevance";
    if (score >= 0.7) return "Good Match";
    if (score >= 0.6) return "Moderate Match";
    return "Low Relevance";
  }

  static getSimilarityColor(score: number): string {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-blue-600";
    return "text-gray-600";
  }
}
