import { useState, useEffect, useRef, useCallback } from 'react'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { sendMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Message, FileData } from '@/lib/types'
import { nanoid } from 'nanoid'
import { useSettingsStore, useTheme } from '@/lib/store'
import { Settings, X, Maximize2, Minimize2, Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useHotkeys } from 'react-hotkeys-hook'

interface StandaloneChatProps {
  className?: string
  initialMessage?: string
  placeholder?: string
  onClose?: () => void
  showSettings?: boolean
}

export function StandaloneChat({
  className,
  initialMessage,
  placeholder,
  onClose,
  showSettings = true
}: StandaloneChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { apiKey } = useSettingsStore()
  const { theme, setTheme, currentTheme } = useTheme()

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

  const handleSend = async (content: string, files?: FileData[]) => {
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

    const userMessage: Message = {
      id: nanoid(),
      content,
      role: 'user',
      timestamp: new Date(),
      files
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const assistantMessage: Message = {
        id: nanoid(),
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true
      }

      setMessages(prev => [...prev, assistantMessage])

      let streamedContent = ''

      // Convert FileData to File objects
      const fileObjects = files?.map(fileData => {
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

  // Keyboard shortcuts
  useHotkeys('mod+k', () => {
    inputRef.current?.focus()
  }, [])

  useHotkeys('esc', () => {
    if (isFullscreen) {
      setIsFullscreen(false)
    }
  }, [isFullscreen])

  useHotkeys('mod+l', clearChat, [clearChat])

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg overflow-hidden transition-all duration-300',
        theme === 'dark' ? 'bg-background text-foreground' : 'bg-white text-gray-900',
        isFullscreen && 'fixed inset-0 z-50',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">Nova Chat</h2>
        <div className="flex items-center gap-2">
          {showSettings && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-white/10">
                  <Settings className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background/95 backdrop-blur-xl border-white/20">
                <SheetHeader>
                  <SheetTitle>Settings</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Keyboard Shortcuts</h3>
                      <div className="space-y-2 text-sm text-white/70">
                        <div className="flex justify-between">
                          <span>Focus Input</span>
                          <kbd className="px-2 py-1 bg-white/10 rounded">⌘K</kbd>
                        </div>
                        <div className="flex justify-between">
                          <span>Clear Chat</span>
                          <kbd className="px-2 py-1 bg-white/10 rounded">⌘L</kbd>
                        </div>
                        <div className="flex justify-between">
                          <span>Exit Fullscreen</span>
                          <kbd className="px-2 py-1 bg-white/10 rounded">ESC</kbd>
                        </div>
                      </div>
                    </div>
                    <Separator className="bg-white/10" />
                    <div>
                      <h3 className="text-sm font-medium mb-2">Theme</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={currentTheme === 'dark' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => setTheme('dark')}
                        >
                          <Moon className="w-4 h-4 mr-2" />
                          Dark
                        </Button>
                        <Button
                          variant={currentTheme === 'light' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => setTheme('light')}
                        >
                          <Sun className="w-4 h-4 mr-2" />
                          Light
                        </Button>
                        <Button
                          variant={currentTheme === 'system' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => setTheme('system')}
                        >
                          <Monitor className="w-4 h-4 mr-2" />
                          System
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-white/10"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-white/10"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10">
        <ChatInput
          ref={inputRef}
          onSend={handleSend}
          disabled={isLoading}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
} 