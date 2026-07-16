import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";
import { JD_BREAKDOWN_SYSTEM_PROMPT, buildJDBreakdownPrompt } from "@/lib/prompts/jd-breakdown";

export async function POST(request: NextRequest) {
  try {
    const { jdText, companyText } = await request.json();

    if (!jdText || typeof jdText !== "string") {
      return NextResponse.json(
        { success: false, error: "请提供 JD 文本" },
        { status: 400 }
      );
    }

    const response = await callAI({
      system: JD_BREAKDOWN_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildJDBreakdownPrompt(jdText, companyText || ""),
        },
      ],
      temperature: 0.2,
      maxTokens: 4096,
    });

    const jsonStr = extractJSON(response);
    let data: unknown;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JD breakdown JSON parse error:", parseError);
      console.error("Raw AI response (first 800 chars):", response.substring(0, 800));
      console.error("Extracted JSON (first 800 chars):", jsonStr.substring(0, 800));
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
    const message = error instanceof Error ? error.message : "JD 拆解失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
