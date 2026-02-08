import { useState } from 'react';
import { uploadDocument as uploadDocumentApi } from '../api/documents';

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const uploadDocument = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await uploadDocumentApi(file);
      setSuccess(response.message);
      return response;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Upload failed';
      setError(errorMsg);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    uploadDocument,
    uploading,
    error,
    success,
    resetMessages
  };
}
