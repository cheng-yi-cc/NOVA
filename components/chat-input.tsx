"use client" // 声明这是一个客户端组件

// 导入必要的图标和UI组件
import { CuboidIcon as Cube, Paperclip, Play, X, File, RemoveFormattingIcon as Remove } from "lucide-react"  // 导入图标
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
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (content: string, files?: File[], cb?: () => void) => void
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
    const { selectedModel, setSelectedModel } = useSettingsStore()
    const [isComposing, setIsComposing] = useState<boolean>(false)
    const [replying, setReplying] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    const modelInfo: Record<string, ModelInfo> = {
      "Qwen/Qwen2.5-7B-Instruct": {
        accept: ".txt",
        description: "大语言模型 7B"
      },
      "Qwen/Qwen2.5-14B-Instruct": {
        accept: ".txt",
        description: "大语言模型 14B"
      },
      "Qwen/Qwen2.5-72B-Instruct": {
        accept: ".txt",
        description: "大语言模型 72B"
      },
      "Qwen/Qwen2.5-Coder-32B-Instruct": {
        accept: ".txt",
        description: "代码模型"
      },
      "Pro/Qwen/Qwen2-VL-7B-Instruct": {
        accept: ".txt,image/*",
        description: "视觉模型，支持处理图片"
      },
    }

    /**
     * 点击文件按钮，触发文件选择
     */
    const handleFileBtnClick = () => {
      fileInputRef.current?.click();
    };

    /**
     * 禁用发送按钮
     */
    const senderButtonDisabled =
      (input.length === 0 && selectedFiles.length === 0) || replying;

    /**
     * 禁用文件选择按钮
     */
    const fileButtonDisabled = selectedFiles.length >= 100 || replying;

    /**
     * 移除文件及其预览
     */
    const handleRemoveFile = (index: number) => {
      setSelectedFiles((prevPreviews) =>
        prevPreviews.filter((_, i) => i !== index)
      );
    };

    /**
     * 控制文本框高度变化
     */
    const handleTextAreaHeightChange = (
      e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      setInput(e.target.value)
      // 触发高度调整
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    /**
     * 按下回车键发送消息
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !isComposing) {
        e.preventDefault();
        if (!senderButtonDisabled) {
          handleSend()
          selectedFiles.length = 0;
        }
      }
    };

    /**
     * 清空输入的文字和文件预览
     */
    const flushSender = () => {
      setSelectedFiles([]);
      setInput("");
    };

    const handleSend = async () => {
      const content = input.trim()
      if ((!content && selectedFiles.length === 0) || disabled) return

      setReplying(true)
      onSend(content, selectedFiles, () => {
        setReplying(false)
        flushSender()
      })
      setInput("")
      setSelectedFiles([])
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])

      // 检查文件大小限制
      const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
      const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE)
      if (oversizedFiles.length > 0) {
        toast.error(`以下文件超过大小限制 (2MB):\n${oversizedFiles.map(f => f.name).join('\n')}`)
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
          className="rounded-xl text-black hover:text-black hover:bg-gray-200"
          onClick={() => setShowModelSelect(true)}
          title="选择模型"
        >
          <Cube className="size-5" />
        </Button>
        {/* 附件按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl text-black hover:text-black hover:bg-gray-200"
          // onClick={handleFileSelect}
          title="上传文件"
        >
          <Paperclip className="w-5 h-5" />
        </Button>
        {/* 发送按钮 */}
        <Button
          size="icon"
          variant={input.trim() || selectedFiles.length > 0 ? "default" : "ghost"}
          className={input.trim() || selectedFiles.length > 0 ? "" : "text-cyan-400 hover:text-white hover:bg-white/10"}
          disabled={(!input.trim() && selectedFiles.length === 0) || disabled}
          onClick={handleSend}
        >
          <Play className="w-5 h-5" />
        </Button>
      </div>
    </div>

    return (
      <>
        <div className="flex flex-col items-center justify-center w-full px-3">
          <div
            className="w-full bg-white/70 relative min-w-24 max-w-3xl rounded-xl shadow-sm after:rounded-xl after:pointer-events-none after:absolute after:inset-0  after:rounded-lg after:border after:transition-colors after:duration-300 after:ease-in-out focus-within:after:border-2 focus-within:after:border-cyan-400"
          >
            <div
              className={`flex w-full gap-3 overflow-x-auto p-3 ${selectedFiles.length > 0 ? "" : "hidden"}`}
            >
              {selectedFiles.length > 0 && (
                <div className="flex gap-2">
                  {selectedFiles.map((selectedFile, index) => (
                    <div
                      key={index}
                      className="group relative border-none"
                      data-testid={`file-preview-${index}`}
                    >
                      {selectedFile.type === "image" ? (
                        <div className="size-[68px] border-0 ">
                          <img
                            src={selectedFile.preview}
                            alt={`file-preview-${index}`}
                            className="inline-flex size-full items-center rounded-md text-center font-normal group-hover:opacity-65"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex h-[68px] w-[236px] flex-nowrap items-start gap-2 rounded-md bg-gray-100 p-3 dark:bg-[#2f2f2f] opacity-100"
                        >
                          <div className="mt-1">
                            <img
                              width={32}
                              height={32}
                              // src={FileSVG}
                              alt={`file-preview-${index}`}
                            />
                          </div>

                          <div
                            className="flex flex-col items-stretch opacity-25"
                          >
                            <span className="max-w-[160px] truncate">
                              {selectedFile.name}
                            </span>
                            <span className="">{selectedFile.size}</span>
                          </div>
                        </div>
                      )}
                      {/* <div className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2">
                        <img
                          // src={UploadingSVG}
                          alt="uploading"
                          className="animate-spin"
                          // className={`${selectedFile.uploaded ? "hidden" : "animate-spin"}`}
                          data-testid="uploading-svg"
                        />
                      </div> */}

                      {/* <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2 cursor-pointer border-none bg-transparent p-1 text-[14px] leading-none opacity-0 group-hover:opacity-65"
                        aria-label="remove file"
                      >
                        <img
                          width={13}
                          height={13}
                          src={RemoveSVG}
                          alt="remove file"
                        />
                      </button> */}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div
              className={`flex flex-col w-full items-end ${selectedFiles.length > 0 ? "border-t border-t-gray-100 dark:border-t-gray-500" : ""} p-3`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={fileButtonDisabled}
                className="hidden"
                data-testid="file-input"
              />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextAreaHeightChange}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                className="w-full bg-white/0 max-h-[176px] flex-auto resize-none self-center overflow-y-auto rounded-none border-none bg-white p-0 outline-none dark:bg-dark-primary dark:text-[#ececec]"
                placeholder={`${replying ? "回复中..." : placeholder}`}
                rows={2}
                autoFocus
              ></textarea>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-black hover:text-black hover:bg-gray-200"
                  onClick={() => setShowModelSelect(true)}
                  title="选择模型"
                >
                  <Cube size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-black hover:text-black hover:bg-gray-200"
                  onClick={handleFileBtnClick}
                  disabled={fileButtonDisabled}
                  title="上传文件"
                >
                  <Paperclip size={20} />
                </Button>
                <Button
                  size="icon"
                  className={cn("rounded-full", senderButtonDisabled ? "bg-gray-200" : "bg-cyan-200/50")}
                  disabled={senderButtonDisabled}
                  onClick={() => handleSend()}
                >
                  <Play size={20} className="text-cyan-400" />
                </Button>
              </div>
            </div>
          </div>
          <div className="w-full p-2 text-center text-xs text-gray-500 dark:text-gray-400">
            <div className="h-4">
              <p>AI 也可能会犯错。请核查重要信息。</p>
            </div>
          </div>
        </div >

        {/* 模型选择对话框 */}
        <Dialog open={showModelSelect} onOpenChange={setShowModelSelect}>
          <DialogContent className="sm:max-w-[425px] bg-white/95 dark:bg-background/95 backdrop-blur-xl border-gray-300 dark:border-white/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-black dark:text-foreground">选择模型</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger className="bg-white/5 dark:bg-white/10 border-gray-300 dark:border-white/10 text-black dark:text-foreground">
                    {selectedModel && <span className="font-medium">{selectedModel.split('/').at(-1)}</span>}
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-background/95 backdrop-blur-xl border-gray-300 dark:border-white/20">
                    {Object.entries(modelInfo).map(([model, info]) => (
                      <SelectItem
                        key={model}
                        value={model}
                        className="text-black dark:text-foreground hover:bg-gray-200 dark:hover:bg-white/10"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{model.split('/').at(-1)}</span>
                          <span className="text-xs text-gray-600 dark:text-white/60">{info.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModel && (
                  <p className="text-sm text-gray-600 dark:text-white/60 mt-2">
                    支持的文件类型：{modelInfo[selectedModel].accept}
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }
)

