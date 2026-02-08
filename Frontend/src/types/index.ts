export interface Document {
  id: string;
  document_id: string;
  session_id: string;
  filename: string;
  status: string;
  upload_date: string;
  processed: boolean;
  file_size: number;
  file_type: string;
  blob_name: string;
  blob_url?: string;
  error_message?: string;
}

export interface Citation {
  text: string;
  page_number?: number;
  section?: string;
  chunk_id?: string;
  score?: number;
  document_name?: string;
}

export interface Message {
  id: string;
  type: "user" | "bot";
  text: string;
  timestamp: Date;
  citations?: Citation[];
}

export interface UploadResponse {
  message: string;
  document_id: string;
  filename: string;
  size: number;
  status: string;
}

export interface DocumentListResponse {
  documents: Document[];
  count: number;
}

export interface AskResponse {
  answer: string;
  citations?: Citation[];
  sources?: Citation[];
}
