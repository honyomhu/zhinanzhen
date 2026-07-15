"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FileDropZone from "@/components/upload/FileDropZone";
import PasteArea from "@/components/upload/PasteArea";
import { setCache, getCache } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();

  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [companyText, setCompanyText] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [resumeSource, setResumeSource] = useState<{
    fileName?: string;
    parseMethod?: string;
  }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 从缓存恢复数据
  useEffect(() => {
    const cachedResume = getCache<{ text: string; fileName?: string; parseMethod?: string }>("resume_data");
    const cachedJD = getCache<string>("jd_text");

    if (cachedResume) {
      setResumeText(cachedResume.text);
      setResumeSource({
        fileName: cachedResume.fileName,
        parseMethod: cachedResume.parseMethod,
      });
    }
    if (cachedJD) setJdText(cachedJD);
    const cachedCompany = getCache<string>("company_text");
    if (cachedCompany) setCompanyText(cachedCompany);
  }, []);

  const handleFileParsed = (text: string, fileName: string, parseMethod: string) => {
    setResumeText(text);
    setResumeSource({ fileName, parseMethod });
    setError(null);
    setCache("resume_data", { text, fileName, parseMethod });
    clearAnalysisCache();
  };

  const handleError = (msg: string) => {
    setError(msg);
  };

  const clearAnalysisCache = () => {
    const keys = ["jd_breakdown", "match_result", "followup_questions", "introduction"];
    keys.forEach((k) => {
      try { localStorage.removeItem("jianli_" + k); } catch {}
    });
  };

  // AI 查找公司信息
  const handleCompanyLookup = async () => {
    const name = companyName.trim();
    if (name.length < 2) return;

    setIsLookingUp(true);
    setLookupError(null);

    try {
      const res = await fetch("/api/company-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: name }),
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.error);

      setCompanyText(json.data.formattedText);
      setCache("company_text", json.data.formattedText);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "查找失败");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAnalyze = () => {
    if (!resumeText.trim()) {
      setError("请先上传简历或粘贴简历内容");
      return;
    }
    if (!jdText.trim()) {
      setError("请粘贴目标岗位的 JD 内容");
      return;
    }
    setCache("jd_text", jdText);
    router.push("/dashboard");
  };

  const canAnalyze = resumeText.trim() && jdText.trim() && !isUploading;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fade-in overflow-hidden">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            职南针
          </span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          上传简历 + 粘贴 JD，AI 帮你深度拆解岗位要求、用 STAR 法则匹配经历、
          预测面试追问、打造差异化自我介绍，还能进行 AI 模拟面试
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3 animate-slide-in-right">
          <span className="text-red-500 text-lg flex-shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* 三栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左栏：简历上传 */}
        <div className="min-w-0 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">
              上传简历
            </h2>
            {resumeSource.parseMethod && (
              <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                ✓ 已{resumeSource.parseMethod === "ocr" ? "识别" : "解析"}
                {resumeSource.fileName ? ` (${resumeSource.fileName})` : ""}
              </span>
            )}
          </div>

          <FileDropZone
            onFileParsed={handleFileParsed}
            onError={handleError}
            isLoading={isUploading}
            onLoadingChange={setIsUploading}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">
                或者直接粘贴
              </span>
            </div>
          </div>

          <div className="flex-1">
            <PasteArea
              label="简历内容"
              placeholder="在此粘贴您的简历全文..."
              value={resumeText}
              onChange={(text) => {
                setResumeText(text);
                setResumeSource({});
                if (text.trim()) {
                  setCache("resume_data", { text, parseMethod: "paste" });
                  clearAnalysisCache();
                }
                setError(null);
              }}
              hint="粘贴后自动保存"
            />
          </div>
        </div>

        {/* 中栏：JD 输入 */}
        <div className="min-w-0 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">
              目标岗位 JD
            </h2>
          </div>

          <div className="flex-1">
            <PasteArea
              label="职位描述"
              placeholder="在此粘贴目标岗位的 JD（职位描述）..."
              value={jdText}
              onChange={(text) => {
                setJdText(text);
                if (text.trim()) {
                  setCache("jd_text", text);
                }
                setError(null);
              }}
            />
          </div>
        </div>

        {/* 右栏：公司信息 */}
        <div className="min-w-0 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-200">
              目标公司
            </h2>
            <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
              选填
            </span>
          </div>

          {/* 公司名 + AI查找 */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              公司名称
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCompanyLookup()}
                placeholder="输入公司名，如：字节跳动、华为..."
                className="flex-1 min-w-0 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100"
              />
              <button
                onClick={handleCompanyLookup}
                disabled={isLookingUp || companyName.trim().length < 2}
                className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:text-slate-500 disabled:shadow-none transition-all whitespace-nowrap"
              >
                {isLookingUp ? (
                  <span className="flex items-center gap-1.5">
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    查找中
                  </span>
                ) : (
                  "🔍 AI 查找"
                )}
              </button>
            </div>
            {lookupError && (
              <p className="text-xs text-red-500">{lookupError}</p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">
                或手动填写
              </span>
            </div>
          </div>

          <div className="flex-1">
            <PasteArea
              label="公司详情"
              placeholder="AI 查找后会自动填入，也可以手动修改..."
              value={companyText}
              onChange={(text) => {
                setCompanyText(text);
                if (text.trim()) {
                  setCache("company_text", text);
                } else {
                  try { localStorage.removeItem("jianli_company_text"); } catch {}
                }
                setError(null);
              }}
              hint="AI 查找结果会自动填入此处，可自行修改补充"
            />
          </div>
        </div>
      </div>

      {/* 开始分析按钮 */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className={`
            inline-flex items-center justify-center
            px-8 sm:px-12 py-4 rounded-2xl text-lg font-bold
            transition-all duration-200
            ${
              canAnalyze
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            }
          `}
        >
          {canAnalyze ? "🚀 开始智能分析" : "请先填写简历和 JD"}
        </button>
      </div>
      <p className="text-xs text-slate-400 text-center mt-3">
        分析可能需要 30-60 秒，AI 将深度处理您的信息
      </p>

      {/* 功能介绍 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-6">
        {[
          { icon: "🔍", title: "JD 拆解", desc: "提取关键能力与隐性要求" },
          { icon: "⭐", title: "STAR 匹配", desc: "用 STAR 法则整理经历" },
          { icon: "💡", title: "追问预测", desc: "面试官会怎么追问你" },
          { icon: "🎤", title: "自我介绍", desc: "三个版本差异化介绍" },
          { icon: "🤖", title: "AI 模拟面试", desc: "深度仿真面试实战" },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center space-y-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <div className="text-3xl">{item.icon}</div>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              {item.title}
            </h3>
            <p className="text-xs text-slate-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
