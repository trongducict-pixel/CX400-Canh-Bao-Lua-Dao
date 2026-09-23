import { Home, BookOpen, AlertOctagon, BrainCircuit, ShieldCheck } from 'lucide-react';

export type NavTab = 'home' | 'stories' | 'alerts' | 'quiz' | 'safety';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadAlertsCount?: number;
}

export function BottomNav({ activeTab, onTabChange, unreadAlertsCount = 0 }: BottomNavProps) {
  const tabs = [
    { id: 'home' as NavTab, label: 'Trang chủ', icon: Home },
    { id: 'stories' as NavTab, label: 'Câu chuyện', icon: BookOpen },
    { id: 'alerts' as NavTab, label: 'Cảnh báo', icon: AlertOctagon, badge: unreadAlertsCount },
    { id: 'quiz' as NavTab, label: 'Quiz', icon: BrainCircuit },
    { id: 'safety' as NavTab, label: 'An toàn', icon: ShieldCheck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-lg pb-safe">
      <div className="max-w-2xl mx-auto grid grid-cols-5 h-16 items-center px-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all relative select-none ${
                isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'bg-blue-100/70 text-blue-700 scale-105' : ''
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[11px] tracking-tight mt-0.5 font-semibold transition-all ${
                  isActive ? 'text-blue-700 font-bold' : 'text-slate-600'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-5 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
