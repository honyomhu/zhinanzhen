import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import { buildInterviewSystemPrompt, buildInterviewStartPrompt } from "@/lib/prompts/interview-system";

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jdText, matchSummary, companyText } = await request.json();

    if (!resumeText || !jdText) {
      return NextResponse.json(
        { success: false, error: "缺少简历或 JD 信息" },
        { status: 400 }
      );
    }

    const systemPrompt = buildInterviewSystemPrompt(
      jdText,
      resumeText.slice(0, 1000),
      matchSummary || "",
      companyText || ""
    );

    const response = await callAI({
      system: systemPrompt,
      messages: [
        { role: "user", content: buildInterviewStartPrompt() },
      ],
      temperature: 0.7,
      maxTokens: 512,
    });

    // 清理回应（可能有多余的引号或换行）
    const openingMessage = response.trim().replace(/^["']|["']$/g, "");

    return NextResponse.json({
      success: true,
      data: { openingMessage },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "开始面试失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
