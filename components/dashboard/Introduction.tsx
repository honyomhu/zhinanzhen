"use client";

import { useState } from "react";
import type { IntroductionResult } from "@/lib/types";

interface IntroductionProps {
  data: IntroductionResult;
}

const VERSION_ICONS: Record<string, string> = {
  elevator: "⚡",
  standard: "🎯",
  narrative: "📖",
};

export default function Introduction({ data }: IntroductionProps) {
  const [activeVersion, setActiveVersion] = useState(data.versions[0]?.type || "standard");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeContent = data.versions.find((v) => v.type === activeVersion);

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(type);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // 降级方案
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(type);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 版本选择器 */}
      <div className="flex gap-2 flex-wrap">
        {data.versions.map((version) => (
          <button
            key={version.type}
            onClick={() => setActiveVersion(version.type)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${
                activeVersion === version.type
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }
            `}
          >
            {VERSION_ICONS[version.type]} {version.label}
          </button>
        ))}
      </div>

      {/* 当前版本内容 */}
      {activeContent && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
              ⏱ {activeContent.duration}
            </span>
            <button
              onClick={() => handleCopy(activeContent.content, activeContent.type)}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              {copiedId === activeContent.type ? "✅ 已复制" : "📋 复制"}
            </button>
          </div>

          <div className="prose-custom text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {activeContent.content}
          </div>
        </div>
      )}

      {/* 核心竞争力 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl p-5 border border-blue-100 dark:border-blue-900">
        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
          💎 核心竞争力提炼
        </h4>
        <div className="space-y-2">
          {data.competitiveAdvantages.map((adv, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-blue-500 font-bold mt-0.5">{i + 1}.</span>
              <p className="text-sm text-slate-600 dark:text-slate-400">{adv}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
