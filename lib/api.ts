import { useSettingsStore } from "./store"

interface UploadProgress {
  fileName: string
  progress: number
}

export async function sendMessage(
  content: string, 
  onProgress?: (chunk: string) => void,
  files?: File[],
  onUploadProgress?: (progress: UploadProgress) => void
) {
  const { apiKey, selectedModel } = useSettingsStore.getState()
  
  if (!apiKey) {
    throw new Error('API Key not configured')
  }

  if (!selectedModel) {
    throw new Error('No model selected')
  }

  try {
    // 创建基本消息数据
    const messageData = {
      model: selectedModel,
      messages: [
        {
          role: 'user',
          content: content || "请分析上传的文件"
        }
      ],
      temperature: 0.7,
      stream: true,
      max_tokens: 2000
    }

    // 如果有文件，使用 FormData
    if (files && files.length > 0) {
      const formData = new FormData()
      
      // 添加消息数据
      formData.append('model', selectedModel)  // 单独添加 model 字段
      formData.append('request', JSON.stringify({
        messages: messageData.messages,
        temperature: messageData.temperature,
        stream: messageData.stream,
        max_tokens: messageData.max_tokens
      }))
      
      // 添加文件
      files.forEach((file) => {
        formData.append('files', file)
      })

      // 使用 XMLHttpRequest 处理上传进度
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', 'https://api.siliconflow.com/v1/chat/completions', true)  // 使用 .com 域名
        xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`)
        
        // 处理上传进度
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onUploadProgress) {
            const progress = (event.loaded / event.total) * 100
            files.forEach(file => {
              onUploadProgress({
                fileName: file.name,
                progress: progress
              })
            })
          }
        }

        // 处理响应
        xhr.onload = async () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText)
              if (response.choices && response.choices[0]) {
                const content = response.choices[0].message?.content || ''
                onProgress?.(content)
                resolve(content)
              } else {
                reject(new Error('Invalid response format'))
              }
            } catch (e) {
              reject(new Error('Failed to parse response'))
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              reject(new Error(`请求错误: ${errorData.message || xhr.statusText}`))
            } catch (e) {
              reject(new Error(`请求失败: ${xhr.status} ${xhr.statusText}`))
            }
          }
        }

        // 处理错误
        xhr.onerror = () => {
          reject(new Error('网络请求失败'))
        }

        // 发送请求
        xhr.send(formData)
      })
    } else {
      // 普通文本请求
      const response = await fetch('https://api.siliconflow.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.message || `API request failed with status ${response.status}`
        
        switch (response.status) {
          case 400:
            throw new Error(`请求格式错误: ${errorMessage}`)
          case 401:
            throw new Error('API Key 无效或已过期')
          case 403:
            throw new Error('权限不够，请确认是否已完成实名认证')
          case 429:
            throw new Error('请求过于频繁，请稍后再试')
          case 504:
          case 503:
            throw new Error('服务暂时不可用，请稍后重试')
          case 500:
            throw new Error('服务器内部错误，请联系客服')
          default:
            throw new Error(errorMessage)
        }
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      let accumulatedContent = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content || ''
              if (content) {
                accumulatedContent += content
                onProgress?.(accumulatedContent)
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }

      if (!accumulatedContent) {
        throw new Error('No content received from API')
      }

      return accumulatedContent
    }
  } catch (error) {
    console.error('Error sending message:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred')
  }
} 