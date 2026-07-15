import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";
import { STAR_MATCH_SYSTEM_PROMPT, buildStarMatchPrompt } from "@/lib/prompts/star-match";

export async function POST(request: NextRequest) {
  try {
    const { jdRequirements, resumeText } = await request.json();

    if (!jdRequirements || !resumeText) {
      return NextResponse.json(
        { success: false, error: "请提供 JD 要求和简历文本" },
        { status: 400 }
      );
    }

    const response = await callAI({
      system: STAR_MATCH_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildStarMatchPrompt(
            typeof jdRequirements === "string"
              ? jdRequirements
              : JSON.stringify(jdRequirements, null, 2),
            resumeText
          ),
        },
      ],
      temperature: 0.3,
      maxTokens: 8192,
    });

    const jsonStr = extractJSON(response);
    const data = JSON.parse(jsonStr);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "STAR 匹配失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
