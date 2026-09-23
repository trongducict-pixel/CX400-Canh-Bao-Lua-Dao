import { PhoneCall, ShieldCheck } from 'lucide-react';
import { SystemSettings } from '../types';

interface HeaderProps {
  settings: SystemSettings;
  onGoHome?: () => void;
  onOpenSos?: () => void;
}

export const VIETINBANK_LOGO_URL =
  'https://raw.githubusercontent.com/giadinhbanker/anh-super-app-bac-phu-tho/main/Logo%20VietinBank.png';

export function Header({ settings, onGoHome, onOpenSos }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#004B87]/15 shadow-xs transition-all">
      {/* Top micro brand ribbon */}
      <div className="bg-gradient-to-r from-[#003B70] via-[#004B87] to-[#00A3E0] text-white text-[10px] sm:text-[11px] font-semibold py-1 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="flex items-center gap-1.5 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold">NGÂN HÀNG TMCP CÔNG THƯƠNG VIỆT NAM</span>
            <span className="hidden sm:inline text-white/70">|</span>
            <span className="hidden sm:inline text-white/90">Chi nhánh Ninh Bình</span>
          </span>
          <span className="flex items-center gap-1 text-white/90 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden xs:inline">Hệ thống bảo vệ</span> chính thống
          </span>
        </div>
      </div>

      {/* Main Headbar */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
        {/* Left: VietinBank Official Logo */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          role="button"
          tabIndex={0}
          title="Trang chủ VietinBank CX400"
        >
          <div className="h-9 sm:h-10 flex items-center justify-center p-1 rounded-xl bg-white group-hover:opacity-95 transition-opacity">
            <img
              src={VIETINBANK_LOGO_URL}
              alt="VietinBank - Nâng giá trị cuộc sống"
              className="h-7 sm:h-8 w-auto object-contain max-w-[150px] sm:max-w-[175px]"
              loading="eager"
            />
          </div>

          {/* Vertical divider and unit title */}
          <div className="border-l border-slate-200 pl-2.5 hidden xs:flex flex-col justify-center">
            <div className="flex items-center gap-1">
              <span className="text-[11px] sm:text-xs font-black tracking-tight text-[#004B87] uppercase">
                CX400
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-xs bg-[#004B87]/10 text-[#004B87]">
                Ninh Bình
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold leading-tight line-clamp-1">
              Cảnh giác lừa đảo
            </span>
          </div>
        </div>

        {/* Right: Hotline 24/7 button */}
        <div className="flex items-center gap-2">
          {onOpenSos ? (
            <button
              onClick={onOpenSos}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm hover:shadow-md active:scale-95 transition-all animate-pulse"
              title="Cần hỗ trợ khẩn cấp"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SOS:</span>
              <span>1900 558 868</span>
            </button>
          ) : (
            <a
              href={`tel:${settings.hotline_support.replace(/\s+/g, '')}`}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-[#004B87] hover:bg-[#003B70] text-white font-bold text-xs shadow-xs hover:shadow-md active:scale-95 transition-all"
              title="Gọi đường dây nóng VietinBank"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hotline:</span>
              <span>{settings.hotline_support}</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
