import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";
import {
  buildInterviewSystemPrompt,
  buildInterviewRespondPrompt,
} from "@/lib/prompts/interview-system";

export async function POST(request: NextRequest) {
  try {
    const { conversationHistory, userAnswer, currentRound, jdText, matchSummary, companyText } =
      await request.json();

    if (!userAnswer) {
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
            userAnswer,
            currentRound || 1
          ),
        },
      ],
      temperature: 0.5,
      maxTokens: 2048,
    });

    const jsonStr = extractJSON(response);
    const data = JSON.parse(jsonStr);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "回复失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
