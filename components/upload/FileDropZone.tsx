"use client";

import { useState, useRef, useCallback } from "react";

interface FileDropZoneProps {
  onFileParsed: (text: string, fileName: string, parseMethod: string) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

const ACCEPTED_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt,.md,.csv",
  "image/jpeg": ".jpg,.jpeg",
  "image/png": ".png",
};

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

export default function FileDropZone({
  onFileParsed,
  onError,
  isLoading,
  onLoadingChange,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        onError(`文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），请上传小于 4MB 的文件`);
        return;
      }

      setFileName(file.name);
      onLoadingChange(true);

      try {
        const fileExt = file.name.split(".").pop()?.toLowerCase();

        // 图片文件在客户端用 OCR 处理
        if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(fileExt || "")) {
          const { default: Tesseract } = await import("tesseract.js");
          const imageUrl = URL.createObjectURL(file);
          const result = await Tesseract.recognize(imageUrl, "chi_sim+eng", {
            logger: () => {}, // 静默
          });
          URL.revokeObjectURL(imageUrl);
          const text = result.data.text?.trim() || "";
          if (!text) {
            throw new Error("图片中未识别到文字，请确保图片清晰且包含文字内容");
          }
          onFileParsed(text, file.name, "ocr");
          return;
        }

        // PDF / DOCX / TXT 发送到服务端解析
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "文件解析失败");
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "文件解析失败");
        }

        onFileParsed(data.data.text, data.data.fileName, data.data.parseMethod);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "文件处理失败，请重试";
        onError(message);
        setFileName(null);
      } finally {
        onLoadingChange(false);
      }
    },
    [onFileParsed, onError, onLoadingChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // 重置 input 以便重新选择同一文件
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleFile]
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          }
          ${isLoading ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={Object.values(ACCEPTED_TYPES).join(",")}
          onChange={handleInputChange}
          className="hidden"
        />

        {isLoading ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <svg
                className="animate-spin h-8 w-8 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <p className="text-sm text-slate-500">
              正在解析{fileName ? ` "${fileName}"` : ""}...
            </p>
          </div>
        ) : fileName ? (
          <div className="space-y-2">
            <div className="text-4xl">📄</div>
            <p className="font-medium text-slate-700 dark:text-slate-300">{fileName}</p>
            <p className="text-xs text-slate-400">点击或拖拽以重新选择文件</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📤</div>
            <p className="font-medium text-slate-600 dark:text-slate-400">
              点击上传或拖拽简历文件到此处
            </p>
            <p className="text-xs text-slate-400">
              支持 PDF、DOCX、TXT、JPG、PNG 格式，文件不超过 4MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
