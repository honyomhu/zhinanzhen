"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InterviewChat from "@/components/interview/InterviewChat";
import { getCache } from "@/lib/storage";

export default function InterviewPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    resumeText: string;
    jdText: string;
    companyText: string;
    matchSummary: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resumeData = getCache<{ text: string }>("resume_data");
    const jdText = getCache<string>("jd_text");
    const companyText = getCache<string>("company_text") || "";
    const matchResult = getCache<{ matched: { requirement: string; star?: { result: string } }[] }>("match_result");

    if (!resumeData?.text || !jdText) {
      router.push("/");
      return;
    }

    const matchSummary = matchResult?.matched
      ?.map((m) => `${m.requirement}: ${m.star?.result || "已匹配"}`)
      .join("\n") || "";

    setData({
      resumeText: resumeData.text,
      jdText,
      companyText,
      matchSummary,
    });
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">加载面试数据...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            🤖 AI 模拟面试
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            AI 面试官将根据您的简历和岗位进行深度追问
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          ← 返回仪表盘
        </button>
      </div>

      <InterviewChat
        resumeText={data.resumeText}
        jdText={data.jdText}
        companyText={data.companyText}
        matchSummary={data.matchSummary}
      />
    </div>
  );
}
