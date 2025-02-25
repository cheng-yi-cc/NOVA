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

  if (!selectedModel) {
    throw new Error('未选择模型')
  }

  try {
    // 创建基本消息数据
    let messageData;

    // 如果没有文件
    if (!files || files.length === 0) {
      messageData = {
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
      };
    } else {
      // 如果有文件，检查文件类型
      const imageContents = await Promise.all(files.map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error('只支持图片格式文件');
        }
        
        // 转换文件为base64格式
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        return {
          type: "image_url",
          image_url: {
            url: base64,
            detail: "auto" // `auto` 和 `low` 表示低分辨率模式，`high` 表示高分辨率模式
          }
        };
      }));

      // 构造符合VLM要求的消息结构
      messageData = {
        model: selectedModel,
        messages: [{
          role: "user",
          content: [
            ...imageContents,
            {
              type: "text",
              text: content || "请分析上传的图片"
            }
          ]
        }],
        temperature: 0.7,
        stream: true,
        max_tokens: 2000
      };
    }

    // 发送请求
    const response = await fetch('https://api.siliconflow.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });

    // 处理响应
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || `请求失败 (${response.status})`;
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available')
    let accumulatedContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

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
      throw new Error('No content received from the server')
    }

    return accumulatedContent;

  } catch (error) {
    console.error('发送消息失败:', error);
    throw error instanceof Error ? error : new Error('未知错误发生');
  }
} 