"use client"

// 导入必要的组件
import { NovaLogo } from "@/components/nova-logo"        // NOVA logo组件
import { Sidebar } from "@/components/sidebar"           // 侧边栏组件
import { StarryBackground } from "@/components/starry-background"  // 星空背景组件
import { Chat } from "@/components/chat"                 // 聊天组件
import { useState, useCallback } from "react"
import { ChatInput } from "@/components/chat-input"

// 主页面组件
export default function Home() {
  const [showChat, setShowChat] = useState(false)
  const [initialMessage, setInitialMessage] = useState("")
  const [isNewChat, setIsNewChat] = useState(false)

  const handleChatToggle = useCallback((show: boolean, newChat: boolean = false) => {
    console.log('Chat toggle:', show, 'New chat:', newChat)
    if (newChat) {
      // 如果是新聊天，清除之前的初始消息
      setInitialMessage("")
    }
    setShowChat(show)
    setIsNewChat(newChat)
  }, [])

  const handleSendMessage = useCallback((content: string) => {
    console.log('Sending message, switching to chat:', content)
    setInitialMessage(content)
    setIsNewChat(false)
    setShowChat(true)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 星空背景 */}
      <div className="absolute inset-0">
        <StarryBackground />
      </div>
      
      {/* 主布局容器 */}
      <div className="relative flex min-h-screen">
        {/* 左侧边栏 - 始终显示 */}
        <Sidebar onChatToggle={handleChatToggle} />
        
        {/* 主内容区域 */}
        <main className="flex-1 flex items-center justify-center w-full">
          {showChat ? (
            <div className="w-full h-full">
              <Chat 
                key={isNewChat ? 'new-chat' : initialMessage} 
                initialMessage={initialMessage} 
                isNewChat={isNewChat} 
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full max-w-[1200px] mx-auto px-8">
              <div className="mb-16 transform scale-125">
                <NovaLogo />
              </div>
              <div className="w-full max-w-4xl">
                <ChatInput 
                  onSend={handleSendMessage}
                  placeholder="新星初耀，生活有料；疑问来扰，与你探讨。"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

