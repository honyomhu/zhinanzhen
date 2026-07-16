import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";
import {
  INTRODUCTION_SYSTEM_PROMPT,
  buildIntroductionPrompt,
} from "@/lib/prompts/introduction";

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jdText, starMatchSummary, companyText } = await request.json();

    if (!resumeText || !jdText) {
      return NextResponse.json(
        { success: false, error: "请提供简历和 JD 文本" },
        { status: 400 }
      );
    }

    const response = await callAI({
      system: INTRODUCTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildIntroductionPrompt(
            resumeText,
            jdText,
            starMatchSummary || "",
            companyText || ""
          ),
        },
      ],
      temperature: 0.5,
      maxTokens: 4096,
    });

    const jsonStr = extractJSON(response);
    let data: unknown;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Introduction JSON parse error:", parseError);
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
    const message = error instanceof Error ? error.message : "自我介绍生成失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
