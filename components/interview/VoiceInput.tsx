"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { isSpeechSupported, createSpeechRecognition, type SpeechStatus } from "@/lib/speech";

interface VoiceInputProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [interimText, setInterimText] = useState("");
  const recognizerRef = useRef<ReturnType<typeof createSpeechRecognition> | null>(null);
  const fullTranscriptRef = useRef("");

  const supported = isSpeechSupported();

  const handleResult = useCallback(
    (result: { transcript: string; isFinal: boolean }) => {
      if (result.isFinal) {
        fullTranscriptRef.current += result.transcript;
        setInterimText("");
        onTranscript(fullTranscriptRef.current, true);
      } else {
        setInterimText(result.transcript);
        onTranscript(fullTranscriptRef.current + result.transcript, false);
      }
    },
    [onTranscript]
  );

  const startListening = useCallback(() => {
    fullTranscriptRef.current = "";
    setInterimText("");

    recognizerRef.current = createSpeechRecognition({
      lang: "zh-CN",
      continuous: true,
      interimResults: true,
      onResult: handleResult,
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus === "stopped" || newStatus === "error") {
          fullTranscriptRef.current = "";
          setInterimText("");
        }
      },
    });

    recognizerRef.current.start();
  }, [handleResult]);

  const stopListening = useCallback(() => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      recognizerRef.current?.abort();
    };
  }, []);

  if (!supported) {
    return null;
  }

  const isListening = status === "listening";

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* 录音中动画 */}
      {isListening && (
        <div className="flex items-center gap-1 px-2">
          <span className="text-red-500 text-xs animate-pulse">● 录音中</span>
          {interimText && (
            <span className="text-xs text-slate-400 max-w-[120px] truncate">
              {interimText}
            </span>
          )}
        </div>
      )}

      {/* 按钮 */}
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          transition-all duration-200
          ${
            isListening
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        title={isListening ? "停止录音" : "语音输入"}
      >
        🎙️
      </button>
    </div>
  );
}
