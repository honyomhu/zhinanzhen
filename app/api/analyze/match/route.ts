import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";
import { STAR_MATCH_SYSTEM_PROMPT, buildStarMatchPrompt } from "@/lib/prompts/star-match";
import type { MatchResult } from "@/lib/types";

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
    let data: unknown;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("STAR match JSON parse error:", parseError);
      console.error("Raw AI response (first 1000 chars):", response.substring(0, 1000));
      console.error("Extracted JSON (first 1000 chars):", jsonStr.substring(0, 1000));
      return NextResponse.json(
        {
          success: false,
          error: "AI 返回的数据格式异常，请点击右上角 🔄 按钮重试。如多次失败，请尝试重新上传简历。",
          detail: parseError instanceof Error ? parseError.message : "JSON 解析失败",
        },
        { status: 500 }
      );
    }

    // 校验返回数据结构
    const result = data as Record<string, unknown>;
    if (!result.matched || !Array.isArray(result.matched)) {
      console.error("STAR match response missing 'matched' array:", Object.keys(result));
      return NextResponse.json(
        {
          success: false,
          error: "AI 返回数据缺少 matched 字段，请重试",
          detail: `返回字段: ${Object.keys(result).join(", ")}`,
        },
        { status: 500 }
      );
    }
    if (!result.gaps || !Array.isArray(result.gaps)) {
      console.error("STAR match response missing 'gaps' array:", Object.keys(result));
      return NextResponse.json(
        {
          success: false,
          error: "AI 返回数据缺少 gaps 字段，请重试",
          detail: `返回字段: ${Object.keys(result).join(", ")}`,
        },
        { status: 500 }
      );
    }
    if (typeof result.overallScore !== "number") {
      console.error("STAR match response missing 'overallScore':", typeof result.overallScore);
      result.overallScore = 50; // 设一个合理的默认值
    }

    return NextResponse.json({ success: true, data: result as unknown as MatchResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : "STAR 匹配失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
