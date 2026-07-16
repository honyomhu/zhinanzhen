"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import JDBreakdown from "@/components/dashboard/JDBreakdown";
import StarMatch from "@/components/dashboard/StarMatch";
import GapAnalysis from "@/components/dashboard/GapAnalysis";
import FollowUpQuestions from "@/components/dashboard/FollowUpQuestions";
import Introduction from "@/components/dashboard/Introduction";
import ExperiencePolish from "@/components/dashboard/ExperiencePolish";
import ProgressBar, { type ModuleStatus } from "@/components/dashboard/ProgressBar";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import ErrorDisplay from "@/components/shared/ErrorDisplay";
import { getCache, setCache } from "@/lib/storage";
import type {
  JDBreakdown as JDBreakdownType,
  MatchResult,
  FollowUpSet,
  IntroductionResult,
  PolishResult,
} from "@/lib/types";

const TABS = [
  { id: "jd", icon: "🔍", label: "JD 拆解" },
  { id: "star", icon: "⭐", label: "STAR 匹配" },
  { id: "polish", icon: "📝", label: "经历打磨" },
  { id: "gap", icon: "🔧", label: "缺口补课" },
  { id: "questions", icon: "💡", label: "追问预测" },
  { id: "intro", icon: "🎤", label: "自我介绍" },
];

export default function DashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("jd");
  const [jdBreakdown, setJDBreakdown] = useState<JDBreakdownType | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [gapData, setGapData] = useState<any>(null);
  const [followUpData, setFollowUpData] = useState<{ questions: any[] } | null>(null);
  const [introData, setIntroData] = useState<IntroductionResult | null>(null);
  const [polishData, setPolishData] = useState<PolishResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 每个模块的分析状态（pending → loading → done/error）
  const [tabStatuses, setTabStatuses] = useState<Record<string, ModuleStatus>>({
    jd: "pending",
    star: "pending",
    polish: "pending",
    gap: "pending",
    questions: "pending",
    intro: "pending",
  });
  const startedAtRef = useRef<number>(0);

  // 用 ref 保存最新值，避免闭包陈旧问题
  const matchResultRef = useRef<MatchResult | null>(null);
  const jdBreakdownRef = useRef<JDBreakdownType | null>(null);
  const resumeTextRef = useRef<string>("");
  const jdTextRef = useRef<string>("");

  // 同步 ref
  useEffect(() => { matchResultRef.current = matchResult; }, [matchResult]);
  useEffect(() => { jdBreakdownRef.current = jdBreakdown; }, [jdBreakdown]);

  // 首次加载时从缓存读取数据
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [companyText, setCompanyText] = useState("");
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const resume = getCache<{ text: string }>("resume_data");
    const jd = getCache<string>("jd_text");
    const company = getCache<string>("company_text");
    if (resume?.text && jd) {
      setResumeText(resume.text);
      resumeTextRef.current = resume.text;
      setJdText(jd);
      jdTextRef.current = jd;
      if (company) setCompanyText(company);
      setHasData(true);
    } else {
      router.push("/");
    }
  }, [router]);

  // ========== 分析管道：按依赖关系尽可能并行启动所有模块 ==========
  // 管道: JD → STAR → GAP ∥ QUESTIONS ∥ INTRO
  const pipelineStarted = useRef(false);

  useEffect(() => {
    if (!hasData || pipelineStarted.current) return;
    pipelineStarted.current = true;
    startedAtRef.current = Date.now();

    const runPipeline = async () => {
      // ---- 阶段 1：JD 拆解 ----
      setTabStatuses((prev) => ({ ...prev, jd: "loading" }));
      let jd: JDBreakdownType | null = getCache<JDBreakdownType>("jd_breakdown");
      if (!jd) {
        try {
          jd = await fetchTabData("jd", null, null);
          setCache("jd_breakdown", jd);
        } catch (e) {
          setTabStatuses((prev) => ({ ...prev, jd: "error" }));
          setErrors((prev) => ({ ...prev, jd: e instanceof Error ? e.message : "JD 拆解失败" }));
          return; // JD 失败则后续都无法进行
        }
      }
      setJDBreakdown(jd);
      jdBreakdownRef.current = jd;
      setTabStatuses((prev) => ({ ...prev, jd: "done" }));

      // ---- 阶段 2：STAR 匹配（依赖 JD） ----
      setTabStatuses((prev) => ({ ...prev, star: "loading" }));
      let match: MatchResult | null = getCache<MatchResult>("match_result");
      if (!match) {
        try {
          match = await fetchTabData("star", null, jd);
          setCache("match_result", match);
        } catch (e) {
          setTabStatuses((prev) => ({ ...prev, star: "error" }));
          setErrors((prev) => ({ ...prev, star: e instanceof Error ? e.message : "STAR 匹配失败" }));
          return; // STAR 失败则后续都无法进行
        }
      }
      setMatchResult(match);
      matchResultRef.current = match;
      setTabStatuses((prev) => ({ ...prev, star: "done" }));

      // ---- 阶段 3：GAP + 追问 + 自我介绍 + 经历打磨 并行启动 ----
      const dependents = [
        { id: "gap" as const, cacheKey: "gap_analysis", fn: () => fetchTabData("gap", match, jd) },
        { id: "questions" as const, cacheKey: "followup_questions", fn: () => fetchTabData("questions", match, jd) },
        { id: "intro" as const, cacheKey: "introduction", fn: () => fetchTabData("intro", match, jd) },
        { id: "polish" as const, cacheKey: "polish_result", fn: () => fetchTabData("polish", null, jd) },
      ];

      setTabStatuses((prev) => ({
        ...prev,
        gap: "loading",
        questions: "loading",
        intro: "loading",
        polish: "loading",
      }));

      await Promise.allSettled(
        dependents.map(async ({ id, cacheKey, fn }) => {
          const cached = getCache<any>(cacheKey);
          if (cached) {
            applyTabData(id, cached);
            setTabStatuses((prev) => ({ ...prev, [id]: "done" }));
            return;
          }
          try {
            const data = await fn();
            setCache(cacheKey, data);
            applyTabData(id, data);
            setTabStatuses((prev) => ({ ...prev, [id]: "done" }));
          } catch (e) {
            setTabStatuses((prev) => ({ ...prev, [id]: "error" }));
            setErrors((prev) => ({
              ...prev,
              [id]: e instanceof Error ? e.message : "加载失败",
            }));
          }
        })
      );
    };

    runPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasData]);

  const getCacheKey = (tabId: string): string => {
    const map: Record<string, string> = {
      jd: "jd_breakdown",
      star: "match_result",
      polish: "polish_result",
      gap: "gap_analysis",
      questions: "followup_questions",
      intro: "introduction",
    };
    return map[tabId] || tabId;
  };

  const applyTabData = (tabId: string, data: any) => {
    switch (tabId) {
      case "jd": setJDBreakdown(data); break;
      case "star": setMatchResult(data); break;
      case "gap": setGapData(data); break;
      case "questions": setFollowUpData(data); break;
      case "intro": setIntroData(data); break;
      case "polish": setPolishData(data); break;
    }
  };

  /**
   * 核心：调用 API（不再负责加载依赖，依赖由预加载保证）
   */
  const fetchTabData = async (
    tabId: string,
    overrideMatch?: MatchResult | null,
    overrideJD?: JDBreakdownType | null
  ) => {
    // 优先用传入的覆盖值，否则从 ref 取最新值
    const currentMatch = overrideMatch !== undefined ? overrideMatch : matchResultRef.current;
    const currentJD = overrideJD !== undefined ? overrideJD : jdBreakdownRef.current;

    const reqs = currentJD?.requirements || [];
    const jdReqsText = reqs
      .map((r) => `[${r.id}] (${r.weight}) ${r.category}: ${r.requirement}`)
      .join("\n");

    switch (tabId) {
      case "jd": {
        const res = await fetch("/api/analyze/jd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jdText, companyText }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data;
      }
      case "star": {
        const res = await fetch("/api/analyze/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jdRequirements: jdReqsText || jdText,
            resumeText: resumeText,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data;
      }
      case "gap": {
        const gaps = currentMatch?.gaps || [];
        const res = await fetch("/api/analyze/gap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gaps, resumeText: resumeText, jdText }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data;
      }
      case "questions": {
        const matched = currentMatch?.matched || [];
        const res = await fetch("/api/analyze/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            starStories: matched,
            resumeText,
            jdText,
            companyText,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data;
      }
      case "intro": {
        const matchedSummary = (currentMatch?.matched || [])
          .map((m) => `${m.requirement}: ${m.star?.result || ""}`)
          .join("\n");
        const res = await fetch("/api/analyze/introduction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText,
            jdText,
            starMatchSummary: matchedSummary,
            companyText,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data;
      }
      case "polish": {
        const res = await fetch("/api/analyze/polish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText, jdText }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        return json.data;
      }
      default:
        throw new Error("未知的 Tab");
    }
  };

  /**
   * 确保需要的依赖数据已就绪（仅读取缓存/状态，不触发 API 调用）
   * 依赖数据由预加载 effect 保证；若尚未就绪则返回 null
   */
  const getReadyDeps = (): {
    jd: JDBreakdownType | null;
    match: MatchResult | null;
  } => {
    const jd = jdBreakdownRef.current ?? getCache<JDBreakdownType>("jd_breakdown");
    const match = matchResultRef.current ?? getCache<MatchResult>("match_result");
    return { jd, match };
  };

  // 强制重新生成（跳过缓存）
  const [forceReload, setForceReload] = useState(0);

  const handleRegenerate = async (tabId: string) => {
    // 清除该 tab 的缓存
    const cacheKey = getCacheKey(tabId);
    try { localStorage.removeItem("jianli_" + cacheKey); } catch {}
    // 清除关联缓存
    if (tabId === "star") {
      try {
        localStorage.removeItem("jianli_followup_questions");
        localStorage.removeItem("jianli_gap_analysis");
        localStorage.removeItem("jianli_introduction");
      } catch {}
      setFollowUpData(null);
      setGapData(null);
      setIntroData(null);
      setTabStatuses((prev) => ({
        ...prev,
        star: "loading",
        gap: "pending",
        questions: "pending",
        intro: "pending",
      }));
    } else {
      setTabStatuses((prev) => ({ ...prev, [tabId]: "loading" }));
    }
    // 清除状态
    applyTabData(tabId, null);
    // 触发重新加载
    setForceReload((n) => n + 1);
  };

  // Tab 切换：优先使用管道已加载的数据；forceReload 时重新拉取
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!resumeText || !jdText) return;

      const cacheKey = getCacheKey(activeTab);

      // 非强制刷新时，优先用管道已缓存的数据
      if (forceReload === 0) {
        const cached = getCache<any>(cacheKey);
        if (cached) {
          applyTabData(activeTab, cached);
          return;
        }
        // 管道正在跑，数据还没就绪 —— 不需要额外操作，等管道完成即可
        return;
      }

      // forceReload > 0：用户点了重新生成
      setLoading(activeTab);
      setErrors((prev) => ({ ...prev, [activeTab]: "" }));

      try {
        const { jd, match } = getReadyDeps();
        const data = await fetchTabData(activeTab, match, jd);
        if (cancelled) return;

        setCache(cacheKey, data);
        applyTabData(activeTab, data);
        setTabStatuses((prev) => ({ ...prev, [activeTab]: "done" }));
      } catch (error) {
        if (cancelled) return;
        const msg = error instanceof Error ? error.message : "加载失败";
        setErrors((prev) => ({ ...prev, [activeTab]: msg }));
        setTabStatuses((prev) => ({ ...prev, [activeTab]: "error" }));
      } finally {
        if (!cancelled) {
          setLoading(null);
          setForceReload(0);
        }
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, hasData, forceReload]);

  // 构建带状态图标的 Tabs
  const tabsWithStatus = TABS.map((tab) => {
    let badge: number | string | undefined;
    if (tab.id === "star" && matchResult) {
      badge = matchResult.matched.length;
    } else if (tab.id === "gap") {
      if (gapData?.gapDetails?.length) {
        badge = gapData.gapDetails.length;
      } else if (matchResult?.gaps?.length) {
        badge = matchResult.gaps.length;
      }
    } else if (tab.id === "questions" && followUpData) {
      badge = followUpData.questions.length;
    } else if (tab.id === "intro" && introData) {
      badge = introData.versions.length;
    } else if (tab.id === "polish" && polishData) {
      badge = polishData.experiences.filter((e) => e.riskLevel === "high").length || undefined;
    }
    return {
      ...tab,
      badge,
      status: tabStatuses[tab.id] as ModuleStatus | undefined,
    };
  });

  if (!hasData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            📊 分析仪表盘
          </h1>
          <p className="text-sm text-slate-500 mt-1">AI 正在并行分析，完成后自动点亮对应模块</p>
        </div>
        <button
          onClick={() => router.push("/interview")}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all shadow-md"
        >
          🤖 开始模拟面试
        </button>
      </div>

      {/* 分析进度条 */}
      <ProgressBar
        modules={TABS.map((t) => ({
          id: t.id,
          icon: t.icon,
          label: t.label,
          status: tabStatuses[t.id],
        }))}
        startedAt={startedAtRef.current || Date.now()}
      />

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <DashboardTabs tabs={tabsWithStatus} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="p-4 sm:p-6 min-h-[400px]">
          {/* JD 拆解 */}
          {activeTab === "jd" && (
            <>
              {loading === "jd" && <LoadingSkeleton lines={6} />}
              {errors.jd && <ErrorDisplay message={errors.jd} onRetry={() => handleRegenerate("jd")} />}
              {!errors.jd && jdBreakdown && (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => handleRegenerate("jd")} className="text-xs text-slate-400 hover:text-blue-500 transition-colors">🔄 重新生成</button>
                  </div>
                  <JDBreakdown data={jdBreakdown} />
                </>
              )}
              {!errors.jd && !jdBreakdown && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">
                    {tabStatuses.jd === "loading" ? "⏳" : "🔍"}
                  </div>
                  <p className="text-slate-400">
                    {tabStatuses.jd === "loading"
                      ? "AI 正在拆解 JD 要求..."
                      : tabStatuses.jd === "pending"
                      ? "等待前置任务完成..."
                      : "正在加载 JD 拆解..."}
                  </p>
                </div>
              )}
            </>
          )}

          {/* STAR 匹配 */}
          {activeTab === "star" && (
            <>
              {loading === "star" && <LoadingSkeleton lines={8} />}
              {errors.star && <ErrorDisplay message={errors.star} onRetry={() => handleRegenerate("star")} />}
              {!errors.star && matchResult && (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => handleRegenerate("star")} className="text-xs text-slate-400 hover:text-blue-500 transition-colors">🔄 重新生成</button>
                  </div>
                  <StarMatch data={matchResult} />
                </>
              )}
              {!errors.star && !matchResult && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">
                    {tabStatuses.star === "loading" ? "⏳" : "⭐"}
                  </div>
                  <p className="text-slate-400">
                    {tabStatuses.star === "loading"
                      ? "AI 正在匹配简历与 JD 要求..."
                      : tabStatuses.star === "pending"
                      ? "等待 JD 拆解完成后自动开始..."
                      : "正在加载 STAR 匹配..."}
                  </p>
                </div>
              )}
            </>
          )}

          {/* 缺口补课 */}
          {activeTab === "gap" && (
            <>
              {loading === "gap" && <LoadingSkeleton lines={6} />}
              {errors.gap && <ErrorDisplay message={errors.gap} onRetry={() => handleRegenerate("gap")} />}
              {!errors.gap && gapData && (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => handleRegenerate("gap")} className="text-xs text-slate-400 hover:text-blue-500 transition-colors">🔄 重新生成</button>
                  </div>
                  <GapAnalysis data={gapData} />
                </>
              )}
              {!errors.gap && !gapData && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">
                    {tabStatuses.gap === "loading" ? "⏳" : "🔧"}
                  </div>
                  <p className="text-slate-400">
                    {tabStatuses.gap === "loading"
                      ? "AI 正在制定补课方案..."
                      : tabStatuses.gap === "pending"
                      ? "等待 STAR 匹配完成后自动开始..."
                      : "正在生成缺口分析..."}
                  </p>
                </div>
              )}
            </>
          )}

          {/* 追问预测 */}
          {activeTab === "questions" && (
            <>
              {loading === "questions" && <LoadingSkeleton lines={5} />}
              {errors.questions && <ErrorDisplay message={errors.questions} onRetry={() => handleRegenerate("questions")} />}
              {!errors.questions && followUpData && (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => handleRegenerate("questions")} className="text-xs text-slate-400 hover:text-blue-500 transition-colors">🔄 重新生成</button>
                  </div>
                  <FollowUpQuestions data={followUpData} />
                </>
              )}
              {!errors.questions && !followUpData && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">
                    {tabStatuses.questions === "loading" ? "⏳" : "💡"}
                  </div>
                  <p className="text-slate-400">
                    {tabStatuses.questions === "loading"
                      ? "AI 正在预测面试追问..."
                      : tabStatuses.questions === "pending"
                      ? "等待 STAR 匹配完成后自动开始..."
                      : "正在生成追问预测..."}
                  </p>
                </div>
              )}
            </>
          )}

          {/* 经历打磨 */}
          {activeTab === "polish" && (
            <>
              {loading === "polish" && <LoadingSkeleton lines={6} />}
              {errors.polish && <ErrorDisplay message={errors.polish} onRetry={() => handleRegenerate("polish")} />}
              {!errors.polish && polishData && (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => handleRegenerate("polish")} className="text-xs text-slate-400 hover:text-blue-500 transition-colors">🔄 重新生成</button>
                  </div>
                  <ExperiencePolish data={polishData} />
                </>
              )}
              {!errors.polish && !polishData && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">
                    {tabStatuses.polish === "loading" ? "⏳" : "📝"}
                  </div>
                  <p className="text-slate-400">
                    {tabStatuses.polish === "loading"
                      ? "AI 正在逐条深挖你的简历经历..."
                      : tabStatuses.polish === "pending"
                      ? "JD 拆解完成后自动开始..."
                      : "正在加载经历打磨..."}
                  </p>
                </div>
              )}
            </>
          )}

          {/* 自我介绍 */}
          {activeTab === "intro" && (
            <>
              {loading === "intro" && <LoadingSkeleton lines={4} />}
              {errors.intro && <ErrorDisplay message={errors.intro} onRetry={() => handleRegenerate("intro")} />}
              {!errors.intro && introData && (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => handleRegenerate("intro")} className="text-xs text-slate-400 hover:text-blue-500 transition-colors">🔄 重新生成</button>
                  </div>
                  <Introduction data={introData} />
                </>
              )}
              {!errors.intro && !introData && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">
                    {tabStatuses.intro === "loading" ? "⏳" : "🎤"}
                  </div>
                  <p className="text-slate-400">
                    {tabStatuses.intro === "loading"
                      ? "AI 正在撰写自我介绍..."
                      : tabStatuses.intro === "pending"
                      ? "等待 STAR 匹配完成后自动开始..."
                      : "正在生成自我介绍..."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
