"use client"

import { Plus, Layout, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettingsStore } from "@/lib/store"
import { ChatHistory } from "@/components/chat-history"

interface SidebarProps {
  onChatToggle: (show: boolean, newChat?: boolean) => void
}

export function Sidebar({ onChatToggle }: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const { apiKey, selectedModel, setApiKey, setSelectedModel } = useSettingsStore()

  const models = [
    "Qwen/Qwen2.5-7B-Instruct",
    "Qwen/Qwen2.5-14B-Instruct",
    "Qwen/Qwen2.5-72B-Instruct",
    "Qwen/Qwen2.5-Coder-32B-Instruct",
    "Pro/Qwen/Qwen2-VL-7B-Instruct",
  ]

  const handleSaveSettings = () => {
    setApiKey(apiKey)
    setSelectedModel(selectedModel)
    setShowSettings(false)
  }

  const handleHomeClick = useCallback(() => {
    console.log('Clicking home button')
    if (showHistory) {
      setShowHistory(false)
    } else {
      onChatToggle(false)
    }
  }, [onChatToggle, showHistory])

  const handleNewChat = useCallback(() => {
    console.log('Starting new chat')
    onChatToggle(true, true)
  }, [onChatToggle])

  const handleHistoryToggle = useCallback(() => {
    setShowHistory(prev => !prev)
  }, [])

  return (
    <>
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
        <nav className="flex flex-col items-center gap-6 bg-white/50 backdrop-blur-lg rounded-2xl py-8 px-3 shadow-lg">
          <div className="relative w-full flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="w-16 h-16 rounded-xl hover:bg-white/10 transition-colors relative group"
              onClick={handleHomeClick}
              title="返回主页"
            >
              <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -inset-1 bg-[#61dafb]/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg viewBox="0 0 24 24" className="w-11 h-11 relative z-10 animate-pulse" style={{ color: '#61dafb' }}>
                <path
                  fill="currentColor"
                  d="M12 10.11c1.03 0 1.87.84 1.87 1.89 0 1-.84 1.85-1.87 1.85-1.03 0-1.87-.85-1.87-1.85 0-1.05.84-1.89 1.87-1.89M7.37 20c.63.38 2.01-.2 3.6-1.7-.52-.59-1.03-1.23-1.51-1.9a22.7 22.7 0 0 1-2.4-.36c-.51 2.14-.32 3.61.31 3.96m.71-5.74l-.29-.51c-.11.29-.22.58-.29.86.27.06.57.11.88.16l-.3-.51m6.54-.76l.81-1.5-.81-1.5c-.3-.53-.62-1-.91-1.47C13.17 9 12.6 9 12 9c-.6 0-1.17 0-1.71.03-.29.47-.61.94-.91 1.47L8.57 12l.81 1.5c.3.53.62 1 .91 1.47.54.03 1.11.03 1.71.03.6 0 1.17 0 1.71-.03.29-.47.61-.94.91-1.47M12 6.78c-.19.22-.39.45-.59.72h1.18c-.2-.27-.4-.5-.59-.72m0 10.44c.19-.22.39-.45.59-.72h-1.18c.2.27.4.5.59.72M16.62 4c-.62-.38-2 .2-3.59 1.7.52.59 1.03 1.23 1.51 1.9.82.08 1.63.2 2.4.36.51-2.14.32-3.61-.32-3.96m-.7 5.74l.29.51c.11-.29.22-.58.29-.86-.27-.06-.57-.11-.88-.16l.3.51m1.45-7.05c1.47.84 1.63 3.05 1.01 5.63 2.54.75 4.37 1.99 4.37 3.68 0 1.69-1.83 2.93-4.37 3.68.62 2.58.46 4.79-1.01 5.63-1.46.84-3.45-.12-5.37-1.95-1.92 1.83-3.91 2.79-5.38 1.95-1.46-.84-1.62-3.05-1-5.63-2.54-.75-4.37-1.99-4.37-3.68 0-1.69 1.83-2.93 4.37-3.68-.62-2.58-.46-4.79 1-5.63 1.47-.84 3.46.12 5.38 1.95 1.92-1.83 3.91-2.79 5.37-1.95M17.08 12c.34.75.64 1.5.89 2.26 2.1-.63 3.28-1.53 3.28-2.26 0-.73-1.18-1.63-3.28-2.26-.25.76-.55 1.51-.89 2.26M6.92 12c-.34-.75-.64-1.5-.89-2.26-2.1.63-3.28 1.53-3.28 2.26 0 .73 1.18 1.63 3.28 2.26.25-.76.55-1.51.89-2.26m9 2.26l-.3.51c.31-.05.61-.1.88-.16-.07-.28-.18-.57-.29-.86l-.29.51m-2.89 4.04c1.59 1.5 2.97 2.08 3.59 1.7.64-.35.83-1.82.32-3.96-.77.16-1.58.28-2.4.36-.48.67-.99 1.31-1.51 1.9M8.08 9.74l.3-.51c-.31.05-.61.1-.88.16.07.28.18.57.29.86l.29-.51m2.89-4.04C9.38 4.2 8 3.62 7.37 4c-.63.35-.82 1.82-.31 3.96a22.7 22.7 0 0 1 2.4-.36c.48-.67.99-1.31 1.51-1.9z"
                />
              </svg>
            </Button>
          </div>
          <div className="space-y-8 w-full flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              className="w-11 h-11 rounded-xl hover:border-cyan-400 hover:bg-white/50 transition-colors group"
              onClick={handleNewChat}
              title="新建聊天"
            >
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-11 h-11 rounded-xl hover:border-cyan-400 hover:bg-white/50 transition-colors group"
              onClick={handleHistoryToggle}
              title="历史记录"
            >
              <Layout className="w-6 h-6 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-11 h-11 rounded-xl hover:border-cyan-400 hover:bg-white/50 transition-colors group"
              onClick={() => setShowSettings(true)}
              title="设置"
            >
              <User className="w-6 h-6 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
            </Button>
          </div>
        </nav>
      </div>

      {/* 历史记录面板 */}
      {showHistory && (
        <ChatHistory
          onClose={() => setShowHistory(false)}
          onSelectChat={(data) => {
            setShowHistory(false)
            onChatToggle(true)
            // 等待下一个事件循环，确保聊天界面已经挂载
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('load-chat-history', {
                detail: {
                  messages: data.messages,
                  id: data.id
                }
              }))
            }, 0)
          }}
          className="animate-in slide-in-from-left"
        />
      )}

      {/* 设置对话框 */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">SiliconFlow 设置</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              配置您的 API Key 和模型选项
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-6 py-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-2">
              <Label htmlFor="apiKey" className="text-foreground">API Key</Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder="请输入您的 SiliconFlow API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-white/5 border-white/10 text-foreground"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model" className="text-foreground">选择模型</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model" name="model" className="bg-white/5 border-white/10 text-foreground">
                  <SelectValue placeholder="选择一个模型" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-white/20">
                  {models.map((model) => (
                    <SelectItem key={model} value={model} className="text-foreground hover:bg-white/10">
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="mt-2 bg-primary hover:bg-primary/90 transition-colors"
              onClick={handleSaveSettings}
            >
              保存设置
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

