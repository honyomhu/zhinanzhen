"use client";

export type ModuleStatus = "pending" | "loading" | "done" | "error";

interface ModuleProgress {
  id: string;
  icon: string;
  label: string;
  status: ModuleStatus;
}

interface ProgressBarProps {
  modules: ModuleProgress[];
  startedAt: number; // Date.now() when analysis started
}

const STATUS_ICON: Record<ModuleStatus, string> = {
  pending: "○",
  loading: "⏳",
  done: "✅",
  error: "❌",
};

const STATUS_COLOR: Record<ModuleStatus, string> = {
  pending: "text-slate-300 dark:text-slate-600",
  loading: "text-blue-500 animate-pulse",
  done: "text-green-500",
  error: "text-red-500",
};

export default function ProgressBar({ modules, startedAt }: ProgressBarProps) {
  const doneCount = modules.filter((m) => m.status === "done").length;
  const errorCount = modules.filter((m) => m.status === "error").length;
  const total = modules.length;
  const progress = Math.round(((doneCount + errorCount) / total) * 100);
  const allDone = doneCount + errorCount === total;

  // 预计剩余时间（粗略估算：每个未完成模块约 15-25 秒）
  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  const remaining = Math.max(0, Math.round(((total - doneCount - errorCount) * 20)));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
      {/* 状态文案 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {allDone ? (
            <>
              <span className="text-lg">🎉</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                分析完成 · 共 {doneCount}/{total} 个模块
              </span>
            </>
          ) : (
            <>
              <span className="text-lg">⚡</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                正在分析中 · {doneCount}/{total} 模块完成
              </span>
              {remaining > 0 && (
                <span className="text-xs text-slate-400">
                  预计剩余约 {remaining} 秒
                </span>
              )}
            </>
          )}
        </div>
        <span className="text-xs font-mono text-slate-400">
          {progress}% · 已用 {elapsed}s
        </span>
      </div>

      {/* 进度条 */}
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 每个模块的状态 */}
      <div className="flex flex-wrap gap-3 text-xs">
        {modules.map((mod) => (
          <span
            key={mod.id}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-medium transition-colors ${
              STATUS_COLOR[mod.status]
            } ${
              mod.status === "done"
                ? "bg-green-50 dark:bg-green-950/30"
                : mod.status === "loading"
                ? "bg-blue-50 dark:bg-blue-950/30"
                : mod.status === "error"
                ? "bg-red-50 dark:bg-red-950/30"
                : "bg-slate-50 dark:bg-slate-800"
            }`}
          >
            <span>{STATUS_ICON[mod.status]}</span>
            <span>{mod.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
