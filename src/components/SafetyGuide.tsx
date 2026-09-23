import { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  PhoneCall,
  Lock,
  ChevronRight,
  AlertTriangle,
  Type,
  Building,
  CheckCircle2,
  XCircle,
  Smartphone,
  CreditCard,
  Link as LinkIcon,
} from 'lucide-react';
import { SystemSettings } from '../types';

interface SafetyGuideProps {
  settings: SystemSettings;
  onOpenSos: () => void;
  fontSizeLevel: number;
  onSelectFontSize: (level: number) => void;
  onOpenStaffLogin: () => void;
}

export function SafetyGuide({
  settings,
  onOpenSos,
  fontSizeLevel,
  onSelectFontSize,
  onOpenStaffLogin,
}: SafetyGuideProps) {
  // Modal for quick situation emergency advice
  const [activeSituation, setActiveSituation] = useState<{
    title: string;
    action: string;
    urgency: string;
  } | null>(null);

  const emergencySituations = [
    {
      id: 'phone',
      icon: PhoneCall,
      title: 'Có người gọi yêu cầu chuyển tiền gấp',
      action:
        'TẮT MÁY NGAY LẬP TỨC. Cơ quan Công an, Viện kiểm sát hay Ngân hàng không bao giờ yêu cầu chuyển tiền qua điện thoại. Hãy gọi lại cho người thân qua số điện thoại thường để kiểm tra.',
      urgency: 'Tuyệt đối không làm theo lời đe dọa hoặc hướng dẫn.',
    },
    {
      id: 'link',
      icon: LinkIcon,
      title: 'Tôi nhận được đường link lạ qua tin nhắn / mạng xã hội',
      action:
        'KHÔNG BẤM VÀO LINK. Nếu đã lỡ bấm, tuyệt đối không nhập tên đăng nhập, mật khẩu VietinBank iPay hoặc mã OTP. Hãy tắt trình duyệt ngay.',
      urgency: 'Đường link mạo danh thường có đuôi lạ như .xyz, .top, .vip,...',
    },
    {
      id: 'app',
      icon: Smartphone,
      title: 'Tôi được yêu cầu cài App lạ (file .apk) để xác minh',
      action:
        'DỪNG LẠI NGAY. Bật Chế độ máy bay (Airplane Mode) để ngắt mạng ngay lập tức. Sau đó liên hệ VietinBank hoặc mang điện thoại đến cơ quan công an / trung tâm bảo hành để gỡ bỏ mã độc.',
      urgency: 'App độc hại có thể chiếm quyền điều khiển và tự ý chuyển tiền trong tài khoản.',
    },
    {
      id: 'otp',
      icon: Lock,
      title: 'Tôi đã lỡ cung cấp mã OTP / Mật khẩu cho người lạ',
      action:
        'HÀNH ĐỘNG KHẨN CẤP: Gọi ngay Hotline VietinBank 1900 558 868 để yêu cầu KHÓA TẠM THỜI tài khoản và dịch vụ iPay ngay trong tích tắc.',
      urgency: 'Mỗi giây đều quý giá để bảo vệ số tiền còn lại.',
    },
    {
      id: 'money',
      icon: CreditCard,
      title: 'Tôi đã chuyển tiền cho kẻ lừa đảo',
      action:
        '1. Gọi ngay Hotline ngân hàng báo khóa tài khoản và yêu cầu hỗ trợ tra soát giao dịch.\n2. Thu thập đầy đủ số tài khoản nhận, tên người nhận, biên lai chuyển tiền và tin nhắn.\n3. Đến ngay Công an phường/xã gần nhất để trình báo.',
      urgency: 'Báo ngân hàng càng sớm, cơ hội phong tỏa tài khoản kẻ gian càng cao.',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Safety Center Header */}
      <div className="bg-gradient-to-br from-blue-900 via-sky-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-black uppercase tracking-wide">
          <ShieldCheck className="w-4 h-4" />
          TRUNG TÂM AN TOÀN VIETINBANK
        </div>
        <h2 className="text-xl sm:text-2xl font-black leading-tight">
          Bảo vệ tiền & tài khoản của bạn
        </h2>
        <p className="text-xs sm:text-sm text-sky-100 font-medium leading-relaxed">
          Chi nhánh VietinBank Ninh Bình luôn đồng hành bảo vệ an toàn tài sản của khách hàng 24/7.
        </p>

        {/* Big Urgent SOS Button */}
        <div className="pt-2">
          <button
            onClick={onOpenSos}
            className="w-full py-4 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-red-600/30 active:scale-98 transition-all"
          >
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span>🆘 TÔI ĐANG NGHI BỊ LỪA ĐẢO</span>
          </button>
        </div>
      </div>

      {/* 2. Direct Emergency Hotline Card */}
      <div className="bg-white rounded-3xl p-5 border border-red-200/80 shadow-xs space-y-3">
        <div className="text-xs font-black uppercase tracking-wider text-red-700 flex items-center gap-1.5">
          <PhoneCall className="w-4 h-4" />
          <span>ĐƯỜNG DÂY NÓNG HỖ TRỢ KHẨN CẤP</span>
        </div>

        <p className="text-xs text-slate-600">
          Nếu phát hiện dấu hiệu bất thường, hãy gọi ngay để khóa thẻ và dịch vụ ngân hàng điện tử:
        </p>

        <a
          href={`tel:${settings.hotline_support.replace(/\s+/g, '')}`}
          className="flex items-center justify-between p-4 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 transition-all active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/20">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700">Tổng đài CSKH 24/7 (Miễn phí)</div>
              <div className="text-xl font-black text-red-600 font-mono tracking-tight">
                {settings.hotline_support}
              </div>
            </div>
          </div>
          <span className="px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-black shadow-xs">
            Bấm gọi
          </span>
        </a>

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
          <Building className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <span>Phòng DVKH Ninh Bình: <strong>{settings.hotline_branch}</strong> ({settings.emergency_address})</span>
        </div>
      </div>

      {/* 3. Tình huống thường gặp & Cách xử lý nhanh */}
      <div className="space-y-3">
        <h3 className="text-sm sm:text-base font-black text-slate-900 px-1">
          Hướng dẫn xử lý theo tình huống
        </h3>

        <div className="space-y-2.5">
          {emergencySituations.map(sit => {
            const Icon = sit.icon;
            return (
              <button
                key={sit.id}
                onClick={() => setActiveSituation(sit)}
                className="w-full text-left p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 transition-all active:scale-98 min-h-[64px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {sit.title}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Font Size Adjustment for Elderly Users */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              Cài đặt kích cỡ chữ đọc
            </h4>
            <p className="text-[11px] text-slate-500">
              Giúp người lớn tuổi đọc tin tức và bài học dễ dàng hơn
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => onSelectFontSize(0)}
            className={`py-3 px-2 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1 ${
              fontSizeLevel === 0
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-sm">A</span>
            <span className="text-[10px] font-medium opacity-90">Tiêu chuẩn</span>
          </button>

          <button
            onClick={() => onSelectFontSize(1)}
            className={`py-3 px-2 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1 ${
              fontSizeLevel === 1
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-base">A+</span>
            <span className="text-[10px] font-medium opacity-90">Chữ lớn</span>
          </button>

          <button
            onClick={() => onSelectFontSize(2)}
            className={`py-3 px-2 rounded-2xl border text-xs font-black transition-all flex flex-col items-center gap-1 ${
              fontSizeLevel === 2
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="text-lg">A++</span>
            <span className="text-[10px] font-medium opacity-90">Rất lớn</span>
          </button>
        </div>
      </div>

      {/* 5. 4 KHÔNG & 2 CÓ cốt lõi */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="text-xs font-black uppercase tracking-wider text-slate-700">
          Quy tắc bảo mật VietinBank
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-red-700">
              <XCircle className="w-4 h-4" />
              <span>4 NGUYÊN TẮC "KHÔNG"</span>
            </div>
            <ul className="text-[11px] text-red-950/90 space-y-1 font-medium list-disc list-inside">
              <li>Không cung cấp mật khẩu / mã OTP</li>
              <li>Không bấm vào link lạ qua tin nhắn</li>
              <li>Không cài ứng dụng ngoài (.APK)</li>
              <li>Không chuyển tiền theo lệnh điện thoại</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>2 NGUYÊN TẮC "CÓ"</span>
            </div>
            <ul className="text-[11px] text-emerald-950/90 space-y-1 font-medium list-disc list-inside">
              <li>Có xác minh trực tiếp bằng số điện thoại người thân</li>
              <li>Có chủ động gọi Hotline ngân hàng khi nghi ngờ</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 6. DISCREET STAFF ENTRY AT THE VERY BOTTOM */}
      <div className="pt-6 pb-2 text-center border-t border-slate-200/60">
        <button
          onClick={onOpenStaffLogin}
          className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors py-2 px-3 rounded-xl hover:bg-slate-200/40 select-none"
        >
          <Lock className="w-3.5 h-3.5 opacity-50" />
          <span>Dành cho cán bộ</span>
        </button>
      </div>

      {/* Situation Quick View Modal */}
      {activeSituation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                  {activeSituation.title}
                </h4>
                <span className="text-[11px] font-bold text-red-600">
                  {activeSituation.urgency}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line">
              {activeSituation.action}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a
                href={`tel:${settings.hotline_support.replace(/\s+/g, '')}`}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Gọi Hotline: {settings.hotline_support}</span>
              </a>
              <button
                onClick={() => setActiveSituation(null)}
                className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
