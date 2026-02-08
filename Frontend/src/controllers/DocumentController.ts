import { uploadDocument } from '../api/documents';

export class DocumentController {
  static async uploadFile(file: File) {
    try {
      const response = await uploadDocument(file);
      return {
        success: true,
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Upload failed'
      };
    }
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];
    const maxSize = 100 * 1024 * 1024; // 100MB

    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds 100MB`
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty'
      };
    }

    return { valid: true };
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
