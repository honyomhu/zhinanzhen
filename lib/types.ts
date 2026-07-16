// ===== 简历相关 =====
export interface ResumeData {
  text: string;
  fileName?: string;
  parseMethod: "upload" | "paste" | "ocr";
  cachedAt: number;
}

// ===== JD 拆解 =====
export interface JDRequirement {
  id: string;
  category: "hard-skill" | "soft-skill" | "experience" | "implicit" | "challenge";
  requirement: string;
  weight: "must-have" | "nice-to-have";
  detail: string;
}

export interface JDBreakdown {
  position: string;
  company?: string;
  summary: string;
  requirements: JDRequirement[];
  coreChallenges: string[];
}

// ===== STAR 匹配 =====
export interface STARStory {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface MatchedExperience {
  requirementId: string;
  requirement: string;
  matched: boolean;
  star?: STARStory;
  relevanceScore?: number; // 1-10
}

export interface GapAdvice {
  requirementId: string;
  requirement: string;
  honestResponse: string;     // 诚实应对话术
  transferableSkills: string; // 可迁移的能力
  quickWins: string[];        // 快速补课建议 (1-3条)
}

export interface MatchResult {
  matched: MatchedExperience[];
  gaps: GapAdvice[];
  overallScore: number; // 1-100
}

// ===== 追问预测 =====
export type QuestionType = "deep-dive" | "skeptical" | "scenario" | "reflective";

export interface FollowUpQuestion {
  id: string;
  type: QuestionType;
  question: string;
  keyPoints: string[]; // 回答得分要点
  trapWarning?: string; // 需要避免的坑
  sampleAnswer?: string; // AI 生成的示例回答
}

export interface FollowUpSet {
  experienceId: string;
  experienceSummary: string;
  questions: FollowUpQuestion[];
}

// ===== 经历打磨 =====
export interface ExperienceRisk {
  id: string;
  experienceTitle: string;       // 简历中的经历名称
  originalText: string;          // 简历原文
  riskLevel: "high" | "medium" | "low"; // 被追问的风险等级
  riskReason: string;            // 为什么有风险
  potentialQuestions: {          // 面试官可能的深挖问题
    question: string;
    whyThisMatters: string;      // 面试官为什么这么问
    suggestedApproach: string;   // 建议的回答方向
  }[];
  honestReframing: string;       // 如果确实有美化，如何诚实但不减分地表述
  keyFactsToRemember: string[];  // 面试前必须记住的关键事实
}

export interface PolishResult {
  experiences: ExperienceRisk[];
  overallRiskLevel: "high" | "medium" | "low";
  overallAdvice: string;         // 整体建议
}

// ===== 自我介绍 =====
export interface IntroductionVersion {
  type: "elevator" | "standard" | "narrative";
  label: string;
  duration: string;
  content: string;
}

export interface IntroductionResult {
  versions: IntroductionVersion[];
  competitiveAdvantages: string[]; // 核心竞争力提炼
}

// ===== 模拟面试 =====
export interface InterviewMessage {
  id: string;
  role: "interviewer" | "user";
  content: string;
  timestamp: number;
}

export interface AnswerEvaluation {
  score: number; // 1-10
  dimensions: {
    relevance: number;     // 相关性：是否正面回答问题
    starUsage: number;     // STAR 结构：是否有情境/任务/行动/结果
    specificity: number;   // 具体性：是否有具体数据和事例
    confidence: number;    // 自信度：表达是否流畅自信
  };
  highlights: string[];    // 回答亮点
  improvements: string[];  // 改进建议
  traps: string[];         // 踩雷提醒
}

export interface InterviewState {
  messages: InterviewMessage[];
  currentQuestion: string;
  round: number;
  maxRounds: number;
  isStarted: boolean;
  isFinished: boolean;
  evaluations: Map<string, AnswerEvaluation>;
}

export interface InterviewReport {
  overallScore: number;
  dimensionScores: {
    relevance: number;
    starUsage: number;
    specificity: number;
    confidence: number;
  };
  strengths: string[];
  weaknesses: string[];
  keyTakeaways: string[];
  roundAnalysis: {
    questionNumber: number;
    question: string;
    answer: string;
    evaluation: AnswerEvaluation;
  }[];
  finalAdvice: string;
}

// ===== 分析状态 =====
export interface AnalysisState {
  resumeData: ResumeData | null;
  jdText: string;
  jdBreakdown: JDBreakdown | null;
  matchResult: MatchResult | null;
  followUpQuestions: FollowUpSet[] | null;
  introduction: IntroductionResult | null;
  activeTab: string;
  isLoading: boolean;
  error: string | null;
}

// ===== API 响应 =====
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
