import { X, Search, Pencil, Trash2, History, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/lib/store"
import { useState } from "react"
import { isSameDay, isThisWeek } from "@/lib/utils"
import { HistoryItem } from "@/lib/store"
import { nanoid } from "nanoid"

interface ChatHistoryProps {
  onClose: () => void
  onSelectChat: (data: { messages: any[], id: string }) => void
  className?: string
}

export function ChatHistory({ onClose, onSelectChat, className }: ChatHistoryProps) {
  const { chatHistory, removeChatHistory } = useSettingsStore()
  const [searchQuery, setSearchQuery] = useState("")

  const hasHistory = Object.values(chatHistory).some(items => items.length > 0)

  // 处理发送消息
  const handleSendMessage = () => {
    if (!searchQuery.trim()) return
    
    // 创建一个新的对话
    const newChat = {
      messages: [{
        role: 'user',
        content: searchQuery,
        timestamp: new Date(),
        needResponse: true  // 添加标识，表明需要AI响应
      }],
      id: nanoid(),
      isNewChat: true  // 添加标识，表明这是新对话
    }
    
    onSelectChat(newChat)
    setSearchQuery("")
  }

  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

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

  // 分类历史记录的函数
  const categorizeChatHistory = (history: typeof chatHistory): Record<string, HistoryItem[]> => {
    const today = new Date();
    const categorizedHistory: Record<string, HistoryItem[]> = {
      今天: [],
      本周: [],
      更早: [],
    };

    Object.entries(history).forEach(([_, items]) => {
      items.forEach((chat: HistoryItem) => {
        const chatDate = new Date(chat.date);
        if (isSameDay(today, chatDate)) {
          categorizedHistory.今天.push(chat);
        } else if (isThisWeek(chatDate)) {
          categorizedHistory.本周.push(chat);
        } else {
          categorizedHistory.更早.push(chat);
        }
      });
    });

    return categorizedHistory;
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
  const categorizedHistory = categorizeChatHistory(filteredHistory);
  const hasFilteredResults = Object.values(categorizedHistory).some(items => items.length > 0)

  return (
    <div className={cn(
      "fixed left-1/2 top-1/2 -translate-y-[50%] -translate-x-[50%] z-40",
      "w-[600px] h-[640px]",
      "bg-white dark:bg-background/95 backdrop-blur-sm",
      "rounded-2xl shadow-lg border border-gray-200 dark:border-white/20",
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
          className="dark:hover:bg-white/10 dark:hover:text-white size-7 flex items-center justify-center hover:text-black hover:bg-gray-200 rounded"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-8 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="搜索历史会话或输入新对话内容"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-12 h-12 text-base bg-gray-200/50 dark:bg-white/5 border-white/20 focus:border-blue-400/50 transition-colors rounded-xl pr-4"
          />
        </div>
        <Button
          onClick={handleSendMessage}
          className="h-12 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center gap-2"
          disabled={!searchQuery.trim()}
        >
          <Send className="w-5 h-5" />
          <span>发送</span>
        </Button>
      </div>

      {/* 历史记录列表 */}
      <div className="flex-1 overflow-y-auto space-y-8 pr-4 -mr-4">
        {hasHistory ? (
          hasFilteredResults ? (
            Object.entries(categorizedHistory).map(([section, items]) =>
              items.length > 0 && (
                <div key={`section-${section}`}>
                  <h3 className="text-base font-medium mb-4 text-blue-500 dark:text-blue-300/80">{section}</h3>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const uniqueKey = `${section}-${item.id}`
                      const formattedDate = new Date(item.date).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      });
                      return (
                        <div
                          key={uniqueKey}
                          onClick={() => handleChatSelect(item)}
                          className="group flex items-start gap-4 p-4 rounded bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer border border-transparent hover:border-gray-200 shadow-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-4 mb-2">
                              <span className="font-medium text-base dark:text-white/90 truncate">{item.title}</span>
                              <span className="text-sm text-blue-500/70 dark:text-blue-300/60">{formattedDate}</span>
                            </div>
                            <p className="text-[15px] dark:text-white/50 truncate">
                              {item.summary}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-white/10"
                              onClick={(e) => handleDelete(e, item.id)}
                            >
                              <Trash2 className="size-[18px] text-red-500 dark:text-red-300/80" />
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