"use client";

import { useState } from "react";
import type { MatchResult } from "@/lib/types";

interface StarMatchProps {
  data: MatchResult;
}

export default function StarMatch({ data }: StarMatchProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
    if (score >= 6) return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20";
    return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 总体匹配度 */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 rounded-xl p-5 border border-blue-100 dark:border-blue-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
              总体匹配度
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              您的简历与岗位的整体匹配程度
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {data.overallScore}
            </div>
            <div className="text-xs text-slate-400">/ 100</div>
          </div>
        </div>
        {/* 进度条 */}
        <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-1000"
            style={{ width: `${data.overallScore}%` }}
          />
        </div>
      </div>

      {/* 已匹配经历 */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-700 dark:text-slate-300">
          ✅ 已匹配经历（{data.matched.length} 条）
        </h4>
        {data.matched.map((item) => (
          <div
            key={item.requirementId}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => toggleExpand(item.requirementId)}
              className="w-full p-4 flex items-start gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span className="text-lg flex-shrink-0">
                {expandedIds.has(item.requirementId) ? "📖" : "📘"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm text-slate-800 dark:text-slate-200">
                    {item.requirement}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getScoreColor(
                      item.relevanceScore || 5
                    )}`}
                  >
                    匹配度 {item.relevanceScore}/10
                  </span>
                </div>
              </div>
              <span className="text-slate-400 text-sm">
                {expandedIds.has(item.requirementId) ? "▲" : "▼"}
              </span>
            </button>

            {expandedIds.has(item.requirementId) && item.star && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3 animate-slide-in-right">
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    S · 情境
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {item.star.situation}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3">
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                    T · 任务
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {item.star.task}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                    A · 行动
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {item.star.action}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3">
                  <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                    R · 结果
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {item.star.result}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 未匹配缺口 */}
      {data.gaps.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-slate-700 dark:text-slate-300">
            ⚠️ 待匹配要求（{data.gaps.length} 条）
          </h4>
          {data.gaps.map((gap) => (
            <div
              key={gap.requirementId}
              className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800"
            >
              <div className="flex items-start gap-2">
                <span className="text-yellow-500">⚠️</span>
                <div>
                  <p className="font-medium text-sm text-slate-800 dark:text-slate-200">
                    {gap.requirement}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    简历中暂未找到直接匹配的经历 → 查看"缺口补课"获取应对策略
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
