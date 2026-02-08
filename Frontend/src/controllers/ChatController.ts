import { askQuestion } from '../api/documents';

export class ChatController {
  static async askQuestion(documentId: string, question: string) {
    try {
      const response = await askQuestion(documentId, question);
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get answer'
      };
    }
  }

  static validateQuestion(question: string): { valid: boolean; error?: string } {
    if (!question.trim()) {
      return {
        valid: false,
        error: 'Question cannot be empty'
      };
    }

    if (question.length > 1000) {
      return {
        valid: false,
        error: 'Question is too long (max 1000 characters)'
      };
    }

    return { valid: true };
  }

  static formatTimestamp(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
