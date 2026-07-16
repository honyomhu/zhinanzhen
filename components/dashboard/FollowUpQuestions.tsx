"use client";

import { useState } from "react";

interface FollowUpQuestion {
  id: string;
  type: string;
  question: string;
  keyPoints: string[];
  trapWarning?: string;
  sampleAnswer?: string; // AI 示例回答
}

interface FollowUpQuestionsProps {
  data: { questions: FollowUpQuestion[] };
}

const TYPE_LABELS: Record<string, { label: string; icon: string; bg: string }> = {
  "deep-dive": { label: "深挖型", icon: "🔬", bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  skeptical: { label: "质疑型", icon: "🤔", bg: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  scenario: { label: "场景型", icon: "🎬", bg: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  reflective: { label: "反思型", icon: "🪞", bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

export default function FollowUpQuestions({ data }: FollowUpQuestionsProps) {
  const questions = data.questions || [];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        AI 预测了 <strong className="text-slate-700 dark:text-slate-300">
          {questions.length}
        </strong> 个面试官可能的追问，覆盖{" "}
        <strong className="text-slate-700 dark:text-slate-300">
          {new Set(questions.map((q) => q.type)).size}
        </strong> 种追问类型
      </div>

      {questions.length > 0 ? (
        <div className="space-y-3">
          {questions.map((q) => {
            const typeInfo = TYPE_LABELS[q.type] || TYPE_LABELS["deep-dive"];
            return (
              <QuestionCard key={q.id} question={q} typeInfo={typeInfo} />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">📭</div>
          <p>暂未生成追问，请先完成 STAR 匹配分析</p>
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  typeInfo,
}: {
  question: FollowUpQuestion;
  typeInfo: { label: string; icon: string; bg: string };
}) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <button
        onClick={() => setShowAnswer(!showAnswer)}
        className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0 mt-0.5">{typeInfo.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.bg}`}>
                {typeInfo.label}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {question.question}
            </p>
          </div>
          <span className="text-slate-400 text-xs mt-1 flex-shrink-0">
            {showAnswer ? "▲ 收起" : "▼ 查看要点"}
          </span>
        </div>
      </button>

      {showAnswer && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3 animate-slide-in-right ml-8">
          {/* 回答要点 */}
          <div>
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
              ✅ 回答得分要点
            </span>
            <ul className="mt-1.5 space-y-1">
              {question.keyPoints.map((point, i) => (
                <li
                  key={i}
                  className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-1.5"
                >
                  <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* AI 示例回答 */}
          {question.sampleAnswer && (
            <div>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                💬 AI 示例回答
              </span>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 border border-purple-100 dark:border-purple-900 leading-relaxed whitespace-pre-line">
                {question.sampleAnswer}
              </div>
            </div>
          )}

          {/* 避坑提醒 */}
          {question.trapWarning && (
            <div>
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                🚫 避坑提醒
              </span>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1 bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border border-red-100 dark:border-red-900">
                {question.trapWarning}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
