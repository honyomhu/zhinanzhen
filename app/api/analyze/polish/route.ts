import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";
import { POLISH_SYSTEM_PROMPT, buildPolishPrompt } from "@/lib/prompts/polish";

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jdText } = await request.json();

    if (!resumeText) {
      return NextResponse.json(
        { success: false, error: "请提供简历文本" },
        { status: 400 }
      );
    }

    const response = await callAI({
      system: POLISH_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildPolishPrompt(resumeText, jdText || ""),
        },
      ],
      temperature: 0.4,
      maxTokens: 8192,
    });

    const jsonStr = extractJSON(response);
    let data: unknown;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Polish JSON parse error:", parseError);
      console.error("Raw AI response (first 1000 chars):", response.substring(0, 1000));
      return NextResponse.json(
        {
          success: false,
          error: "AI 返回数据格式异常，请点击 🔄 重试",
          detail: parseError instanceof Error ? parseError.message : "JSON 解析失败",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "经历打磨失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
