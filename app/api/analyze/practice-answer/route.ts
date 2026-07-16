import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";

const PRACTICE_PROMPT = `你是一位温和但专业的面试教练。用户正在练习回答面试追问，你需要给出简短、有建设性的反馈。

## 评估标准
- 是否正面回答了问题（不跑题）
- 是否使用了 STAR 结构或类似的逻辑框架
- 是否有具体的细节/数据支撑（不泛泛而谈）
- 表达是否自信流畅

## 输出格式
{
  "score": 7,
  "briefFeedback": "一句话总体评价",
  "goodPoints": ["亮点1", "亮点2"],
  "improvements": ["改进点1"],
  "sampleBetter": "一个更好的回答示范（结合用户的简历背景，100-200字）"
}`;

export async function POST(request: NextRequest) {
  try {
    const { question, keyPoints, userAnswer, resumeContext } = await request.json();

    if (!question || !userAnswer) {
      return NextResponse.json(
        { success: false, error: "请提供问题和你的回答" },
        { status: 400 }
      );
    }

    const response = await callAI({
      system: PRACTICE_PROMPT,
      messages: [
        {
          role: "user",
          content: `请评估以下面试练习回答：

## 面试问题
${question}

## 得分要点（参考答案方向）
${keyPoints?.join("\n") || "未提供"}

## 用户的回答
${userAnswer}

## 简历背景（参考）
${resumeContext?.slice(0, 800) || "未提供"}

请给出评分和反馈。`,
        },
      ],
      temperature: 0.5,
      maxTokens: 1024,
    });

    const jsonStr = extractJSON(response);
    let data: unknown;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { success: false, error: "AI 评估失败，请重试" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "练习评估失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
