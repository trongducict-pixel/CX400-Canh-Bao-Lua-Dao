import { Shield, Bell } from 'lucide-react';

interface HeaderProps {
  onOpenAlerts: () => void;
  activeAlertsCount?: number;
}

export function Header({
  onOpenAlerts,
  activeAlertsCount = 0,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-md sm:max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Zone: 🛡️ CX400 - Cảnh giác lừa đảo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-700 to-sky-600 flex items-center justify-center text-white shadow-md shadow-blue-900/15 shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight text-blue-950">CX400</span>
              <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded-sm border border-sky-200">
                VietinBank Ninh Bình
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 leading-tight">
              Cảnh giác lừa đảo
            </p>
          </div>
        </div>

        {/* Minimal Customer Action: Bell Notification */}
        <button
          onClick={onOpenAlerts}
          className="relative w-11 h-11 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors active:scale-95 border border-slate-200/70"
          aria-label="Cảnh báo mới"
          title="Xem cảnh báo mới nhất"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          {activeAlertsCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white ring-2 ring-white">
              {activeAlertsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
