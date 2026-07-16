"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatBubble from "./ChatBubble";
import VoiceInput from "./VoiceInput";
import ScoringSidebar from "./ScoringSidebar";
import InterviewReport from "./InterviewReport";
import type {
  InterviewMessage,
  AnswerEvaluation,
  InterviewReport as InterviewReportType,
} from "@/lib/types";

interface InterviewChatProps {
  resumeText: string;
  jdText: string;
  companyText: string;
  matchSummary: string;
}

export default function InterviewChat({
  resumeText,
  jdText,
  companyText,
  matchSummary,
}: InterviewChatProps) {
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [evaluations, setEvaluations] = useState<Map<string, AnswerEvaluation>>(new Map());
  const [latestEvaluation, setLatestEvaluation] = useState<AnswerEvaluation | null>(null);
  const [report, setReport] = useState<InterviewReportType | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 开始面试
  const startInterview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jdText, companyText, matchSummary }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const firstMessage: InterviewMessage = {
        id: "msg_0",
        role: "interviewer",
        content: json.data.openingMessage,
        timestamp: Date.now(),
      };

      setMessages([firstMessage]);
      setCurrentRound(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "开始面试失败");
    } finally {
      setIsLoading(false);
    }
  }, [resumeText, jdText, matchSummary]);

  // 发送回答（或求助）
  const sendMessage = useCallback(async (overrideAction?: "need_hint" | "need_example") => {
    const text = inputText.trim();
    const action = overrideAction || "answer";
    if (!text && action === "answer") return;
    if (isLoading) return;

    const displayText = action === "need_hint" ? "💡 能给我一点提示吗？" :
                        action === "need_example" ? "📖 可以示范一下怎么回答吗？" : text;

    const userMessage: InterviewMessage = {
      id: `msg_${messages.length}`,
      role: "user",
      content: displayText,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    setIsLoading(true);
    setError(null);

    try {
      const history = newMessages
        .map((m) => `${m.role === "interviewer" ? "面试官" : "候选人"}: ${m.content}`)
        .join("\n");

      const res = await fetch("/api/interview/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory: history,
          userAnswer: text,
          currentRound: currentRound + 1,
          jdText,
          companyText,
          matchSummary,
          action,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const { mode, feedback, nextQuestion, shouldEnd, endMessage, coachMessage } = json.data;

      if (shouldEnd && endMessage) {
        const endMsg: InterviewMessage = {
          id: `msg_${newMessages.length}`,
          role: "interviewer",
          content: endMessage,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, endMsg]);
        setIsFinished(true);
      } else if (mode === "coach" && coachMessage) {
        // 教练模式：给出提示或示范，等待用户重新回答
        const coachMsg: InterviewMessage = {
          id: `msg_${newMessages.length}`,
          role: "interviewer",
          content: coachMessage,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, coachMsg]);
        // 不增加 round，让用户对同一个问题重新回答
      } else if (nextQuestion) {
        // 正常模式：反馈 + 下一题
        const aiMsg: InterviewMessage = {
          id: `msg_${newMessages.length}`,
          role: "interviewer",
          content: feedback ? `${feedback}\n\n${nextQuestion}` : nextQuestion,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setCurrentRound((r) => r + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "回复失败");
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, messages, currentRound, jdText, matchSummary]);

  const sendAnswer = useCallback(() => sendMessage(), [sendMessage]);
  const askForHint = useCallback(() => sendMessage("need_hint"), [sendMessage]);
  const askForExample = useCallback(() => sendMessage("need_example"), [sendMessage]);

  // 生成报告
  const generateReport = useCallback(async () => {
    setIsLoading(true);

    try {
      const history = messages
        .map((m) => `${m.role === "interviewer" ? "面试官" : "候选人"}: ${m.content}`)
        .join("\n");

      const res = await fetch("/api/interview/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory: history,
          matchSummary,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setReport(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成报告失败");
    } finally {
      setIsLoading(false);
    }
  }, [messages, matchSummary]);

  // 自动滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 自动聚焦输入框
  useEffect(() => {
    if (!isLoading && !isFinished && messages.length > 0) {
      inputRef.current?.focus();
    }
  }, [isLoading, isFinished, messages.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  };

  const handleVoiceTranscript = (text: string, _isFinal: boolean) => {
    setInputText(text);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)] min-h-[500px]">
      {/* 对话区 */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="text-6xl">🤖</div>
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">
                  准备开始 AI 模拟面试
                </h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  AI 面试官将根据您的简历和目标岗位进行深度追问。
                  从自我介绍开始，全程约 10-15 轮对话。
                </p>
                <button
                  onClick={startInterview}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
                >
                  {isLoading ? "⏳ 准备中..." : "🎯 开始面试"}
                </button>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {/* 加载中 */}
          {isLoading && (
            <div className="flex gap-3 animate-slide-in-left">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg">
                🎯
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* 错误 */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline">关闭</button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* 输入区 */}
        {messages.length > 0 && !isFinished && (
          <div className="border-t border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-end gap-2">
              <VoiceInput
                onTranscript={handleVoiceTranscript}
                disabled={isLoading}
              />
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的回答... (Enter 发送，Shift+Enter 换行)"
                rows={2}
                disabled={isLoading}
                className="flex-1 resize-none rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100"
              />
              <button
                onClick={sendAnswer}
                disabled={isLoading || !inputText.trim()}
                className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                发送
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={askForHint}
                disabled={isLoading}
                className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors"
              >
                💡 给我提示
              </button>
              <button
                onClick={askForExample}
                disabled={isLoading}
                className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/40 transition-colors"
              >
                📖 给我示范
              </button>
            </div>
          </div>
        )}

        {/* 结束后的操作 */}
        {isFinished && !report && (
          <div className="border-t border-slate-200 dark:border-slate-800 p-4 text-center">
            <button
              onClick={generateReport}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? "⏳ 生成中..." : "📊 查看面试报告"}
            </button>
          </div>
        )}

        {isFinished && report && (
          <div className="border-t border-slate-200 dark:border-slate-800 p-4 text-center">
            <button
              onClick={() => setReport(null)}
              className="px-4 py-2 text-sm text-blue-600 hover:underline"
            >
              📊 重新查看报告
            </button>
          </div>
        )}
      </div>

      {/* 评分侧边栏 — 始终占位，避免布局跳动 */}
      <div className="hidden lg:block w-72 flex-shrink-0 overflow-y-auto">
        <ScoringSidebar
          evaluation={latestEvaluation}
          isVisible={true}
        />
      </div>

      {/* 面试报告弹窗 */}
      {report && (
        <InterviewReport report={report} onClose={() => setReport(null)} />
      )}
    </div>
  );
}
