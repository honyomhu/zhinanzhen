# 🧭 职南针 — AI 简历打磨 & 模拟面试

上传简历 + JD，AI 帮你全方位准备面试：JD 深度拆解 → STAR 法则匹配经历 → 预测面试追问 → 生成差异化自我介绍 → AI 模拟面试实战。

## ✨ 功能

| 模块 | 说明 |
|------|------|
| 🔍 **JD 深度拆解** | 提取硬技能/软技能/经验/隐性要求，标注 Must-have / Nice-to-have |
| ⭐ **STAR 法则匹配** | 逐条匹配简历经历，生成 STAR 话术；匹配不上的给应对话术 + 补课建议 |
| 🔧 **缺口补课** | 针对每项缺失能力，提供面试应对话术、可迁移能力映射、快速补课方案 |
| 💡 **追问预测** | 结合简历细节和公司背景，生成5-7个面试官追问 + 回答要点 + 避坑提醒 |
| 🎤 **自我介绍** | 三版本可选：30秒电梯演讲 / 2分钟标准版 / 故事线版，不重复简历内容 |
| 🤖 **AI 模拟面试** | 从自我介绍开始的深度仿真面试，每轮实时四维度打分 + 反馈，结束出完整报告 |
| 🏢 **公司智能查找** | 输入公司名，AI 自动查找公司背景（业务、产品、文化、面试风格等） |
| 🎙️ **语音输入** | 面试中支持语音转文字（浏览器 Web Speech API） |

## 🛠 技术栈

- **框架**: Next.js 16 (App Router) + TypeScript
- **样式**: Tailwind CSS
- **AI**: DeepSeek API（兼容 OpenAI SDK）
- **文件解析**: pdf-parse / mammoth.js / Tesseract.js（OCR）
- **语音**: Web Speech API（浏览器内置）
- **部署**: Vercel

## 🚀 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 创建 .env.local，填入 DeepSeek API Key
echo "DEEPSEEK_API_KEY=sk-你的key" > .env.local

# 3. 启动
npm run dev

# 4. 打开 http://localhost:3000
```

> DeepSeek API Key 获取：https://platform.deepseek.com/api_keys（支持微信/支付宝充值，约 1 元/百万 token）

## 📦 部署到 Vercel

```bash
npx vercel --prod --yes
```

别忘了在 Vercel 后台设置环境变量 `DEEPSEEK_API_KEY`。

## 📁 项目结构

```
├── app/
│   ├── page.tsx                 # 首页（上传简历 + JD + 公司信息）
│   ├── layout.tsx               # 全局布局
│   ├── dashboard/page.tsx       # 分析仪表盘（5个Tab）
│   ├── interview/page.tsx       # AI 模拟面试室
│   └── api/                     # API 路由
│       ├── parse-resume/        # 文件解析
│       ├── analyze/             # JD拆解/STAR匹配/缺口/追问/自我介绍
│       ├── interview/           # 面试开始/回复/报告
│       └── company-lookup/      # 公司信息智能查找
├── components/
│   ├── upload/                  # 文件上传、粘贴区
│   ├── dashboard/               # 5个分析Tab组件
│   ├── interview/               # 对话、打分、语音、报告
│   └── shared/                  # 加载骨架、错误提示
├── lib/
│   ├── ai.ts                    # DeepSeek API 封装
│   ├── prompts/                 # 7套 AI Prompt 模板
│   ├── parser.ts                # 文件解析
│   ├── storage.ts               # localStorage 缓存
│   ├── speech.ts                # 语音识别
│   └── types.ts                 # 全局类型
└── hooks/                       # 自定义 Hooks
```

## 📄 License

MIT
