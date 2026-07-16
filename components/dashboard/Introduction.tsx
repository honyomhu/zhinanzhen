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
  // 修正功能
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [refining, setRefining] = useState(false);
  // 存储修正后的版本内容
  const [refinedContents, setRefinedContents] = useState<Record<string, string>>({});

  const currentVersion = data.versions.find((v) => v.type === activeVersion);
  const displayContent =
    refinedContents[activeVersion] || currentVersion?.content || "";

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(type);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
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

  const handleStartEdit = (versionType: string) => {
    setEditingVersion(versionType);
    setFeedbackText("");
  };

  const handleCancelEdit = () => {
    setEditingVersion(null);
    setFeedbackText("");
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim() || !currentVersion) return;
    setRefining(true);
    try {
      const res = await fetch("/api/analyze/refine-intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionType: currentVersion.type,
          versionLabel: currentVersion.label,
          originalContent: currentVersion.content,
          userFeedback: feedbackText,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setRefinedContents((prev) => ({
        ...prev,
        [currentVersion.type]: json.data.content,
      }));
      setEditingVersion(null);
      setFeedbackText("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "修正失败，请重试");
    } finally {
      setRefining(false);
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
            {refinedContents[version.type] && (
              <span className="ml-1 text-xs opacity-70">· 已修正</span>
            )}
          </button>
        ))}
      </div>

      {/* 当前版本内容 */}
      {currentVersion && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                ⏱ {currentVersion.duration}
              </span>
              {refinedContents[activeVersion] && (
                <span className="text-xs text-purple-500 bg-purple-50 dark:bg-purple-950/30 px-2 py-1 rounded-full">
                  已根据你的补充信息修正
                </span>
              )}
            </div>
            <button
              onClick={() => handleCopy(displayContent, currentVersion.type)}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              {copiedId === currentVersion.type ? "✅ 已复制" : "📋 复制"}
            </button>
          </div>

          <div className="prose-custom text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </div>

          {/* 修正入口 */}
          <div className="border-t border-slate-100 dark:border-slate-800 mt-4 pt-4">
            {editingVersion === currentVersion.type ? (
              <div className="space-y-2">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="告诉 AI 哪里不满意，它会重新生成…&#10;例如：这段太模板化了 / 这个项目细节不对，实际是XX / 太啰嗦了精简一点 / 这里不要编造我没有的经历"
                  className="w-full p-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackText.trim() || refining}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {refining ? "AI 修正中..." : "提交修正"}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleStartEdit(currentVersion.type)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-500 transition-colors"
              >
                <span>✏️</span>
                <span>补充个人信息 → AI 重新生成</span>
              </button>
            )}
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
