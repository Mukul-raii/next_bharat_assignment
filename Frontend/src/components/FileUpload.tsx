import React, { useState } from 'react';
import { useUpload } from '../hooks/useUpload';
import { DocumentController } from '../controllers/DocumentController';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { uploadDocument, uploading, error, success, resetMessages } = useUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      resetMessages();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      resetMessages();
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    // Validate file
    const validation = DocumentController.validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      await uploadDocument(file);
      setFile(null);
      onUploadSuccess();
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      // Error already handled by useUpload hook
    }
  };

  return (
    <div className="bg-white p-6">
      <h2 className="mt-0 text-gray-900 text-xl mb-5 font-medium">📤 Upload Document</h2>
      
      <div 
        className={`border border-dashed border-gray-300 rounded p-10 px-[30px] text-center cursor-pointer transition-all duration-200 bg-gray-50 mb-4 hover:border-gray-500 hover:bg-gray-100 ${dragActive ? 'border-gray-800 bg-gray-200' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          accept=".pdf,.jpg,.jpeg,.png,.docx"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" className="cursor-pointer block">
          {file ? (
            <div className="flex items-center gap-[15px] justify-center">
              <span className="text-3xl">📄</span>
              <div>
                <div className="font-medium text-gray-900 break-words text-sm">{file.name}</div>
                <div className="text-gray-400 text-xs mt-1">{DocumentController.formatFileSize(file.size)}</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">
              <span className="text-4xl block mb-3 opacity-40">☁️</span>
              <p className="my-2.5 text-sm text-gray-800 font-normal">Drag & drop or click to select</p>
              <small className="text-gray-400 text-xs">PDF, JPG, PNG, DOCX (max 100MB)</small>
            </div>
          )}
        </label>
      </div>

      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
        className="w-full p-3 bg-gray-900 text-white border-none rounded text-sm font-medium cursor-pointer transition-all duration-200 tracking-wide hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        {uploading ? '⏳ Uploading...' : '🚀 Upload'}
      </button>

      {success && (
        <div className="mt-4 p-3 rounded text-sm border bg-gray-100 text-gray-800 border-gray-300">✅ {success}</div>
      )}
      
      {error && (
        <div className="mt-4 p-3 rounded text-sm border bg-gray-100 text-gray-900 border-gray-400">❌ {error}</div>
      )}
    </div>
  );
};

export default FileUpload;
