import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";

const COMPANY_LOOKUP_PROMPT = `你是一个企业信息查询助手。请根据用户提供的公司名称，输出该公司的详细信息。

如果这家公司比较知名，请基于你的知识提供准确信息。
如果公司不太知名或你不确定，请根据公司名称和行业常识给出合理推断，并标注"(推断)"。
如果完全没听说过，请诚实说"信息不足"并给出获取信息的建议。

## 输出格式（严格 JSON）

{
  "found": true,
  "name": "公司全称",
  "industry": "所属行业",
  "business": "主营业务（2-3句话）",
  "products": ["主要产品/服务1", "主要产品/服务2", "主要产品/服务3"],
  "scale": "公司规模（如：500人以上 / 200-500人 / 50-200人 / 初创公司）",
  "stage": "发展阶段（如：上市公司 / 独角兽 / B轮 / A轮 / 天使轮 / 未融资）",
  "clients": "主要客户群体",
  "competitors": ["竞品公司1", "竞品公司2"],
  "culture": "企业文化特点（如：技术驱动 / 销售导向 / 扁平化管理 / 狼性文化）",
  "interviewStyle": "面试风格（如：重技术深度 / 重项目经验 / 重沟通表达 / 多轮面试）",
  "recentNews": "近期动态或新闻（如有）",
  "whyWorkHere": "选择这家公司的理由（1-2句话，适合在面试中表达）",
  "tips": ["针对这家公司面试的3条实用建议"]
}`;

export async function POST(request: NextRequest) {
  try {
    const { companyName } = await request.json();

    if (!companyName || typeof companyName !== "string" || companyName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "请输入至少2个字的公司名称" },
        { status: 400 }
      );
    }

    const response = await callAI({
      system: COMPANY_LOOKUP_PROMPT,
      messages: [
        {
          role: "user",
          content: `请查找这家公司的信息：${companyName.trim()}

请尽量详细。如果不确定的信息，请标注"(推断)"并给出你的推测依据。`,
        },
      ],
      temperature: 0.3,
      maxTokens: 2048,
    });

    // 提取 JSON
    let data;
    try {
      // 先尝试直接解析
      data = JSON.parse(response);
    } catch {
      // 尝试从 markdown 代码块中提取
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[1].trim());
      } else {
        // 尝试提取花括号内容
        const braceMatch = response.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          data = JSON.parse(braceMatch[0]);
        } else {
          throw new Error("AI 返回格式异常");
        }
      }
    }

    // 格式化为可读文本，方便直接填入
    const formattedText = formatCompanyInfo(data);

    return NextResponse.json({
      success: true,
      data: {
        raw: data,
        formattedText,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "公司信息查找失败";
    console.error("Company lookup error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

function formatCompanyInfo(data: any): string {
  const lines: string[] = [];

  if (data.name) lines.push(`公司名称：${data.name}`);
  if (data.industry) lines.push(`所属行业：${data.industry}`);
  if (data.business) lines.push(`主营业务：${data.business}`);
  if (data.products?.length) lines.push(`主要产品/服务：${data.products.join("、")}`);
  if (data.scale) lines.push(`公司规模：${data.scale}`);
  if (data.stage) lines.push(`发展阶段：${data.stage}`);
  if (data.clients) lines.push(`主要客户：${data.clients}`);
  if (data.culture) lines.push(`企业文化：${data.culture}`);
  if (data.interviewStyle) lines.push(`面试风格：${data.interviewStyle}`);
  if (data.recentNews) lines.push(`近期动态：${data.recentNews}`);
  if (data.whyWorkHere) lines.push(`推荐理由：${data.whyWorkHere}`);
  if (data.tips?.length) {
    lines.push(`面试建议：`);
    data.tips.forEach((tip: string, i: number) => lines.push(`  ${i + 1}. ${tip}`));
  }
  if (data.competitors?.length) lines.push(`竞品参考：${data.competitors.join("、")}`);

  return lines.join("\n");
}
