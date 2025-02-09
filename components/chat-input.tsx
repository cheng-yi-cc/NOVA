"use client" // 声明这是一个客户端组件

// 导入必要的图标和UI组件
import { CuboidIcon as Cube, Paperclip, Play, X } from "lucide-react"  // 导入图标
import { Button } from "@/components/ui/button"                      // 按钮组件
import { Textarea } from "@/components/ui/textarea"                  // 文本域组件
import { forwardRef, useRef, useState } from "react"
import { sendMessage } from "@/lib/api"
import { useSettingsStore } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { FileData } from "@/lib/types"

interface ChatInputProps {
  onSend: (content: string, files?: File[]) => void
  disabled?: boolean
  placeholder?: string
}

interface ModelInfo {
  accept: string
  description: string
}

// 聊天输入组件
export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ onSend, disabled, placeholder = "新星初耀，生活有料；疑问来扰，与你探讨。" }, ref) => {
    const [input, setInput] = useState("")
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [showModelSelect, setShowModelSelect] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { selectedModel, setSelectedModel } = useSettingsStore()

    const modelInfo: Record<string, ModelInfo> = {
      "Qwen/Qwen2.5-7B-Instruct": {
        accept: ".txt,.pdf,image/*",
        description: "基础模型，支持文本、PDF和图片处理"
      },
      "Qwen/Qwen2.5-14B-Instruct": {
        accept: ".txt,.pdf,image/*,.doc,.docx",
        description: "进阶模型，额外支持Word文档处理"
      },
      "Qwen/Qwen2.5-72B-Instruct": {
        accept: ".txt,.pdf,image/*,.doc,.docx,.ppt,.pptx",
        description: "高级模型，额外支持PPT文件处理"
      },
      "Qwen/Qwen2.5-Coder-32B-Instruct": {
        accept: ".txt,.pdf,image/*,.doc,.docx,.json,.yaml,.py,.js,.ts,.jsx,.tsx",
        description: "编程专用模型，支持多种代码和配置文件"
      }
    }

    const handleSend = async () => {
      const content = input.trim()
      if ((!content && selectedFiles.length === 0) || disabled) return

      onSend(content, selectedFiles)
      setInput("")
      setSelectedFiles([])
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }

    const handleFileSelect = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      
      // 检查文件大小限制
      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
      const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE)
      if (oversizedFiles.length > 0) {
        toast.error(`以下文件超过大小限制 (10MB):\n${oversizedFiles.map(f => f.name).join('\n')}`)
        return
      }

      // 检查文件类型
      const supportedTypes = modelInfo[selectedModel].accept.split(',')
      const unsupportedFiles = files.filter(file => {
        const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`
        return !supportedTypes.some(ext => 
          ext === fileExt || 
          (ext === 'image/*' && file.type.startsWith('image/'))
        )
      })

      if (unsupportedFiles.length > 0) {
        toast.error(`以下文件类型不支持:\n${unsupportedFiles.map(f => f.name).join('\n')}`)
        return
      }

      // 检查文件总数限制
      const MAX_FILES = 5
      if (selectedFiles.length + files.length > MAX_FILES) {
        toast.error(`最多只能上传 ${MAX_FILES} 个文件`)
        return
      }

      setSelectedFiles(prev => [...prev, ...files])

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    const removeFile = (index: number) => {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleModelChange = (model: string) => {
      setSelectedModel(model)
      // 当切换到支持更少文件类型的模型时，过滤掉不支持的文件
      const supportedExtensions = modelInfo[model].accept.split(',')
      setSelectedFiles(prev => prev.filter(file => {
        const fileExt = `.${file.name.split('.').pop()}`
        return supportedExtensions.some(ext => 
          ext === fileExt || 
          (ext === 'image/*' && file.type.startsWith('image/'))
        )
      }))
      setShowModelSelect(false)
    }

    return (
      // 输入区域容器
      <div className="relative w-full max-w-4xl mx-auto">
        {/* 文件预览区域 */}
        {selectedFiles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5"
              >
                <span className="text-sm text-white/80 truncate max-w-[200px]">
                  {file.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:bg-white/10"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* 文本输入区域 */}
        <div className="relative">
          <Textarea 
            ref={ref}
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-white hover:bg-white/10"
              onClick={() => setShowModelSelect(true)}
              title="选择模型"
            >
              <Cube className="w-5 h-5" />
            </Button>
            {/* 附件按钮 */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-white hover:bg-white/10"
              onClick={handleFileSelect}
              title="上传文件"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            {/* 发送按钮 */}
            <Button 
              size="icon" 
              variant={input.trim() || selectedFiles.length > 0 ? "default" : "ghost"}
              className={input.trim() || selectedFiles.length > 0 ? "" : "text-white hover:text-white hover:bg-white/10"}
              disabled={(!input.trim() && selectedFiles.length === 0) || disabled}
              onClick={handleSend}
            >
              <Play className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 隐藏的文件输入框 */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept={modelInfo[selectedModel]?.accept || ".txt,.pdf,image/*"}
          onChange={handleFileChange}
        />

        {/* 模型选择对话框 */}
        <Dialog open={showModelSelect} onOpenChange={setShowModelSelect}>
          <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-white/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-foreground">选择模型</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-foreground">
                    <SelectValue placeholder="选择一个模型" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-white/20">
                    {Object.entries(modelInfo).map(([model, info]) => (
                      <SelectItem 
                        key={model} 
                        value={model} 
                        className="text-foreground hover:bg-white/10"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{model.split('/')[1]}</span>
                          <span className="text-xs text-white/60">{info.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModel && (
                  <p className="text-sm text-white/60 mt-2">
                    支持的文件类型：{modelInfo[selectedModel].description}
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }
)

