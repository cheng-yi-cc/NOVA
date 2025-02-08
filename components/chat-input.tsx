"use client" // 声明这是一个客户端组件

// 导入必要的图标和UI组件
import { CuboidIcon as Cube, Paperclip, Play } from "lucide-react"  // 导入图标
import { Button } from "@/components/ui/button"                      // 按钮组件
import { Textarea } from "@/components/ui/textarea"                  // 文本域组件
import { useState } from "react"
import { sendMessage } from "@/lib/api"

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

// 聊天输入组件
export function ChatInput({ onSend, disabled, placeholder = "新星初耀，生活有料；疑问来扰，与你探讨。" }: ChatInputProps) {
  const [input, setInput] = useState("")

  const handleSend = async () => {
    const content = input.trim()
    if (!content || disabled) return

    onSend(content)
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    // 输入区域容器
    <div className="relative w-full max-w-4xl mx-auto">
      {/* 文本输入区域 */}
      <div className="relative">
        <Textarea 
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="min-h-[100px] resize-none pr-24 text-base rounded-xl text-white placeholder:text-white/50" 
        />
        {/* 右侧功能按钮组 */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {/* 模型选择按钮 */}
          <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/10">
            <Cube className="w-5 h-5" />
          </Button>
          {/* 附件按钮 */}
          <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/10">
            <Paperclip className="w-5 h-5" />
          </Button>
          {/* 发送按钮 */}
          <Button 
            size="icon" 
            variant={input.trim() ? "default" : "ghost"}
            className={input.trim() ? "" : "text-white hover:text-white hover:bg-white/10"}
            disabled={!input.trim() || disabled}
            onClick={handleSend}
          >
            <Play className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

