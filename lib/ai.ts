import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "sk-xxx",
  baseURL: "https://api.deepseek.com/v1",
});

const MODEL = "deepseek-chat";

export interface AIStreamOptions {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  temperature?: number;
  maxTokens?: number;
}

/**
 * 调用 DeepSeek API（非流式），用于获取结构化 JSON 响应
 */
export async function callAI(options: AIStreamOptions): Promise<string> {
  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: options.system },
      ...options.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096,
    });

    const text = response.choices[0]?.message?.content?.trim() || "";
    return text;
  } catch (error) {
    console.error("DeepSeek API error:", error);
    if (error instanceof Error) {
      // 提供更友好的错误提示
      if (error.message.includes("Insufficient Balance")) {
        throw new Error("DeepSeek API 余额不足，请前往 https://platform.deepseek.com/ 充值");
      }
      if (error.message.includes("AuthenticationError") || error.message.includes("Invalid API Key")) {
        throw new Error("DeepSeek API Key 无效，请检查 .env.local 中的 DEEPSEEK_API_KEY");
      }
    }
    throw new Error(`AI 调用失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

/**
 * 调用 DeepSeek API（流式），用于实时输出长文本
 */
export async function callAIStream(
  options: AIStreamOptions
): Promise<ReadableStream<Uint8Array>> {
  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: options.system },
      ...options.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(new TextEncoder().encode(delta));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  } catch (error) {
    console.error("DeepSeek streaming API error:", error);
    throw new Error(`AI 流式调用失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}

/**
 * 从 AI 响应文本中提取 JSON
 * 处理 AI 可能用 markdown 代码块包裹 JSON 的情况
 */
export function extractJSON(text: string): string {
  // 尝试匹配 ```json ... ``` 代码块
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // 尝试匹配 { ... } 对象
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }

  // 尝试匹配 [ ... ] 数组
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0].trim();
  }

  return text.trim();
}
