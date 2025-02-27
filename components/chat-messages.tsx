"use client"

import { cn } from "@/lib/utils"
import { FileText, Image, File, Loader2, ExternalLink, Download, Copy, Check, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useCallback, useRef, useEffect, type ComponentPropsWithoutRef } from "react"
import ReactMarkdown, { type Components } from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Message, FileData } from '@/lib/types'
import { toast } from 'sonner'

interface ChatMessagesProps {
  messages: Message[]
  inline?: boolean
}

interface CodeBlockProps extends ComponentPropsWithoutRef<'code'> {
  inline?: boolean
  className?: string
}

export function ChatMessages({ messages, inline = false }: ChatMessagesProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [focusedMessageIndex, setFocusedMessageIndex] = useState<number>(-1)
  const messageRefs = useRef<(HTMLDivElement | null)[]>([])
  const placement = inline ? "start" : "end"  // 用户消息展示位置

  const setMessageRef = useCallback((el: HTMLDivElement | null, index: number) => {
    messageRefs.current[index] = el
  }, [])

  useEffect(() => {
    messageRefs.current = messageRefs.current.slice(0, messages.length)
  }, [messages.length])

  const copyToClipboard = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      toast.success('代码已复制到剪贴板')
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
      toast.error('复制失败')
    }
  }, [])

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  // const handleDownload = (file: FileData) => {
  //   const blob = new Blob([file.data])
  //   const url = URL.createObjectURL(blob)
  //   const a = document.createElement('a')
  //   a.href = url
  //   a.download = file.name
  //   document.body.appendChild(a)
  //   a.click()
  //   document.body.removeChild(a)
  //   URL.revokeObjectURL(url)
  // }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const direction = e.key === 'ArrowUp' ? -1 : 1
      const newIndex = focusedMessageIndex + direction
      if (newIndex >= 0 && newIndex < messages.length) {
        setFocusedMessageIndex(newIndex)
        messageRefs.current[newIndex]?.focus()
      }
    }
  }

  const markdownComponents: Components = {
    code({ inline, className, children, ...props }: CodeBlockProps) {
      const match = /language-(\w+)/.exec(className || '')
      const code = String(children).replace(/\n$/, '')

      if (!inline && match) {
        return (
          <div className="relative group">
            <div className="!bg-black/30 !p-4 !rounded-lg !my-4">
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
              >
                {code}
              </SyntaxHighlighter>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-white/10"
              onClick={() => copyToClipboard(code)}
              aria-label="复制代码"
            >
              {copiedCode === code ? (
                <Check className="h-4 w-4 text-green-400" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        )
      }
      return (
        <code {...props} className={cn(
          "bg-black/30 px-1.5 py-0.5 rounded-md text-sm",
          className
        )}>
          {children}
        </code>
      )
    },
    p({ children }) {
      return <p className="mb-4 last:mb-0 break-words">{children}</p>
    },
    ul({ children }) {
      return <ul className="list-disc pl-4 mb-4 last:mb-0">{children}</ul>
    },
    ol({ children }) {
      return <ol className="list-decimal pl-4 mb-4 last:mb-0">{children}</ol>
    },
    li({ children }) {
      return <li className="mb-1 last:mb-0">{children}</li>
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto mb-4 last:mb-0">
          <table className="border-collapse w-full">
            {children}
          </table>
        </div>
      )
    },
    th({ children }) {
      return (
        <th className="border border-white/10 px-4 py-2 bg-white/5">
          {children}
        </th>
      )
    },
    td({ children }) {
      return (
        <td className="border border-white/10 px-4 py-2">
          {children}
        </td>
      )
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-white/20 pl-4 italic mb-4 last:mb-0">
          {children}
        </blockquote>
      )
    },
    hr() {
      return <hr className="border-white/10 my-4" />
    }
  }

  return (
    <div
      className="flex-1 py-4 pl-4 pr-6"
      role="log"
      aria-label="聊天消息"
      aria-live="polite"
    >
      <div className="w-full flex justify-center">
        <div className="w-full space-y-6 px-2">
          {messages.map((message, index) => {
            if (message.files && message.files.length > 0) {
              let images = message.files.filter(file => file.type.startsWith('image/'));
              let otherFiles = message.files.filter(file => !file.type.startsWith('image/'));
              return (
                <div
                  className={`flex w-full flex-col empty:hidden ${placement === "end" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`flex flex-row items-center ${placement === "end" ? "justify-end" : "justify-start"} gap-1`}
                  >
                    {/* 横向展示图片 */}
                    {images.map((image, index) => {
                      const isEnd = placement === "end";
                      const isFirst = index === 0;
                      const isLast = index === images.length - 1;
                      const commonClasses = `size-32 overflow-hidden rounded-lg ${isEnd
                        ? isFirst
                          ? "rounded-l-2xl"
                          : isLast
                            ? "rounded-br-sm rounded-tr-2xl"
                            : ""
                        : isLast
                          ? "rounded-r-2xl"
                          : isFirst
                            ? "rounded-bl-sm rounded-tl-2xl"
                            : ""
                        }`;

                      return (
                        <img
                          key={"image-" + index}
                          src={URL.createObjectURL(new Blob([image.data]))}
                          alt={image.name}
                          className={`${commonClasses}`}
                        />
                      )
                    })}
                  </div>
                  {/* 纵向展示文件 */}
                  {
                    otherFiles.map((file, index) => (
                      <div
                        key={"file-" + index}
                        className="mt-1 flex h-16 w-60 flex-nowrap items-center gap-2 rounded-xl border border-light p-2 text-sm dark:border-[hsla(0,0%,100%,.1)] md:w-80"
                      >
                        <div className="h-full">
                          <File size={32} className="mt-1 text-black dark:text-white" />
                        </div>

                        <div className="overflow-hidden">
                          <div className="max-w-48 truncate font-semibold">
                            {file.name}
                          </div>
                          <div className="text-gray-400">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )
            }
            return (
              <div
                key={message.id}
                ref={(el) => setMessageRef(el, index)}
                className={cn(
                  "flex items-start gap-4 max-w-4xl mx-auto group space-y-2",
                  message.role === "user" && "justify-end"
                )}
                tabIndex={0}
                role="article"
                aria-label={`${message.role === 'user' ? '用户' : '助手'}消息`}
                onKeyDown={handleKeyDown}
              >
                {message.role === "assistant" && (
                  <div
                    className="min-w-8 min-h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500"
                    aria-hidden="true"
                  >
                    K
                  </div>
                )}
                {message.role === "user" && (
                  <div
                    className="mt-4 flex justify-end gap-3 min-w-[32px]"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 opacity-0 group-hover:opacity-100 hover:bg-gray-300 hover:text-black rounded"
                      onClick={() => copyToClipboard(message.content)}
                      aria-label="复制用户消息"
                    >
                      {copiedCode === message.content ? (
                        <Check className="size-6 text-green-500" aria-hidden="true" />
                      ) : (
                        <Copy className="size-6" aria-hidden="true" />
                      )}
                    </Button>
                    {/* <div className="size-6">
                      <Edit className="size-6" />
                    </div> TODO: 编辑消息 */}
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/70",
                    message.error && "bg-red-500/10 text-red-400"
                  )}
                >
                  {message.isStreaming ? (
                    <>
                      <span>{message.streamedContent}</span>
                      <span
                        className="inline-block w-1 h-4 ml-0.5 -mb-0.5 bg-current animate-pulse"
                        aria-label="正在输入"
                      />
                    </>
                  ) : (
                    <div className="prose prose-invert">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* {message.role === "user" && (
              <div 
                className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500"
                aria-hidden="true"
              >
                U
              </div>
            )} */}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 