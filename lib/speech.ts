/**
 * Web Speech API 语音识别工具
 * 使用浏览器内置的 SpeechRecognition API
 */

// 浏览器 SpeechRecognition 类型声明
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export type SpeechStatus = "idle" | "listening" | "error" | "stopped";

export interface SpeechResult {
  transcript: string;
  isFinal: boolean;
}

/**
 * 检查浏览器是否支持语音识别
 */
export function isSpeechSupported(): boolean {
  return !!(
    (typeof window !== "undefined" && window.SpeechRecognition) ||
    window.webkitSpeechRecognition
  );
}

/**
 * 创建语音识别实例
 */
export function createSpeechRecognition(
  options: {
    lang?: string;
    continuous?: boolean;
    interimResults?: boolean;
    onResult?: (result: SpeechResult) => void;
    onStatusChange?: (status: SpeechStatus) => void;
  } = {}
): {
  start: () => void;
  stop: () => void;
  abort: () => void;
} {
  const {
    lang = "zh-CN",
    continuous = true,
    interimResults = true,
    onResult,
    onStatusChange,
  } = options;

  const SpeechRecognitionAPI =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    onStatusChange?.("error");
    return {
      start: () => {},
      stop: () => {},
      abort: () => {},
    };
  }

  const recognition = new SpeechRecognitionAPI();
  recognition.lang = lang;
  recognition.continuous = continuous;
  recognition.interimResults = interimResults;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const resultIndex = event.resultIndex;
    const result = event.results[resultIndex];
    const transcript = result[0]?.transcript || "";

    onResult?.({
      transcript,
      isFinal: result.isFinal,
    });
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error("语音识别错误:", event.error, event.message);
    onStatusChange?.("error");
  };

  recognition.onend = () => {
    onStatusChange?.("stopped");
  };

  return {
    start: () => {
      onStatusChange?.("listening");
      recognition.start();
    },
    stop: () => {
      recognition.stop();
    },
    abort: () => {
      recognition.abort();
    },
  };
}
