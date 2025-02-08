import { useSettingsStore } from "./store"

export async function sendMessage(content: string, onProgress?: (chunk: string) => void) {
  const { apiKey, selectedModel } = useSettingsStore.getState()
  
  try {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.7,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error('API request failed')
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

    return accumulatedContent
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
} 