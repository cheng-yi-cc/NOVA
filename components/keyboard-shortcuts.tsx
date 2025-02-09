import { useEffect } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

interface KeyboardShortcutsProps {
  onClearChat?: () => void
  onToggleSettings?: () => void
  onToggleFullscreen?: () => void
  onFocusInput?: () => void
  isFullscreen?: boolean
  children: React.ReactNode
}

export function KeyboardShortcuts({
  onClearChat,
  onToggleSettings,
  onToggleFullscreen,
  onFocusInput,
  isFullscreen,
  children
}: KeyboardShortcutsProps) {
  // Focus input
  useHotkeys('mod+k', (e) => {
    e.preventDefault()
    onFocusInput?.()
  }, [onFocusInput])

  // Clear chat
  useHotkeys('mod+l', (e) => {
    e.preventDefault()
    onClearChat?.()
  }, [onClearChat])

  // Toggle settings
  useHotkeys('mod+,', (e) => {
    e.preventDefault()
    onToggleSettings?.()
  }, [onToggleSettings])

  // Toggle fullscreen
  useHotkeys('mod+shift+f', (e) => {
    e.preventDefault()
    onToggleFullscreen?.()
  }, [onToggleFullscreen])

  // Exit fullscreen with Escape
  useHotkeys('esc', (e) => {
    if (isFullscreen) {
      e.preventDefault()
      onToggleFullscreen?.()
    }
  }, [isFullscreen, onToggleFullscreen])

  // Handle system-wide keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser's find dialog when Cmd+F is pressed
      if (e.key === 'f' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return <>{children}</>
}

// Export keyboard shortcut descriptions for the settings panel
export const keyboardShortcuts = [
  {
    key: '⌘K',
    description: '聚焦输入框'
  },
  {
    key: '⌘L',
    description: '清空聊天'
  },
  {
    key: '⌘,',
    description: '打开设置'
  },
  {
    key: '⌘⇧F',
    description: '切换全屏'
  },
  {
    key: 'ESC',
    description: '退出全屏'
  },
  {
    key: '↑/↓',
    description: '浏览消息历史'
  }
] 