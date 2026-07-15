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
    const data = JSON.parse(jsonStr);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "JD 拆解失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
