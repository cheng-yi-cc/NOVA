import { X, Search, Pencil, Trash2, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/lib/store"
import { useState } from "react"

interface ChatHistoryProps {
  onClose: () => void
  onSelectChat: (data: { messages: any[], id: string }) => void
  className?: string
}

export function ChatHistory({ onClose, onSelectChat, className }: ChatHistoryProps) {
  const { chatHistory, removeChatHistory } = useSettingsStore()
  const [searchQuery, setSearchQuery] = useState("")
  
  const hasHistory = Object.values(chatHistory).some(items => items.length > 0)
  
  // 搜索过滤函数
  const filterHistory = (history: typeof chatHistory) => {
    if (!searchQuery) return history

    const filtered: typeof chatHistory = {}
    Object.entries(history).forEach(([category, items]) => {
      filtered[category] = items.filter(
        item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.summary.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
    return filtered
  }

  const handleChatSelect = (item: any) => {
    onSelectChat({
      messages: item.messages,
      id: item.id
    })
    onClose()
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // 阻止事件冒泡
    removeChatHistory(id)
  }

  const filteredHistory = filterHistory(chatHistory)
  const hasFilteredResults = Object.values(filteredHistory).some(items => items.length > 0)

  return (
    <div className={cn(
      "fixed left-[280px] top-1/2 -translate-y-1/2 z-40",
      "w-[600px] h-[640px]",
      "bg-background/95 backdrop-blur-sm",
      "rounded-2xl shadow-lg border border-white/20",
      "flex flex-col p-8",
      className
    )}>
      {/* 顶部栏 */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">历史会话</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-white/10 h-9 w-9"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="搜索历史会话"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-base bg-white/5 border-white/20 focus:border-blue-400/50 transition-colors rounded-xl"
        />
      </div>

      {/* 历史记录列表 */}
      <div className="flex-1 overflow-y-auto space-y-8 pr-4 -mr-4">
        {hasHistory ? (
          hasFilteredResults ? (
            Object.entries(filteredHistory).map(([section, items]) => 
              items.length > 0 && (
                <div key={`section-${section}`}>
                  <h3 className="text-base font-medium mb-4 text-blue-300/80">{section}</h3>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const uniqueKey = `${section}-${item.id}`
                      return (
                        <div
                          key={uniqueKey}
                          onClick={() => handleChatSelect(item)}
                          className="group flex items-start gap-4 p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-4 mb-2">
                              <span className="font-medium text-base text-white/90 truncate">{item.title}</span>
                              <span className="text-sm text-blue-300/60">{item.date}</span>
                            </div>
                            <p className="text-[15px] text-white/50 truncate">
                              {item.summary}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 hover:bg-white/10"
                              onClick={(e) => handleDelete(e, item.id)}
                            >
                              <Trash2 className="w-[18px] h-[18px] text-red-300/80" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <History className="w-16 h-16 text-white/10 mb-4" />
              <p className="text-lg text-white/40">未找到相关记录</p>
              <p className="text-sm text-white/30 mt-2">请尝试其他搜索关键词</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <History className="w-16 h-16 text-white/10 mb-4" />
            <p className="text-lg text-white/40">暂无历史会话记录</p>
            <p className="text-sm text-white/30 mt-2">开始对话后将自动保存记录</p>
          </div>
        )}
      </div>
    </div>
  )
} 