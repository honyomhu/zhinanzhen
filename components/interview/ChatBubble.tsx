"use client";

import type { InterviewMessage } from "@/lib/types";

interface ChatBubbleProps {
  message: InterviewMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isInterviewer = message.role === "interviewer";

  return (
    <div
      className={`flex gap-3 ${isInterviewer ? "" : "flex-row-reverse"} animate-slide-in-${
        isInterviewer ? "left" : "right"
      }`}
    >
      {/* 头像 */}
      <div
        className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg
          ${isInterviewer ? "bg-blue-100 dark:bg-blue-900/30" : "bg-purple-100 dark:bg-purple-900/30"}
        `}
      >
        {isInterviewer ? "🎯" : "👤"}
      </div>

      {/* 气泡 */}
      <div
        className={`
          max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${
            isInterviewer
              ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm"
              : "bg-blue-600 text-white rounded-tr-sm"
          }
        `}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div
          className={`text-xs mt-1 ${
            isInterviewer ? "text-slate-400" : "text-blue-200"
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
