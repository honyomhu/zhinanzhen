import { NextRequest, NextResponse } from "next/server";
import { callAI, extractJSON } from "@/lib/ai";

const REFINE_INTRO_PROMPT = `你是一位顶级面试教练和简历顾问。用户提供了关于自己的补充信息，你需要据此重新生成一版更贴合实际的自我介绍。

## 任务
将用户补充的个人经历、优势、风格偏好融入自我介绍，保持原有版本（elevator/standard/narrative）的时间长度和风格特征。

## 三种版本说明
- elevator: 30秒电梯演讲，一句话抓住面试官，突出最核心的差异化价值
- standard: 2分钟标准版，涵盖背景、核心能力、关键成就、求职动机，面试最常用
- narrative: 3分钟故事版，以成长故事为主线，有起承转合，适合氛围轻松的面试

## 要求
- 严格使用用户提供的真实补充信息，不要编造
- 保持对应版本的时间长度和风格
- 开头要有记忆点（不要"我叫XX，来自XX"这种模板化开头）
- 结尾自然过渡到"为什么适合这个岗位"
- 用中文输出

## 输出格式
{
  "content": "重新生成的自我介绍全文..."
}`;

export async function POST(request: NextRequest) {
  try {
    const { versionType, versionLabel, originalContent, userFeedback, resumeText, jdText } =
      await request.json();

    if (!originalContent || !userFeedback) {
      return NextResponse.json(
        { success: false, error: "请提供原始内容和补充信息" },
        { status: 400 }
      );
    }

    const response = await callAI({
      system: REFINE_INTRO_PROMPT,
      messages: [
        {
          role: "user",
          content: `请根据用户的补充信息，重新生成以下自我介绍（${versionLabel || versionType}版本）：

## 版本类型
${versionLabel || versionType}

## 原始 AI 生成的自我介绍
${originalContent}

## 用户的补充/修正
${userFeedback}

## 简历参考
${resumeText?.slice(0, 1500) || "未提供"}

## 目标岗位
${jdText?.slice(0, 1000) || "未提供"}

请生成修正后的自我介绍。`,
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
