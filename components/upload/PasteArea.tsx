"use client";

import { useState } from "react";

interface PasteAreaProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  hint?: string;
  minRows?: number;
}

export default function PasteArea({
  label,
  placeholder,
  value,
  onChange,
  hint,
  minRows = 8,
}: PasteAreaProps) {
  const [charCount, setCharCount] = useState(value.length);

  const handleChange = (text: string) => {
    onChange(text);
    setCharCount(text.length);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        rows={minRows}
        className="
          w-full flex-1 min-h-[120px] rounded-xl border border-slate-300 dark:border-slate-600
          bg-white dark:bg-slate-800/50
          px-4 py-3 text-sm
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          resize-y transition-all duration-200
          text-slate-900 dark:text-slate-100
        "
      />
      <div className="flex justify-between items-center text-xs text-slate-400 mt-1.5 flex-shrink-0">
        <span>已输入 {charCount} 字</span>
        <button
          type="button"
          onClick={() => handleChange("")}
          className="hover:text-red-500 transition-colors"
        >
          清空
        </button>
      </div>
    </div>
  );
}
