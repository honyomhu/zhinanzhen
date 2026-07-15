import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";
import {
  GAP_ANALYSIS_SYSTEM_PROMPT,
  buildGapAnalysisPrompt,
} from "@/lib/prompts/gap-analysis";

export async function POST(request: NextRequest) {
  try {
    const { gaps, resumeText, jdText } = await request.json();

    if (!gaps || !resumeText) {
      return NextResponse.json(
        { success: false, error: "请提供缺口数据和简历文本" },
        { status: 400 }
      );
    }

    const response = await callAI({
      system: GAP_ANALYSIS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildGapAnalysisPrompt(
            typeof gaps === "string" ? gaps : JSON.stringify(gaps, null, 2),
            resumeText,
            jdText || ""
          ),
        },
      ],
      temperature: 0.4,
      maxTokens: 8192,
    });

    const jsonStr = extractJSON(response);
    const data = JSON.parse(jsonStr);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "缺口分析失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
