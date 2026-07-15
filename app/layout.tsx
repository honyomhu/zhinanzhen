import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "职南针 - AI 简历打磨 & 模拟面试",
  description:
    "上传简历和岗位JD，AI帮你深度拆解JD、用STAR法则匹配经历、生成追问预测、打造差异化自我介绍，还能进行AI模拟面试",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
        {/* 顶部导航 */}
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <a href="/" className="flex items-center gap-2 font-bold text-lg">
                <span className="text-2xl">🎯</span>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  职南针
                </span>
              </a>
              <nav className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <a href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  首页
                </a>
                <a href="/dashboard" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  分析仪表盘
                </a>
                <a href="/interview" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  模拟面试
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1">{children}</main>

        {/* 底部 */}
        <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-400">
          职南针 — AI 驱动的简历打磨与面试模拟工具 | 数据仅保存在您的浏览器中
        </footer>
      </body>
    </html>
  );
}
