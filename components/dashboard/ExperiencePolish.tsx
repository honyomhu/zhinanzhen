"use client";

import { useState } from "react";
import type { PolishResult, ExperienceRisk } from "@/lib/types";

interface ExperiencePolishProps {
  data: PolishResult;
}

const RISK_STYLES: Record<string, { border: string; bg: string; label: string }> = {
  high: {
    border: "border-red-300 dark:border-red-800",
    bg: "bg-red-50 dark:bg-red-950/20",
    label: "🔴 高风险 — 面试官大概率会深挖",
  },
  medium: {
    border: "border-yellow-300 dark:border-yellow-800",
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    label: "🟡 中等风险 — 需提前准备",
  },
  low: {
    border: "border-green-300 dark:border-green-800",
    bg: "bg-green-50 dark:bg-green-950/20",
    label: "🟢 低风险 — 表述扎实",
  },
};

export default function ExperiencePolish({ data }: ExperiencePolishProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const highCount = data.experiences.filter((e) => e.riskLevel === "high").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 总体评估 */}
      <div
        className={`rounded-xl p-5 border ${
          data.overallRiskLevel === "high"
            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
            : data.overallRiskLevel === "medium"
            ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
            : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
        }`}
      >
        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
          📝 简历经历体检报告
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          {data.overallAdvice}
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
            🔴 {highCount} 个高风险经历
          </span>
          <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">
            🟡 {data.experiences.filter((e) => e.riskLevel === "medium").length} 个中等风险
          </span>
          <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
            🟢 {data.experiences.filter((e) => e.riskLevel === "low").length} 个低风险
          </span>
        </div>
      </div>

      {/* 逐条经历 */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-700 dark:text-slate-300">
          🔍 逐条深挖（{data.experiences.length} 段经历）
        </h4>
        {data.experiences.map((exp) => {
          const style = RISK_STYLES[exp.riskLevel];
          return (
            <div
              key={exp.id}
              className={`rounded-xl border shadow-sm overflow-hidden ${style.border} ${style.bg}`}
            >
              <button
                onClick={() => toggleExpand(exp.id)}
                className="w-full p-4 text-left hover:opacity-80 transition-opacity"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      {exp.experienceTitle}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {exp.originalText}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-medium text-slate-500">
                      {style.label}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {expandedIds.has(exp.id) ? "▲" : "▼"}
                    </span>
                  </div>
                </div>
              </button>

              {expandedIds.has(exp.id) && (
                <div className="px-4 pb-4 space-y-4 border-t border-slate-200 dark:border-slate-700 pt-3 animate-slide-in-right">
                  {/* 风险原因 */}
                  <div>
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                      ⚠️ 为什么有风险
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {exp.riskReason}
                    </p>
                  </div>

                  {/* 面试官可能的问题 */}
                  <div>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      🎯 面试官可能会问
                    </span>
                    <div className="mt-2 space-y-3">
                      {exp.potentialQuestions.map((pq, i) => (
                        <div
                          key={i}
                          className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800"
                        >
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            "{pq.question}"
                          </p>
                          <div className="mt-2 space-y-1 text-xs">
                            <p className="text-slate-400">
                              💡 <span className="font-medium">面试官意图：</span>
                              {pq.whyThisMatters}
                            </p>
                            <p className="text-green-600 dark:text-green-400">
                              ✅ <span className="font-medium">建议回答方向：</span>
                              {pq.suggestedApproach}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 诚实话术 */}
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-100 dark:border-green-900">
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                      🗣️ 诚实但不减分的说法
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {exp.honestReframing}
                    </p>
                  </div>

                  {/* 必记事实 */}
                  <div>
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                      📌 面试前必须记住
                    </span>
                    <ul className="mt-1.5 space-y-1">
                      {exp.keyFactsToRemember.map((fact, i) => (
                        <li
                          key={i}
                          className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-1.5"
                        >
                          <span className="text-purple-500 mt-0.5 flex-shrink-0">•</span>
                          {fact}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
