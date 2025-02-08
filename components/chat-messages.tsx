"use client"

import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatMessagesProps {
  messages: Message[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto py-4 px-4">
      <div className="space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-4 max-w-4xl mx-auto",
              message.role === "user" && "justify-end"
            )}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                K
              </div>
            )}
            <div
              className={cn(
                "rounded-2xl px-4 py-3 max-w-[85%]",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/10 backdrop-blur-sm text-white"
              )}
            >
              {message.content}
            </div>
            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                U
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 