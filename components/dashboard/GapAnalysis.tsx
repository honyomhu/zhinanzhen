"use client";

import type { APIResponse } from "@/lib/types";

interface GapDetail {
  requirementId: string;
  requirement: string;
  gapLevel: "critical" | "moderate" | "minor";
  honestResponseTemplate: string;
  transferableMapping: {
    availableExperience: string;
    howToFrame: string;
  };
  quickWins: {
    action: string;
    timeEstimate: string;
    whyItHelps: string;
  }[];
}

interface GapAnalysisData {
  gapDetails: GapDetail[];
  priorityOrder: string[];
  overallStrategy: string;
}

interface GapAnalysisProps {
  data: GapAnalysisData;
}

const GAP_LEVEL_STYLES: Record<string, string> = {
  critical: "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20",
  moderate: "border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20",
  minor: "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20",
};

const GAP_LEVEL_LABELS: Record<string, string> = {
  critical: "🔴 关键缺口",
  moderate: "🟡 中等缺口",
  minor: "🔵 轻微缺口",
};

/** 按紧急程度排序：critical > moderate > minor */
const GAP_LEVEL_ORDER: Record<string, number> = {
  critical: 0,
  moderate: 1,
  minor: 2,
};

export default function GapAnalysis({ data }: GapAnalysisProps) {
  // 按紧急程度从高到低排序：关键缺口 → 中等缺口 → 轻微缺口
  const sortedGaps = [...data.gapDetails].sort(
    (a, b) => (GAP_LEVEL_ORDER[a.gapLevel] ?? 99) - (GAP_LEVEL_ORDER[b.gapLevel] ?? 99)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 优先级说明 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-5 border border-purple-100 dark:border-purple-900">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
          📋 补课优先级
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          {data.overallStrategy}
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
            🔴 关键缺口 — 面试官可能因此直接淘汰，优先准备
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">
            🟡 中等缺口 — 可以弥补，充分准备后可过关
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
            🔵 轻微缺口 — 加分项缺失，不影响基本匹配
          </span>
        </div>
      </div>

      {/* 排序后的缺口顺序 */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>👇 按紧急程度排序：</span>
        {sortedGaps.map((gap, i) => (
          <span key={gap.requirementId} className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {gap.requirementId} {i < sortedGaps.length - 1 ? "→" : ""}
          </span>
        ))}
      </div>

      {/* 逐条缺口详情（已按紧急程度排序） */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-700 dark:text-slate-300">
          🔧 缺口应对方案
        </h4>
        {sortedGaps.map((gap) => (
          <div
            key={gap.requirementId}
            className={`rounded-xl p-4 border shadow-sm ${GAP_LEVEL_STYLES[gap.gapLevel]}`}
          >
            <div className="flex items-start gap-2 mb-3">
              <span className="text-sm font-semibold">
                {GAP_LEVEL_LABELS[gap.gapLevel]}
              </span>
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {gap.requirement}
              </span>
            </div>

            {/* 应对话术 */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 mb-3 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                💬 面试应对话术
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {gap.honestResponseTemplate}
              </p>
            </div>

            {/* 能力迁移 */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 mb-3 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                🔄 可迁移的能力
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {gap.transferableMapping.availableExperience}
              </p>
              <p className="text-xs text-slate-500 mt-1 italic">
                💡 面试话术: {gap.transferableMapping.howToFrame}
              </p>
            </div>

            {/* 快速补课 */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                ⚡ 快速补课方案
              </span>
              {gap.quickWins.map((qw, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {qw.action}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      ⏱ {qw.timeEstimate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{qw.whyItHelps}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
