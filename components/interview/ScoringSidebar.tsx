"use client";

import type { AnswerEvaluation } from "@/lib/types";

interface ScoringSidebarProps {
  evaluation: AnswerEvaluation | null;
  isVisible: boolean;
}

export default function ScoringSidebar({ evaluation, isVisible }: ScoringSidebarProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-blue-500";
    if (score >= 4) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-blue-500";
    if (score >= 4) return "bg-yellow-500";
    return "bg-red-500";
  };

  // 暂无评分时的占位状态
  if (!evaluation) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            回答评估
          </p>
          <p className="text-xs text-slate-400 mt-1">
            开始回答后，AI 将在右侧<br />实时展示评分和反馈
          </p>
        </div>

        {/* 四维度骨架 */}
        <div className="space-y-2 opacity-30">
          {["相关性", "STAR 结构", "具体性", "自信度"].map((label) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-400">-</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4 animate-slide-in-right">
      {/* 总分 */}
      <div className="text-center">
        <div className="text-sm text-slate-500 mb-1">本轮得分</div>
        <div className={`text-5xl font-bold ${getScoreColor(evaluation.score)}`}>
          {evaluation.score}
        </div>
        <div className="text-xs text-slate-400">/ 10</div>
      </div>

      {/* 四维度 */}
      <div className="space-y-2">
        {[
          { key: "relevance", label: "相关性" },
          { key: "starUsage", label: "STAR 结构" },
          { key: "specificity", label: "具体性" },
          { key: "confidence", label: "自信度" },
        ].map((dim) => {
          const score =
            evaluation.dimensions[dim.key as keyof typeof evaluation.dimensions] || 0;
          return (
            <div key={dim.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{dim.label}</span>
                <span className={`font-semibold ${getScoreColor(score)}`}>{score}</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getScoreBarColor(score)} transition-all duration-500`}
                  style={{ width: `${score * 10}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 亮点 */}
      {evaluation.highlights.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">
            ✅ 回答亮点
          </h4>
          <ul className="space-y-1">
            {evaluation.highlights.map((h, i) => (
              <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                <span className="text-green-500 mt-0.5">•</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 改进 */}
      {evaluation.improvements.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">
            ⚠️ 改进建议
          </h4>
          <ul className="space-y-1">
            {evaluation.improvements.map((imp, i) => (
              <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                <span className="text-orange-500 mt-0.5">•</span>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 踩雷 */}
      {evaluation.traps.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
            🚫 踩雷提醒
          </h4>
          <ul className="space-y-1">
            {evaluation.traps.map((trap, i) => (
              <li
                key={i}
                className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg p-2 flex items-start gap-1"
              >
                <span className="mt-0.5">💥</span>
                {trap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
