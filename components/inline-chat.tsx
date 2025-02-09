import { useState, useEffect, useRef, useCallback } from 'react'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { sendMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Message, FileData } from '@/lib/types'
import { nanoid } from 'nanoid'
import { useSettingsStore } from '@/lib/store'
import { KeyboardShortcuts } from './keyboard-shortcuts'

interface InlineChatProps {
  className?: string
  initialMessage?: string
  placeholder?: string
  onClose?: () => void
  maxHeight?: string | number
  width?: string | number
  position?: 'left' | 'right'
  theme?: 'light' | 'dark'
  showCloseButton?: boolean
  autoFocus?: boolean
}

export function InlineChat({
  className,
  initialMessage,
  placeholder,
  onClose,
  maxHeight = '500px',
  width = '400px',
  position = 'right',
  theme = 'dark',
  showCloseButton = true,
  autoFocus = true
}: InlineChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { apiKey } = useSettingsStore()

  useEffect(() => {
    if (initialMessage) {
      handleSend(initialMessage)
    }
  }, [initialMessage])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (content: string, files?: File[]) => {
    if (!apiKey) {
      setMessages(prev => [...prev, {
        id: nanoid(),
        content: 'Please configure your API key in settings first.',
        role: 'assistant',
        timestamp: new Date(),
        error: true
      }])
      return
    }

    try {
      // Convert File objects to FileData objects
      const fileDataArray = files ? await Promise.all(
        files.map(async (file): Promise<FileData> => ({
          name: file.name,
          type: file.type,
          size: file.size,
          data: await file.arrayBuffer(),
          uploadProgress: 0
        }))
      ) : undefined

      const userMessage: Message = {
        id: nanoid(),
        content,
        role: 'user',
        timestamp: new Date(),
        files: fileDataArray
      }

      setMessages(prev => [...prev, userMessage])
      setIsLoading(true)

      const assistantMessage: Message = {
        id: nanoid(),
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true
      }

      setMessages(prev => [...prev, assistantMessage])

      let streamedContent = ''

      // Convert FileData back to File objects for the API
      const fileObjects = fileDataArray?.map(fileData => {
        const blob = new Blob([fileData.data], { type: fileData.type })
        return new File([blob], fileData.name, { type: fileData.type })
      })

      await sendMessage(
        content,
        (chunk) => {
          streamedContent = chunk
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, streamedContent }
              : msg
          ))
        },
        fileObjects,
        (progress) => {
          setMessages(prev => prev.map(msg =>
            msg.id === userMessage.id && msg.files
              ? {
                  ...msg,
                  files: msg.files.map(file =>
                    file.name === progress.fileName
                      ? { ...file, uploadProgress: progress.progress }
                      : file
                  )
                }
              : msg
          ))
        }
      )

      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? { ...msg, content: streamedContent, isStreaming: false, streamedContent: undefined }
          : msg
      ))
    } catch (error) {
      setMessages(prev => prev.map(msg =>
        msg.role === 'assistant' && msg.isStreaming
          ? { ...msg, content: error instanceof Error ? error.message : 'An error occurred', error: true, isStreaming: false }
          : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = useCallback(() => {
    setMessages([])
  }, [])

  const focusInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <KeyboardShortcuts
      onClearChat={clearChat}
      onFocusInput={focusInput}
    >
      <div
        className={cn(
          'flex flex-col rounded-lg overflow-hidden',
          theme === 'dark' ? 'bg-background text-foreground' : 'bg-white text-gray-900',
          className
        )}
        style={{
          maxHeight,
          width,
          position: 'relative'
        }}
      >
        <div className="flex-1 overflow-hidden">
          <ChatMessages messages={messages} />
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-white/10">
          <ChatInput
            ref={inputRef}
            onSend={handleSend}
            disabled={isLoading}
            placeholder={placeholder}
          />
        </div>
      </div>
    </KeyboardShortcuts>
  )
} 