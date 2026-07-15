"use client";

interface Tab {
  id: string;
  icon: string;
  label: string;
  badge?: number | string;
}

interface DashboardTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function DashboardTabs({
  tabs,
  activeTab,
  onTabChange,
}: DashboardTabsProps) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
      <nav className="flex gap-1 px-1 min-w-max">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium
                border-b-2 -mb-[1px] transition-all duration-200
                whitespace-nowrap
                ${
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`
                    ml-1 text-xs px-1.5 py-0.5 rounded-full
                    ${
                      isActive
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
