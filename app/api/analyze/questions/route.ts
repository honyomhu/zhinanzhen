import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";
import {
  FOLLOWUP_QUESTIONS_SYSTEM_PROMPT,
  buildFollowUpQuestionsPrompt,
} from "@/lib/prompts/followup-questions";

export async function POST(request: NextRequest) {
  try {
    const { starStories, resumeText, jdText, companyText } = await request.json();

    if (!starStories) {
      return NextResponse.json(
        { success: false, error: "请提供 STAR 经历数据" },
        { status: 400 }
      );
    }

    const starSummary = typeof starStories === "string"
      ? starStories
      : JSON.stringify(starStories, null, 2);

    const response = await callAI({
      system: FOLLOWUP_QUESTIONS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildFollowUpQuestionsPrompt(
            resumeText || "",
            jdText || "",
            starSummary,
            companyText || ""
          ),
        },
      ],
      temperature: 0.7,
      maxTokens: 8192,
    });

    const jsonStr = extractJSON(response);
    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse failed. Raw response (first 500 chars):", response.slice(0, 500));
      console.error("Extracted JSON (first 500 chars):", jsonStr.slice(0, 500));
      throw new Error("AI 返回格式异常，请点击「重新生成」再试一次");
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "追问生成失败";
    console.error("Questions API error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
