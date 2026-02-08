// Session ID management
export function getSessionId(): string {
  let sessionId = localStorage.getItem('session_id');
  
  if (!sessionId) {
    // Generate new UUID
    sessionId = crypto.randomUUID();
    localStorage.setItem('session_id', sessionId);
    console.log('📝 New session created:', sessionId);
  }
  
  return sessionId;
}

// Clear session (logout)
export function clearSession(): void {
  localStorage.removeItem('session_id');
  console.log('🗑️ Session cleared');
}

// Export session to file
export function exportSession(): void {
  const sessionId = getSessionId();
  const blob = new Blob([sessionId], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-session.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// Import session from file
export function importSession(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const sessionId = e.target?.result as string;
      localStorage.setItem('session_id', sessionId.trim());
      console.log('📥 Session imported:', sessionId);
      resolve(sessionId);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
