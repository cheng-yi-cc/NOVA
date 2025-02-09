import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface HistoryItem {
  id: string
  title: string
  date: string
  summary: string
  messages: {
    id: string
    content: string
    role: 'user' | 'assistant'
    timestamp: Date
  }[]
}

interface SettingsState {
  apiKey: string
  selectedModel: string
  theme: Theme
  chatHistory: Record<string, HistoryItem[]>
  setApiKey: (key: string) => void
  setSelectedModel: (model: string) => void
  setTheme: (theme: Theme) => void
  addChatHistory: (chat: HistoryItem) => void
  removeChatHistory: (id: string) => void
  clearChatHistory: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist<SettingsState>(
    (set) => ({
      apiKey: '',
      selectedModel: 'Qwen/Qwen2.5-7B-Instruct',
      theme: 'system',
      chatHistory: {
        "今天": [],
        "本周": [],
        "更早": []
      },
      setApiKey: (key: string) => set({ apiKey: key }),
      setSelectedModel: (model: string) => set({ selectedModel: model }),
      setTheme: (theme: Theme) => set({ theme }),
      addChatHistory: (chat: HistoryItem) => set((state) => {
        const today = new Date()
        const chatDate = new Date(chat.date)
        
        // 确定分类
        let category = "更早"
        if (isSameDay(today, chatDate)) {
          category = "今天"
        } else if (isThisWeek(chatDate)) {
          category = "本周"
        }

        // 创建更新后的历史记录对象
        const updatedHistory = { ...state.chatHistory }
        
        // 从所有分类中移除相同ID的记录
        let existingCategory = null
        Object.entries(updatedHistory).forEach(([key, items]) => {
          const existingChat = items.find(item => item.id === chat.id)
          if (existingChat) {
            existingCategory = key
          }
          updatedHistory[key] = items.filter(item => item.id !== chat.id)
        })
        
        // 如果找到了现有记录，使用其原有的分类
        if (existingCategory) {
          category = existingCategory
        }
        
        // 添加到对应分类
        updatedHistory[category] = [chat, ...(updatedHistory[category] || [])]
        
        return { chatHistory: updatedHistory }
      }),
      removeChatHistory: (id: string) => set((state) => {
        const updatedHistory = { ...state.chatHistory }
        Object.keys(updatedHistory).forEach(category => {
          updatedHistory[category] = updatedHistory[category].filter(chat => chat.id !== id)
        })
        return { chatHistory: updatedHistory }
      }),
      clearChatHistory: () => set({ chatHistory: { "今天": [], "本周": [], "更早": [] } })
    }),
    {
      name: 'nova-settings',
    }
  )
)

export const useTheme = () => {
  const theme = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const systemTheme = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    : 'dark'

  return {
    theme: theme === 'system' ? systemTheme : theme,
    setTheme,
    currentTheme: theme
  }
}

// 辅助函数：判断是否是同一天
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

// 辅助函数：判断是否在本周
function isThisWeek(date: Date): boolean {
  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  const weekEnd = new Date(now.setDate(now.getDate() + 6))
  return date >= weekStart && date <= weekEnd
} 