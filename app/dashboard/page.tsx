"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import JDBreakdown from "@/components/dashboard/JDBreakdown";
import StarMatch from "@/components/dashboard/StarMatch";
import GapAnalysis from "@/components/dashboard/GapAnalysis";
import FollowUpQuestions from "@/components/dashboard/FollowUpQuestions";
import Introduction from "@/components/dashboard/Introduction";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import ErrorDisplay from "@/components/shared/ErrorDisplay";
import { getCache, setCache } from "@/lib/storage";
import type {
  JDBreakdown as JDBreakdownType,
  MatchResult,
  FollowUpSet,
  IntroductionResult,
} from "@/lib/types";

const TABS = [
  { id: "jd", icon: "🔍", label: "JD 拆解" },
  { id: "star", icon: "⭐", label: "STAR 匹配" },
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
  const [loading, setLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const getCacheKey = (tabId: string): string => {
    const map: Record<string, string> = {
      jd: "jd_breakdown",
      star: "match_result",
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
    }
  };

  /**
   * 核心：调用 API，使用 ref 获取最新数据，避免闭包陈旧问题
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
      default:
        throw new Error("未知的 Tab");
    }
  };

  /**
   * 确保前置依赖就绪，返回最新数据
   */
  const ensureDependencies = async (): Promise<{
    jd: JDBreakdownType | null;
    match: MatchResult | null;
  }> => {
    let jd = jdBreakdownRef.current;
    let match = matchResultRef.current;

    // 加载 JD
    if (!jd) {
      jd = getCache<JDBreakdownType>("jd_breakdown");
      if (jd) {
        setJDBreakdown(jd);
        jdBreakdownRef.current = jd;
      } else {
        jd = await fetchTabData("jd", null, null);
        setCache("jd_breakdown", jd);
        setJDBreakdown(jd);
        jdBreakdownRef.current = jd;
      }
    }

    // 加载 STAR 匹配（需要 JD 做参数）
    if (!match) {
      match = getCache<MatchResult>("match_result");
      if (match) {
        setMatchResult(match);
        matchResultRef.current = match;
      } else {
        match = await fetchTabData("star", null, jd);
        setCache("match_result", match);
        setMatchResult(match);
        matchResultRef.current = match;
      }
    }

    return { jd, match };
  };

  // 强制重新生成（跳过缓存）
  const [forceReload, setForceReload] = useState(0);

  const handleRegenerate = (tabId: string) => {
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
    }
    // 清除状态
    applyTabData(tabId, null);
    // 触发重新加载
    setForceReload((n) => n + 1);
  };

  // Tab 切换时加载
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!resumeText || !jdText) return;

      const cacheKey = getCacheKey(activeTab);
      const cached = getCache<any>(cacheKey);

      if (cached && forceReload === 0) {
        applyTabData(activeTab, cached);
        return;
      }

      setLoading(activeTab);
      setErrors((prev) => ({ ...prev, [activeTab]: "" }));

      try {
        let jd: JDBreakdownType | null = null;
        let match: MatchResult | null = null;

        // 需要依赖的 tab 先确保前置数据就绪
        if (["gap", "questions", "intro", "star"].includes(activeTab)) {
          const deps = await ensureDependencies();
          jd = deps.jd;
          match = deps.match;
        }

        if (cancelled) return;

        // questions/gap/intro 需要 match 数据，star/jd 不需要
        const data = await fetchTabData(activeTab, match, jd);
        if (cancelled) return;

        setCache(cacheKey, data);
        applyTabData(activeTab, data);
      } catch (error) {
        if (cancelled) return;
        const msg = error instanceof Error ? error.message : "加载失败";
        setErrors((prev) => ({ ...prev, [activeTab]: msg }));
      } finally {
        if (!cancelled) setLoading(null);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [activeTab, hasData, forceReload]);

  // 计算 badge 数量（优先用实际加载数据，确保数字一致）
  const tabsWithBadges = TABS.map((tab) => {
    let badge: number | string | undefined;
    if (tab.id === "star" && matchResult) {
      badge = matchResult.matched.length;
    } else if (tab.id === "gap") {
      // 优先用 gapData，其次用 matchResult.gaps
      if (gapData?.gapDetails?.length) {
        badge = gapData.gapDetails.length;
      } else if (matchResult?.gaps?.length) {
        badge = matchResult.gaps.length;
      }
    } else if (tab.id === "questions" && followUpData) {
      badge = followUpData.questions.length;
    } else if (tab.id === "intro" && introData) {
      badge = introData.versions.length;
    }
    return { ...tab, badge };
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
          <p className="text-sm text-slate-500 mt-1">点击下方标签查看 AI 分析结果</p>
        </div>
        <button
          onClick={() => router.push("/interview")}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
        >
          🤖 开始模拟面试
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <DashboardTabs tabs={tabsWithBadges} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="p-4 sm:p-6 min-h-[400px]">
          {/* JD 拆解 */}
          {activeTab === "jd" && (
            <>
              {loading === "jd" && <LoadingSkeleton lines={6} />}
              {errors.jd && <ErrorDisplay message={errors.jd} onRetry={() => setForceReload(n => n + 1)} />}
              {!loading && !errors.jd && jdBreakdown && (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => handleRegenerate("jd")} className="text-xs text-slate-400 hover:text-blue-500 transition-colors">🔄 重新生成</button>
                  </div>
                  <JDBreakdown data={jdBreakdown} />
                </>
              )}
              {!loading && !errors.jd && !jdBreakdown && (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-3">🔍</div>
                  <p>正在加载 JD 拆解...</p>
                </div>
              )}
            </>
          )}

          {/* STAR 匹配 */}
          {activeTab === "star" && (
            <>
              {loading === "star" && <LoadingSkeleton lines={8} />}
              {errors.star && <ErrorDisplay message={errors.star} onRetry={() => setForceReload(n => n + 1)} />}
              {!loading && !errors.star && matchResult && (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => handleRegenerate("star")} className="text-xs text-slate-400 hover:text-blue-500 transition-colors">🔄 重新生成</button>
                  </div>
                  <StarMatch data={matchResult} />
                </>
              )}
              {!loading && !errors.star && !matchResult && (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-3">⭐</div>
                  <p>正在加载 STAR 匹配...</p>
                </div>
              )}
            </>
          )}

          {/* 缺口补课 */}
          {activeTab === "gap" && (
            <>
              {loading === "gap" && <LoadingSkeleton lines={6} />}
              {errors.gap && <ErrorDisplay message={errors.gap} onRetry={() => setForceReload(n => n + 1)} />}
              {!loading && !errors.gap && gapData && (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => handleRegenerate("gap")} className="text-xs text-slate-400 hover:text-blue-500 transition-colors">🔄 重新生成</button>
                  </div>
                  <GapAnalysis data={gapData} />
                </>
              )}
              {!loading && !errors.gap && !gapData && (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-3">🔧</div>
                  <p>正在生成缺口分析...</p>
                </div>
              )}
            </>
          )}

          {/* 追问预测 */}
          {activeTab === "questions" && (
            <>
              {loading === "questions" && <LoadingSkeleton lines={5} />}
              {errors.questions && <ErrorDisplay message={errors.questions} onRetry={() => setForceReload(n => n + 1)} />}
              {!loading && !errors.questions && followUpData && (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => handleRegenerate("questions")} className="text-xs text-slate-400 hover:text-blue-500 transition-colors">🔄 重新生成</button>
                  </div>
                  <FollowUpQuestions data={followUpData} />
                </>
              )}
              {!loading && !errors.questions && !followUpData && (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-3">💡</div>
                  <p>正在生成追问预测...</p>
                </div>
              )}
            </>
          )}

          {/* 自我介绍 */}
          {activeTab === "intro" && (
            <>
              {loading === "intro" && <LoadingSkeleton lines={4} />}
              {errors.intro && <ErrorDisplay message={errors.intro} onRetry={() => setForceReload(n => n + 1)} />}
              {!loading && !errors.intro && introData && (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => handleRegenerate("intro")} className="text-xs text-slate-400 hover:text-blue-500 transition-colors">🔄 重新生成</button>
                  </div>
                  <Introduction data={introData} />
                </>
              )}
              {!loading && !errors.intro && !introData && (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-3">🎤</div>
                  <p>正在生成自我介绍...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
