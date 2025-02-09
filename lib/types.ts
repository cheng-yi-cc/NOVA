export interface FileData {
  name: string
  type: string
  size: number
  data: ArrayBuffer
  uploadProgress?: number
  url?: string
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  files?: FileData[]
  isStreaming?: boolean
  streamedContent?: string
  error?: boolean
}

export interface UploadProgress {
  fileName: string
  progress: number
} 