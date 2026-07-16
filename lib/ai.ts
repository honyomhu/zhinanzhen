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
 * 从文本中提取平衡的括号内容（用于提取 JSON 对象或数组）
 * 相比贪婪正则，能正确处理文本中多个括号的情况
 */
function extractBalancedBraces(text: string, open: string, close: string): string | null {
  const startIdx = text.indexOf(open);
  if (startIdx === -1) return null;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (ch === "\\") {
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) {
        return text.substring(startIdx, i + 1);
      }
    }
  }

  return null; // 括号不匹配
}

/**
 * 从 AI 响应文本中提取 JSON
 * 处理 AI 可能用 markdown 代码块包裹 JSON 的情况
 * 使用平衡括号匹配，比贪婪正则更健壮
 */
export function extractJSON(text: string): string {
  // 尝试匹配 ```json ... ``` 或 ``` ... ``` 代码块（支持大小写）
  const jsonBlockMatch = text.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    const inner = jsonBlockMatch[1].trim();
    // 在代码块内部再次尝试提取 JSON 对象/数组（去掉可能的说明文字）
    const obj = extractBalancedBraces(inner, "{", "}");
    if (obj) return obj;
    const arr = extractBalancedBraces(inner, "[", "]");
    if (arr) return arr;
    return inner;
  }

  // 尝试用平衡括号匹配提取 { ... } 对象
  const objMatch = extractBalancedBraces(text, "{", "}");
  if (objMatch) return objMatch;

  // 尝试用平衡括号匹配提取 [ ... ] 数组
  const arrMatch = extractBalancedBraces(text, "[", "]");
  if (arrMatch) return arrMatch;

  return text.trim();
}
