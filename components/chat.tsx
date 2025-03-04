"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChatInput } from "./chat-input"
import { ChatMessages } from "./chat-messages"
import { sendMessage } from "@/lib/api"
import { nanoid } from "nanoid"
import { useSettingsStore } from "@/lib/store"
import { toast } from "sonner"

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  files?: {
    name: string
    type: string
    size: number
    data: ArrayBuffer
    uploadProgress?: number
  }[]
  isStreaming?: boolean
  streamedContent?: string
  needResponse?: boolean
  error?: boolean
}

interface ChatProps {
  initialMessage?: string
  isNewChat?: boolean
}

export function Chat({ initialMessage, isNewChat = false }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatId = useRef<string>("")
  const { apiKey } = useSettingsStore()
  const initialMessageProcessed = useRef(false)
  const userScrolledRef = useRef(false)
  const streamTimeoutRef = useRef<NodeJS.Timeout>()
  const typingSpeedRef = useRef(30) // 打字速度（毫秒/字符）

  // 保存对话记录
  const saveChatHistory = useCallback((messages: Message[]) => {
    if (messages.length < 2) return // 至少需要一问一答

    // 获取对话的第一条用户消息作为标题
    const firstUserMessage = messages.find(m => m.role === 'user')
    if (!firstUserMessage) return

    // 获取最后一条助手消息作为摘要
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')
    if (!lastAssistantMessage) return

    const chatRecord = {
      id: chatId.current,
      title: firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : ''),
      date: new Date().toISOString(),
      summary: lastAssistantMessage.content.slice(0, 50) + (lastAssistantMessage.content.length > 50 ? '...' : ''),
      messages: messages.map(msg => ({
        ...msg,
        isStreaming: undefined,
        streamedContent: undefined
      }))
    }

    // 使用 setTimeout 将状态更新移到下一个事件循环
    setTimeout(() => {
      useSettingsStore.getState().addChatHistory(chatRecord)
    }, 0)
  }, [])

  // 智能滚动处理
  const scrollToBottom = useCallback(() => {
    if (userScrolledRef.current) return

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    })
  }, [])

  // 监听滚动事件
  useEffect(() => {
    const messagesContainer = document.querySelector('.messages-container')
    if (!messagesContainer) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10
      userScrolledRef.current = !isAtBottom
    }

    messagesContainer.addEventListener('scroll', handleScroll)
    return () => messagesContainer.removeEventListener('scroll', handleScroll)
  }, [])

  // 消息变化时滚动
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // 清理打字机效果的定时器
  useEffect(() => {
    return () => {
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current)
      }
    }
  }, [])

  // 打字机效果处理函数
  const updateStreamedContent = useCallback((messageId: string, content: string) => {
    setMessages(prev => {
      const updated = [...prev]
      const targetMessage = updated.find(m => m.id === messageId)
      if (targetMessage) {
        // 如果内容长度差异较大，加快打字速度
        const contentLengthDiff = content.length - (targetMessage.streamedContent?.length || 0)
        if (contentLengthDiff > 50) {
          typingSpeedRef.current = 10
        } else if (contentLengthDiff > 20) {
          typingSpeedRef.current = 20
        } else {
          typingSpeedRef.current = 30
        }

        // 计算下一个要显示的字符
        const currentLength = targetMessage.streamedContent?.length || 0
        const nextChar = content.charAt(currentLength)

        if (nextChar) {
          targetMessage.streamedContent = (targetMessage.streamedContent || '') + nextChar
          targetMessage.content = content

          // 设置下一个字符的定时器
          if (currentLength < content.length - 1) {
            streamTimeoutRef.current = setTimeout(() => {
              updateStreamedContent(messageId, content)
            }, typingSpeedRef.current)
          } else {
            // 流式传输完成
            targetMessage.isStreaming = false
          }
        }
      }
      return updated
    })
  }, [])

  // 处理消息发送
  const handleSendMessage = useCallback(async (content: string, files?: File[]) => {
    if (!apiKey) {
      setMessages(prev => [...prev, {
        id: nanoid(),
        content: '请先在设置中配置 API Key。',
        role: 'assistant',
        timestamp: new Date(),
        error: true
      }])
      return
    }

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
        files
      )

      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? { ...msg, content: streamedContent, isStreaming: false, streamedContent: undefined }
          : msg
      ))
    } catch (error) {
      setMessages(prev => [...prev, {
        id: nanoid(),
        content: error instanceof Error ? error.message : '发生错误',
        role: 'assistant',
        timestamp: new Date(),
        error: true
      }])
    } finally {
      setIsLoading(false)
    }
  }, [apiKey])

  // 监听历史记录加载事件
  useEffect(() => {
    const handleLoadHistory = (event: CustomEvent<{ messages: Message[], id: string, isNewChat?: boolean }>) => {
      const loadedMessages = event.detail.messages.map(msg => ({
        ...msg,
        id: msg.id || nanoid()
      }))
      
      chatId.current = event.detail.id
      setMessages(loadedMessages)

      // 检查是否需要响应最后一条消息
      const lastMessage = loadedMessages[loadedMessages.length - 1]
      if (lastMessage?.needResponse || event.detail.isNewChat) {
        handleSendMessage(lastMessage.content)
      }
    }

    window.addEventListener('load-chat-history' as any, handleLoadHistory as any)
    return () => {
      window.removeEventListener('load-chat-history' as any, handleLoadHistory as any)
    }
  }, [handleSendMessage])

  // 处理初始消息
  useEffect(() => {
    if (initialMessage && isNewChat) {
      const initialMsg = {
        id: nanoid(),
        content: initialMessage,
        role: 'user' as const,
        timestamp: new Date()
      }
      setMessages([initialMsg])
      handleSendMessage(initialMessage)
    }
  }, [initialMessage, isNewChat, handleSendMessage])

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col h-screen md:max-w-3xl min-w-[400px] ml-28">
        <div className="flex-1 overflow-y-auto relative messages-container">
          <ChatMessages messages={messages} />
          <div ref={messagesEndRef} />
        </div>
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  )
} 