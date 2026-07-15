import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";
import {
  INTERVIEW_REPORT_SYSTEM_PROMPT,
  buildInterviewReportPrompt,
} from "@/lib/prompts/interview-report";

export async function POST(request: NextRequest) {
  try {
    const { conversationHistory, matchSummary } = await request.json();

    if (!conversationHistory) {
      return NextResponse.json(
        { success: false, error: "请提供面试对话记录" },
        { status: 400 }
      );
    }

    const response = await callAI({
      system: INTERVIEW_REPORT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildInterviewReportPrompt(
            conversationHistory,
            matchSummary || ""
          ),
        },
      ],
      temperature: 0.4,
      maxTokens: 4096,
    });

    const jsonStr = extractJSON(response);
    const data = JSON.parse(jsonStr);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成报告失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
