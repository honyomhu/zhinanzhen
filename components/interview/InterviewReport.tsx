"use client";

import type { InterviewReport as InterviewReportType } from "@/lib/types";

interface InterviewReportProps {
  report: InterviewReportType;
  onClose: () => void;
}

export default function InterviewReport({ report, onClose }: InterviewReportProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getGrade = (score: number) => {
    if (score >= 90) return { label: "优秀", color: "bg-green-500" };
    if (score >= 80) return { label: "良好", color: "bg-blue-500" };
    if (score >= 70) return { label: "中等", color: "bg-yellow-500" };
    if (score >= 60) return { label: "及格", color: "bg-orange-500" };
    return { label: "需提升", color: "bg-red-500" };
  };

  const grade = getGrade(report.overallScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* 头部 */}
        <div className="sticky top-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            📊 面试总结报告
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* 总评分 */}
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(report.overallScore)}`}>
              {report.overallScore}
            </div>
            <span
              className={`inline-block mt-1 px-3 py-1 rounded-full text-sm text-white font-medium ${grade.color}`}
            >
              {grade.label}
            </span>
            <p className="text-xs text-slate-400 mt-1">综合面试评分 / 100</p>
          </div>

          {/* 四维度 */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "relevance", label: "回答相关性" },
              { key: "starUsage", label: "STAR 运用" },
              { key: "specificity", label: "回答具体性" },
              { key: "confidence", label: "表达自信度" },
            ].map((dim) => {
              const score =
                report.dimensionScores[dim.key as keyof typeof report.dimensionScores] || 0;
              return (
                <div
                  key={dim.key}
                  className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800"
                >
                  <div className={`text-2xl font-bold ${getScoreColor(score * 10)}`}>
                    {score}
                  </div>
                  <div className="text-xs text-slate-500">{dim.label}</div>
                </div>
              );
            })}
          </div>

          {/* 优势与不足 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-600 dark:text-green-400 text-sm mb-2">
                ✅ 你的优势
              </h4>
              <ul className="space-y-1">
                {report.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                    <span className="text-green-500">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-orange-600 dark:text-orange-400 text-sm mb-2">
                ⚠️ 需要改进
              </h4>
              <ul className="space-y-1">
                {report.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1">
                    <span className="text-orange-500">•</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 关键收获 */}
          <div>
            <h4 className="font-semibold text-blue-600 dark:text-blue-400 text-sm mb-2">
              💡 关键收获
            </h4>
            <div className="space-y-2">
              {report.keyTakeaways.map((kt, i) => (
                <div
                  key={i}
                  className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-100 dark:border-blue-900 text-sm text-slate-700 dark:text-slate-300"
                >
                  <span className="text-blue-500 font-semibold mr-2">{i + 1}.</span>
                  {kt}
                </div>
              ))}
            </div>
          </div>

          {/* 最终建议 */}
          <div>
            <h4 className="font-semibold text-purple-600 dark:text-purple-400 text-sm mb-2">
              📝 最终建议
            </h4>
            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-4 border border-purple-100 dark:border-purple-900 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {report.finalAdvice}
            </div>
          </div>

          {/* 逐轮分析（折叠） */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 py-2">
              📋 查看逐轮详细分析（{report.roundAnalysis.length} 轮）
            </summary>
            <div className="space-y-3 pt-2">
              {report.roundAnalysis.map((round) => (
                <div
                  key={round.questionNumber}
                  className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">
                      第 {round.questionNumber} 轮
                    </span>
                    <span className={`text-xs font-bold ${getScoreColor(round.evaluation.score * 10)}`}>
                      {round.evaluation.score}/10
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                    <strong>问：</strong>{round.question}
                  </p>
                  <p className="text-xs text-slate-500">
                    <strong>答：</strong>{round.answer}
                  </p>
                  {round.evaluation.highlights.length > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      👍 {round.evaluation.highlights.join("；")}
                    </p>
                  )}
                  {round.evaluation.improvements.length > 0 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      💡 {round.evaluation.improvements.join("；")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
