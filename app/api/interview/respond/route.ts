import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";
import {
  buildInterviewSystemPrompt,
  buildInterviewRespondPrompt,
} from "@/lib/prompts/interview-system";

export async function POST(request: NextRequest) {
  try {
    const {
      conversationHistory,
      userAnswer,
      currentRound,
      jdText,
      matchSummary,
      companyText,
      action,
    } = await request.json();

    const mode = action || "answer"; // "answer" | "need_hint" | "need_example"

    if (!userAnswer && mode === "answer") {
      return NextResponse.json(
        { success: false, error: "请提供回答内容" },
        { status: 400 }
      );
    }

    const systemPrompt = buildInterviewSystemPrompt(
      jdText || "",
      "",
      matchSummary || "",
      companyText || ""
    );

    const response = await callAI({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: buildInterviewRespondPrompt(
            conversationHistory || "",
            userAnswer || "",
            currentRound || 1,
            mode as "answer" | "need_hint" | "need_example"
          ),
        },
      ],
      temperature: 0.6,
      maxTokens: 2048,
    });

    const jsonStr = extractJSON(response);
    let data: unknown;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Interview respond JSON parse error:", parseError);
      return NextResponse.json(
        { success: false, error: "AI 返回格式异常，请重试" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "回复失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
