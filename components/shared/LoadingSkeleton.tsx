"use client";

import { useState, useEffect } from "react";

const STAGES = [
  "正在分析简历与JD的匹配点...",
  "正在生成面试官追问...",
  "正在整理回答要点...",
  "即将完成，请耐心等待...",
];

export default function LoadingSkeleton({
  lines = 5,
  message,
}: {
  lines?: number;
  message?: string;
}) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4 p-6 animate-fade-in">
      {/* 进度提示 */}
      <div className="text-center py-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-full">
          <span className="animate-spin text-blue-500">⏳</span>
          <span className="text-sm text-blue-600 dark:text-blue-400">
            {message || STAGES[stageIndex]}
          </span>
        </div>
      </div>

      {/* 标题骨架 */}
      <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3 animate-pulse" />
      <div className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg w-1/2 animate-pulse" />

      {/* 内容骨架 */}
      <div className="space-y-3 pt-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div
              className="h-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse"
              style={{ width: `${85 - i * 8}%` }}
            />
            <div
              className="h-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg animate-pulse"
              style={{ width: `${60 - i * 5}%` }}
            />
          </div>
        ))}
      </div>

      {/* 卡片骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-32 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
