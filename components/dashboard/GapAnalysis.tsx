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

export default function GapAnalysis({ data }: GapAnalysisProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 整体策略 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-5 border border-purple-100 dark:border-purple-900">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
          📋 总体补课策略
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">{data.overallStrategy}</p>
      </div>

      {/* 优先级排序 */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>补课优先级：</span>
        {data.priorityOrder.map((id, i) => (
          <span key={id} className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {id} {i < data.priorityOrder.length - 1 ? "→" : ""}
          </span>
        ))}
      </div>

      {/* 逐条缺口详情 */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-700 dark:text-slate-300">
          🔧 缺口应对方案
        </h4>
        {data.gapDetails.map((gap) => (
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
