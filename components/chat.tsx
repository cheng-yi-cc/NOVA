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
}

interface ChatProps {
  initialMessage?: string
  isNewChat?: boolean
}

export function Chat({ initialMessage, isNewChat = false }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (isNewChat) {
      return [{
        id: nanoid(),
        content: "AI就像新产生的群星，点缀着人类的进步，请问有什么可以帮忙的吗？",
        role: 'assistant',
        timestamp: new Date()
      }]
    }
    return []
  })

  const [isLoading, setIsLoading] = useState(false)
  const initialMessageProcessed = useRef(false)
  const chatId = useRef(nanoid())
  const { addChatHistory } = useSettingsStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
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
      addChatHistory(chatRecord)
    }, 0)
  }, [addChatHistory])

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

  const handleSendMessage = useCallback(async (content: string, files?: File[], cb?: () => void) => {
    try {
      const { apiKey } = useSettingsStore.getState()
      if (!apiKey) {
        toast.error("请先在设置中配置 API Key")
        return
      }

      setIsLoading(true)
      userScrolledRef.current = false

      // 添加用户消息
      const userMessageId = nanoid()
      const userMessage: Message = {
        id: userMessageId,
        content: content,
        role: 'user',
        timestamp: new Date(),
        files: files ? await Promise.all(files.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          data: await file.arrayBuffer(),
          uploadProgress: 0
        }))) : undefined
      }

      setMessages(prev => [...prev, userMessage])

      // 创建一个临时的AI消息
      const assistantMessageId = nanoid()
      const assistantMessage: Message = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true,
        streamedContent: ''
      }

      setMessages(prev => [...prev, assistantMessage])

      // 流式接收响应
      const response = await sendMessage(
        content,
        (chunk) => {
          // 使用打字机效果更新内容
          updateStreamedContent(assistantMessageId, chunk)
        },
        files,
        ({ fileName, progress }) => {
          // 更新文件上传进度
          setMessages(prev => {
            const updated = [...prev]
            const userMsg = updated.find(m => m.id === userMessageId)
            if (userMsg && userMsg.files) {
              const file = userMsg.files.find(f => f.name === fileName)
              if (file) {
                file.uploadProgress = progress
              }
            }
            return updated
          })
        }
      )

      // 保存最终消息
      setMessages(prev => {
        const updated = prev.map(msg => {
          if (msg.id === assistantMessageId) {
            return {
              ...msg,
              content: response,
              isStreaming: false,
              streamedContent: response
            }
          }
          if (msg.id === userMessageId && msg.files) {
            return {
              ...msg,
              files: msg.files.map(file => ({
                ...file,
                uploadProgress: 100
              }))
            }
          }
          return msg
        })
        saveChatHistory(updated)
        return updated
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error(error instanceof Error ? error.message : "发送消息失败，请检查网络连接和API配置")

      // 移除失败的助手消息
      setMessages(prev => prev.filter(msg => msg.role !== 'assistant' || !msg.isStreaming))
    } finally {
      setIsLoading(false)
      userScrolledRef.current = false
      cb?.()
    }
  }, [updateStreamedContent, saveChatHistory])

  // 处理初始消息
  useEffect(() => {
    if (initialMessage && !initialMessageProcessed.current) {
      initialMessageProcessed.current = true
      handleSendMessage(initialMessage)
    }
  }, [initialMessage, handleSendMessage])

  // 处理加载历史对话
  const handleLoadHistory = useCallback((event: CustomEvent<{ messages: Message[], id: string }>) => {
    const { messages: historyMessages, id } = event.detail

    // 确保消息的ID是唯一的
    const updatedMessages = historyMessages.map(msg => ({
      ...msg,
      id: msg.id || nanoid() // 如果消息没有ID，生成新的ID
    }))

    // 使用原有的对话ID
    chatId.current = id
    setMessages(updatedMessages)
  }, [])

  // 监听加载历史对话事件
  useEffect(() => {
    window.addEventListener('load-chat-history', handleLoadHistory as EventListener)
    return () => {
      window.removeEventListener('load-chat-history', handleLoadHistory as EventListener)
    }
  }, [handleLoadHistory])

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