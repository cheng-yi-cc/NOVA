import { useState, useRef, useEffect } from 'react'
import { FileData } from '@/lib/types'
import { cn } from '@/lib/utils'
import { 
  FileText, 
  Image as ImageIcon, 
  File,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Download,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useHotkeys } from 'react-hotkeys-hook'

interface FilePreviewProps {
  file: FileData
  onDownload?: (file: FileData) => void
  className?: string
  showFullscreen?: boolean
  onClose?: () => void
}

interface FileTypeInfo {
  icon: typeof File
  color: string
  accept: string[]
  description: string
}

const FILE_TYPES: Record<string, FileTypeInfo> = {
  image: {
    icon: ImageIcon,
    color: 'text-blue-400',
    accept: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
    description: '图片文件'
  },
  document: {
    icon: FileText,
    color: 'text-orange-400',
    accept: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
    description: '文档文件'
  },
  spreadsheet: {
    icon: FileSpreadsheet,
    color: 'text-green-400',
    accept: ['xls', 'xlsx', 'csv', 'ods'],
    description: '电子表格'
  },
  code: {
    icon: FileCode,
    color: 'text-purple-400',
    accept: ['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'py', 'java', 'cpp', 'c', 'rb', 'php', 'go'],
    description: '代码文件'
  },
  archive: {
    icon: FileArchive,
    color: 'text-yellow-400',
    accept: ['zip', 'rar', '7z', 'tar', 'gz'],
    description: '压缩文件'
  }
}

export function FilePreview({ file, onDownload, className, showFullscreen = false, onClose }: FilePreviewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(showFullscreen)
  const [copiedCode, setCopiedCode] = useState(false)
  const [imageRotation, setImageRotation] = useState(0)
  const [imageZoom, setImageZoom] = useState(1)
  const previewRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // 键盘快捷键
  useHotkeys('esc', () => {
    if (isPreviewOpen) {
      setIsPreviewOpen(false)
      onClose?.()
    }
  }, [isPreviewOpen, onClose])

  useHotkeys('ctrl+c', (e) => {
    if (isPreviewOpen && previewContent) {
      e.preventDefault()
      copyToClipboard()
    }
  }, [isPreviewOpen, previewContent])

  useHotkeys(['=', '+'], () => {
    if (isPreviewOpen && file.type.startsWith('image/')) {
      setImageZoom(prev => Math.min(prev + 0.1, 3))
    }
  }, [isPreviewOpen, file.type])

  useHotkeys('-', () => {
    if (isPreviewOpen && file.type.startsWith('image/')) {
      setImageZoom(prev => Math.max(prev - 0.1, 0.1))
    }
  }, [isPreviewOpen, file.type])

  useHotkeys('r', () => {
    if (isPreviewOpen && file.type.startsWith('image/')) {
      setImageRotation(prev => (prev + 90) % 360)
    }
  }, [isPreviewOpen, file.type])

  useEffect(() => {
    if (file.type.startsWith('image/') || file.type.includes('pdf')) {
      const url = file.url || URL.createObjectURL(new Blob([file.data], { type: file.type }))
      setPreviewUrl(url)
      return () => {
        if (!file.url) URL.revokeObjectURL(url)
      }
    } else if (isTextFile(file)) {
      loadTextContent()
    }
  }, [file])

  const getFileTypeInfo = (file: FileData): FileTypeInfo => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    
    for (const [type, info] of Object.entries(FILE_TYPES)) {
      if (info.accept.includes(ext) || 
          (type === 'image' && file.type.startsWith('image/')) ||
          (type === 'document' && file.type.includes('pdf'))) {
        return info
      }
    }
    
    return {
      icon: File,
      color: 'text-gray-400',
      accept: [],
      description: '未知文件类型'
    }
  }

  const isTextFile = (file: FileData) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    return FILE_TYPES.code.accept.includes(ext) ||
           file.type.includes('text') ||
           file.name.endsWith('.md') ||
           file.name.endsWith('.csv')
  }

  const loadTextContent = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const decoder = new TextDecoder()
      const content = decoder.decode(file.data)
      setPreviewContent(content)
    } catch (err) {
      setError('无法加载文件内容')
      console.error('Error loading text content:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getFileLanguage = () => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'jsx',
      tsx: 'tsx',
      json: 'json',
      html: 'html',
      css: 'css',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      rb: 'ruby',
      php: 'php',
      go: 'go',
      md: 'markdown',
      csv: 'csv'
    }
    return ext ? languageMap[ext] || 'text' : 'text'
  }

  const copyToClipboard = async () => {
    if (!previewContent) return
    try {
      await navigator.clipboard.writeText(previewContent)
      setCopiedCode(true)
      toast.success('内容已复制到剪贴板')
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (err) {
      toast.error('复制失败')
      console.error('Copy error:', err)
    }
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDownloadClick = () => {
    try {
      onDownload?.(file)
      toast.success('文件下载成功')
    } catch (err) {
      toast.error('文件下载失败')
      console.error('Download error:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsPreviewOpen(true)
    }
  }

  const fileTypeInfo = getFileTypeInfo(file)
  const FileIcon = fileTypeInfo.icon

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-red-400">
          <span>{error}</span>
        </div>
      )
    }

    if (previewUrl && file.type.startsWith('image/')) {
      return (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogTrigger asChild>
            <div 
              className="relative group cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              aria-label={`预览图片: ${file.name}`}
            >
              <img 
                src={previewUrl} 
                alt={file.name}
                className="max-w-[300px] max-h-[200px] rounded-lg object-cover"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false)
                  setError('图片加载失败')
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent 
            className="max-w-[90vw] max-h-[90vh] bg-background/95 backdrop-blur-xl border-white/20"
            ref={previewRef}
          >
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="text-xl font-semibold">{file.name}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setImageZoom(prev => Math.max(prev - 0.1, 0.1))}
                  className="h-8 w-8"
                  title="缩小 (-)"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm">{Math.round(imageZoom * 100)}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setImageZoom(prev => Math.min(prev + 0.1, 3))}
                  className="h-8 w-8"
                  title="放大 (+)"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setImageRotation(prev => (prev + 90) % 360)}
                  className="h-8 w-8"
                  title="旋转 (R)"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="relative w-full h-full overflow-auto">
              <img 
                ref={imageRef}
                src={previewUrl} 
                alt={file.name}
                className="max-w-none transition-transform duration-200"
                style={{
                  transform: `rotate(${imageRotation}deg) scale(${imageZoom})`,
                  transformOrigin: 'center center'
                }}
              />
            </div>
            <DialogFooter>
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-white/60">
                  {formatFileSize(file.size)}
                </span>
                {onDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadClick}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    下载
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
    }

    if (previewUrl && file.type.includes('pdf')) {
      return (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogTrigger asChild>
            <div 
              className="relative group cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              aria-label={`预览PDF: ${file.name}`}
            >
              <div className="w-[300px] h-[200px] rounded-lg bg-white/5 flex items-center justify-center">
                <FileText className="w-12 h-12 text-white/50" aria-hidden="true" />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent 
            className="max-w-[90vw] h-[90vh] bg-background/95 backdrop-blur-xl border-white/20"
            ref={previewRef}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">{file.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 w-full h-full min-h-0">
              <iframe
                src={`${previewUrl}#toolbar=0`}
                className="w-full h-full rounded-lg"
                title={`PDF预览: ${file.name}`}
              />
            </div>
            <DialogFooter>
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-white/60">
                  {formatFileSize(file.size)}
                </span>
                {onDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadClick}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    下载
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
    }

    if (previewContent && isTextFile(file)) {
      return (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogTrigger asChild>
            <div 
              className="relative group cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              aria-label={`预览文件: ${file.name}`}
            >
              <div className="w-[300px] h-[200px] rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                <div className="p-4 w-full h-full overflow-hidden">
                  <pre className="text-xs text-white/70 overflow-hidden">
                    {previewContent.slice(0, 500)}
                    {previewContent.length > 500 && '...'}
                  </pre>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent 
            className="max-w-[90vw] h-[90vh] bg-background/95 backdrop-blur-xl border-white/20"
            ref={previewRef}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center justify-between">
                <span>{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToClipboard}
                  className="h-8 w-8 hover:bg-white/10"
                  title="复制内容 (Ctrl+C)"
                >
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="relative flex-1 w-full min-h-0 overflow-auto">
              <SyntaxHighlighter
                language={getFileLanguage()}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  background: 'rgba(0, 0, 0, 0.3)'
                }}
                showLineNumbers
              >
                {previewContent}
              </SyntaxHighlighter>
            </div>
            <DialogFooter>
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-white/60">
                  {formatFileSize(file.size)}
                </span>
                {onDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadClick}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    下载
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
    }

    return null
  }

  return (
    <div 
      className={cn("space-y-2", className)}
      role="region"
      aria-label={`文件: ${file.name}`}
    >
      {renderPreview()}
      <div 
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2",
          isPreviewOpen ? "bg-white/20" : "bg-white/10"
        )}
        role="group"
        aria-label={`文件信息: ${file.name}`}
      >
        <FileIcon className={cn("w-4 h-4", fileTypeInfo.color)} />
        <div className="flex flex-col min-w-[200px]">
          <span className="text-sm font-medium truncate max-w-[200px]">
            {file.name}
          </span>
          <span className="text-xs text-white/70">
            {formatFileSize(file.size)} · {fileTypeInfo.description}
          </span>
          {typeof file.uploadProgress === 'number' && file.uploadProgress < 100 && (
            <div className="mt-1">
              <Progress 
                value={file.uploadProgress} 
                className="h-1"
                aria-label="上传进度"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={file.uploadProgress}
              />
              <span className="text-xs text-white/70 mt-1">
                上传中 {Math.round(file.uploadProgress)}%
              </span>
            </div>
          )}
          {error && (
            <span className="text-xs text-red-400 mt-1" role="alert">
              {error}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onDownload && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white/10"
              onClick={handleDownloadClick}
              aria-label={`下载文件: ${file.name}`}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          {(file.type.startsWith('image/') || file.type.includes('pdf') || isTextFile(file)) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white/10"
              onClick={() => setIsPreviewOpen(true)}
              aria-label={`预览文件: ${file.name}`}
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 