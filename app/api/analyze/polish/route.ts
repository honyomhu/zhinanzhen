import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";
import { POLISH_SYSTEM_PROMPT, buildPolishPrompt } from "@/lib/prompts/polish";

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jdText } = await request.json();

    if (!resumeText) {
      return NextResponse.json(
        { success: false, error: "请提供简历文本" },
        { status: 400 }
      );
    }

    const response = await callAI({
      system: POLISH_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildPolishPrompt(resumeText, jdText || ""),
        },
      ],
      temperature: 0.4,
      maxTokens: 16384,
    });

    const jsonStr = extractJSON(response);
    let data: unknown;

    // 尝试解析 JSON，失败时尝试修复常见问题
    const tryParse = (s: string): unknown => {
      try {
        return JSON.parse(s);
      } catch {
        // 修复1：补全缺失的闭合括号
        let repaired = s.trimEnd();
        let braceCount = (repaired.match(/\{/g) || []).length;
        let bracketCount = (repaired.match(/\[/g) || []).length;
        const closeBraceCount = (repaired.match(/\}/g) || []).length;
        const closeBracketCount = (repaired.match(/\]/g) || []).length;
        const missingBraces = braceCount - closeBraceCount;
        const missingBrackets = bracketCount - closeBracketCount;

        if (missingBraces > 0 || missingBrackets > 0) {
          // 先补数组再补对象（数组在里面）
          for (let j = 0; j < missingBrackets; j++) repaired += "]";
          for (let j = 0; j < missingBraces; j++) repaired += "}";
        }

        // 修复2：移除尾部逗号
        repaired = repaired.replace(/,\s*([}\]])/g, "$1");

        try {
          return JSON.parse(repaired);
        } catch {
          return null;
        }
      }
    };

    let result = tryParse(jsonStr);
    if (result) {
      data = result;
    } else {
      // 如果直接从 response 提取也失败，尝试对整个 response 做修复
      result = tryParse(response.trim());
      if (result) {
        data = result;
      } else {
        console.error("Polish JSON parse error after repair attempts");
        console.error("Raw AI response (first 1500 chars):", response.substring(0, 1500));
        return NextResponse.json(
          {
            success: false,
            error: "AI 返回数据格式异常，请点击 🔄 重试。如多次失败，可能是简历内容过长，请尝试精简简历后重新上传。",
            detail: "JSON 解析失败，已尝试自动修复",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "经历打磨失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
