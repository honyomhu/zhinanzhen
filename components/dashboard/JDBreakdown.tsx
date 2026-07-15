"use client";

import type { JDBreakdown as JDBreakdownType } from "@/lib/types";

interface JDBreakdownProps {
  data: JDBreakdownType;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  "hard-skill": { label: "硬技能", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "soft-skill": { label: "软技能", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  experience: { label: "经验要求", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  implicit: { label: "隐性要求", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  challenge: { label: "核心挑战", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function JDBreakdown({ data }: JDBreakdownProps) {
  const mustHave = data.requirements.filter((r) => r.weight === "must-have");
  const niceToHave = data.requirements.filter((r) => r.weight === "nice-to-have");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 岗位概览 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl p-5 border border-blue-100 dark:border-blue-900">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">
          {data.position}
        </h3>
        {data.company && (
          <p className="text-sm text-slate-500 mb-2">🏢 {data.company}</p>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-400">{data.summary}</p>
      </div>

      {/* 权重统计 */}
      <div className="flex gap-4 text-sm">
        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2 border border-red-100 dark:border-red-900">
          <span className="text-red-600 dark:text-red-400 font-semibold">{mustHave.length}</span>
          <span className="text-slate-500 ml-1">Must-have</span>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg px-3 py-2 border border-yellow-100 dark:border-yellow-900">
          <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{niceToHave.length}</span>
          <span className="text-slate-500 ml-1">Nice-to-have</span>
        </div>
      </div>

      {/* 要求列表 */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-700 dark:text-slate-300">📋 详细要求拆解</h4>
        {data.requirements.map((req) => {
          const cat = CATEGORY_LABELS[req.category] || { label: req.category, color: "bg-slate-100 text-slate-600" };
          return (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {req.weight === "must-have" ? "🔴" : "🟡"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}
                    `}>
                      {cat.label}
                    </span>
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${req.weight === "must-have"
                        ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }
                    `}>
                      {req.weight === "must-have" ? "必须满足" : "加分项"}
                    </span>
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                    {req.requirement}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{req.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 核心挑战 */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
          🎯 岗位核心挑战（前3-6个月）
        </h4>
        <ul className="space-y-2">
          {data.coreChallenges.map((challenge, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="text-blue-500 mt-0.5">▪</span>
              {challenge}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
