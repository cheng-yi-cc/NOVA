"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChatInput } from "./chat-input"
import { ChatMessages } from "./chat-messages"
import { sendMessage } from "@/lib/api"
import { nanoid } from "nanoid"
import { useSettingsStore } from "@/lib/store"

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
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
  const lastMessageRef = useRef<string>("")

  // 保存对话记录
  const saveChatHistory = (messages: Message[]) => {
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
      messages: messages
    }

    addChatHistory(chatRecord)
  }

  // 智能滚动处理
  const scrollToBottom = () => {
    if (userScrolledRef.current) return
    
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    })
  }

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
  }, [messages])

  const handleSendMessage = async (content: string) => {
    try {
      setIsLoading(true)
      userScrolledRef.current = false
      
      // 添加用户消息
      const userMessage: Message = {
        id: nanoid(),
        content,
        role: 'user',
        timestamp: new Date()
      }
      
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)

      // 创建一个临时的AI消息
      const assistantMessageId = nanoid()
      const assistantMessage: Message = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date()
      }
      
      setMessages([...updatedMessages, assistantMessage])

      // 流式接收响应
      const response = await sendMessage(content, (chunk) => {
        setMessages(prev => {
          const updated = [...prev]
          const lastMessage = updated.find(m => m.id === assistantMessageId)
          if (lastMessage) {
            lastMessage.content = chunk
          }
          return updated
        })
      })
      
      // 保存最终消息
      const finalMessages = updatedMessages.concat({
        id: assistantMessageId,
        content: response,
        role: 'assistant',
        timestamp: new Date()
      })
      
      setMessages(finalMessages)
      saveChatHistory(finalMessages)
    } catch (error) {
      console.error('Failed to send message:', error)
      // 可以添加错误提示
    } finally {
      setIsLoading(false)
      userScrolledRef.current = false
    }
  }

  // 处理初始消息
  useEffect(() => {
    if (initialMessage && !initialMessageProcessed.current) {
      initialMessageProcessed.current = true
      handleSendMessage(initialMessage)
    }
  }, [initialMessage])

  // 处理加载历史对话
  const handleLoadHistory = useCallback((event: CustomEvent<{messages: Message[], id: string}>) => {
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
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden relative messages-container">
        <ChatMessages messages={messages} />
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-white/10">
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  )
} 