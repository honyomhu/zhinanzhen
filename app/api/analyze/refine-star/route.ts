import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";

const REFINE_STAR_PROMPT = `你是一位顶级简历顾问。用户提供了关于某段经历的真实补充信息，你需要根据这些信息重新生成 STAR 故事。

## 任务
将用户提供的真实经历细节融入 STAR 法则框架，生成一个准确、有说服力的面试故事。

## 要求
- 严格使用用户提供的真实信息，不要编造数据
- 如果用户说的是"不是XX，而是YY"，必须用 YY 替代 XX
- 保持 STAR 四要素完整
- Action 部分要有足够细节（3-5句）
- Result 尽可能量化
- 用中文输出

## 输出格式
{
  "star": {
    "situation": "...",
    "task": "...",
    "action": "...",
    "result": "..."
  },
  "relevanceScore": 8
}`;

export async function POST(request: NextRequest) {
  try {
    const { requirement, originalStar, userFeedback, resumeText } = await request.json();

    if (!requirement || !userFeedback) {
      return NextResponse.json(
        { success: false, error: "请提供要求内容和修正信息" },
        { status: 400 }
      );
    }

    const response = await callAI({
      system: REFINE_STAR_PROMPT,
      messages: [
        {
          role: "user",
          content: `请根据用户的补充信息，重新生成以下 STAR 故事：

## JD 要求
${requirement}

## 原始 AI 生成的 STAR（可能不准确）
${JSON.stringify(originalStar, null, 2)}

## 用户的补充/修正
${userFeedback}

## 简历原文（参考）
${resumeText?.slice(0, 2000) || "未提供"}

请生成修正后的 STAR 故事。`,
        },
      ],
      temperature: 0.3,
      maxTokens: 2048,
    });

    const jsonStr = extractJSON(response);
    let data: unknown;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Refine STAR JSON parse error:", parseError);
      return NextResponse.json(
        { success: false, error: "AI 返回数据格式异常，请重试" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "STAR 修正失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
