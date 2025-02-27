import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

export interface HistoryItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  messages: {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
  }[];
}

interface SettingsState {
  apiKey: string;
  selectedModel: string;
  theme: Theme;
  chatHistory: Record<string, HistoryItem[]>;
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  setTheme: (theme: Theme) => void;
  addChatHistory: (chat: HistoryItem) => void;
  removeChatHistory: (id: string) => void;
  clearChatHistory: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist<SettingsState>(
    (set) => ({
      apiKey: "",
      selectedModel: "Qwen/Qwen2.5-7B-Instruct",
      theme: "system",
      chatHistory: {
        今天: [],
        本周: [],
        更早: [],
      },
      setApiKey: (key: string) => set({ apiKey: key }),
      setSelectedModel: (model: string) => set({ selectedModel: model }),
      setTheme: (theme: Theme) => set({ theme }),
      addChatHistory: (chat: HistoryItem) =>
        set((state) => {
          const updatedHistory = { ...state.chatHistory };

          // 从所有分类中移除相同ID的记录
          let existingCategory = null;
          Object.entries(updatedHistory).forEach(([key, items]) => {
            const existingChat = items.find((item) => item.id === chat.id);
            if (existingChat) {
              existingCategory = key;
            }
            updatedHistory[key] = items.filter((item) => item.id !== chat.id);
          });

          // 如果找到了现有记录，使用其原有的分类
          if (existingCategory) {
            // 保持原有分类
          }

          // 添加到对应分类
          updatedHistory[existingCategory || "更早"] = [
            chat,
            ...(updatedHistory[existingCategory || "更早"] || []),
          ];

          return { chatHistory: updatedHistory };
        }),
      removeChatHistory: (id: string) =>
        set((state) => {
          const updatedHistory = { ...state.chatHistory };
          Object.keys(updatedHistory).forEach((category) => {
            updatedHistory[category] = updatedHistory[category].filter(
              (chat) => chat.id !== id
            );
          });
          return { chatHistory: updatedHistory };
        }),
      clearChatHistory: () =>
        set({ chatHistory: { 今天: [], 本周: [], 更早: [] } }),
    }),
    {
      name: "nova-settings",
    }
  )
);

export const useTheme = () => {
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const systemTheme =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : "dark";

  return {
    theme: theme === "system" ? systemTheme : theme,
    setTheme,
    currentTheme: theme,
  };
};
