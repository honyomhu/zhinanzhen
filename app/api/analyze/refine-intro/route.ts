import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";

const REFINE_INTRO_PROMPT = `你是一位面试辅导顾问。用户对AI生成的自我介绍不满意，你需要根据ta的反馈重新生成。

## 工作方式
用户会指出具体哪里不满意，比如：
- "这段太模板化了，不像我会说的话"
- "这个项目细节不对，实际我是负责XX不是YY"
- "太啰嗦了，精简一点"
- "这里编造了我不存在的经历，删掉"
- "语气太正式/太随意"

你需要理解用户的不满，然后修正对应的部分，同时保持其他满意的部分不变。

## 原则
- **只能用简历中已有的信息**，不能编造公司名、项目名、数字、职位。如果简历没写，就不要加
- 用户说"不对"的地方，严格按照用户的描述来改
- 保持自我介绍的质量标准：讲竞争力、不念简历、有具体证据
- 输出完整的修正后自我介绍

## 输出格式
{
  "content": "修正后的完整自我介绍..."
}`;

export async function POST(request: NextRequest) {
  try {
    const { versionType, versionLabel, originalContent, userFeedback, resumeText, jdText } =
      await request.json();

    if (!originalContent || !userFeedback) {
      return NextResponse.json(
        { success: false, error: "请提供原始内容和你的反馈" },
        { status: 400 }
      );
    }

    const response = await callAI({
      system: REFINE_INTRO_PROMPT,
      messages: [
        {
          role: "user",
          content: `用户对以下自我介绍不满意，请根据ta的反馈重新生成。

## 当前自我介绍
${originalContent}

## 用户不满意的地方
${userFeedback}

## 简历（所有事实必须来自这里，不能编造）
${resumeText?.slice(0, 2000) || "未提供"}

## 目标岗位
${jdText?.slice(0, 800) || "未提供"}

请输出修正后的完整自我介绍。`,
        },
      ],
      temperature: 0.5,
      maxTokens: 2048,
    });

    const jsonStr = extractJSON(response);
    let data: unknown;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Refine intro JSON parse error:", parseError);
      return NextResponse.json(
        { success: false, error: "AI 返回数据格式异常，请重试" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "自我介绍修正失败";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
