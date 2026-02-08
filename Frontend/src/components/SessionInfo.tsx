import React, { useState } from 'react';
import { getSessionId, clearSession, exportSession, importSession } from '../utils/session';

const SessionInfo: React.FC = () => {
  const [sessionId] = useState(getSessionId());
  const [showMenu, setShowMenu] = useState(false);

  const handleClearSession = () => {
    if (window.confirm('Clear your session? You will lose access to your uploaded documents.')) {
      clearSession();
      window.location.reload();
    }
  };

  const handleExportSession = () => {
    exportSession();
    alert('✅ Session ID exported! Save this file to restore your documents later.');
  };

  const handleImportSession = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          await importSession(file);
          alert('✅ Session imported successfully!');
          window.location.reload();
        } catch (error) {
          alert('❌ Failed to import session');
        }
      }
    };
    input.click();
  };

  return (
    <div className="relative ml-5">
      <button 
        className="bg-transparent border border-gray-300 text-gray-800 py-2 px-4 rounded cursor-pointer text-sm transition-all duration-150 hover:border-gray-800 hover:bg-gray-50"
        onClick={() => setShowMenu(!showMenu)}
        title="Session Management"
      >
        🔑 Session: {sessionId.slice(0, 8)}...
      </button>
      
      {showMenu && (
        <div className="absolute top-[50px] right-0 bg-white border border-gray-200 rounded shadow-lg p-4 min-w-[300px] z-[1000]">
          <div className="mb-3 pb-3 border-b border-gray-200">
            <small className="block text-gray-500 mb-1.5 text-xs uppercase tracking-wide">Full Session ID:</small>
            <code className="block bg-gray-100 p-2 rounded-sm text-xs break-all text-gray-800 font-mono border border-gray-200">{sessionId}</code>
          </div>
          <button 
            onClick={handleExportSession}
            className="w-full p-2.5 my-1.5 border border-gray-300 rounded bg-white cursor-pointer text-sm transition-all duration-150 text-left font-normal hover:bg-gray-50 hover:border-gray-800"
          >
            💾 Export Session
          </button>
          <button 
            onClick={handleImportSession}
            className="w-full p-2.5 my-1.5 border border-gray-300 rounded bg-white cursor-pointer text-sm transition-all duration-150 text-left font-normal hover:bg-gray-50 hover:border-gray-800"
          >
            📥 Import Session
          </button>
          <button 
            onClick={handleClearSession} 
            className="w-full p-2.5 my-1.5 border rounded bg-white cursor-pointer text-sm transition-all duration-150 text-left font-normal text-gray-900 border-gray-400 hover:bg-gray-100 hover:border-gray-600"
          >
            🗑️ Clear Session
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionInfo;
