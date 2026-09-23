import { useState } from 'react';
import {
  ArrowLeft,
  PhoneCall,
  Link as LinkIcon,
  Smartphone,
  KeyRound,
  CreditCard,
  UserCheck,
  Gift,
  Briefcase,
  HelpCircle,
  AlertTriangle,
  Lock,
  WifiOff,
  ShieldAlert,
  CheckCircle2,
  Phone,
  Building,
  Shield,
} from 'lucide-react';
import { SystemSettings } from '../types';

interface SuspiciousScamScreenProps {
  settings: SystemSettings;
  onBack: () => void;
}

interface Situation {
  id: string;
  icon: any;
  label: string;
  isUrgent?: boolean;
  alertTitle: string;
  mustNotDo: string[];
  mustDoSteps: { title: string; desc: string; icon?: any }[];
  warningNote: string;
}

export function SuspiciousScamScreen({ settings, onBack }: SuspiciousScamScreenProps) {
  const [selectedSituationId, setSelectedSituationId] = useState<string | null>(null);

  const situations: Situation[] = [
    {
      id: 'phone_call',
      icon: PhoneCall,
      label: '📞 Có người gọi yêu cầu chuyển tiền',
      isUrgent: true,
      alertTitle: 'CẢNH BÁO: ĐÂY 100% LÀ CUỘC GỌI LỪA ĐẢO!',
      mustNotDo: [
        'KHÔNG chuyển bất kỳ khoản tiền nào theo yêu cầu của người gọi.',
        'KHÔNG làm theo các thao tác bấm phím hoặc cài đặt theo hướng dẫn qua điện thoại.',
        'KHÔNG cung cấp mã xác thực OTP, số thẻ, mã PIN hay mật khẩu.',
        'KHÔNG giữ bí mật với người thân dù bị đe dọa (Công an, Viện kiểm sát không bao giờ làm việc qua điện thoại).',
      ],
      mustDoSteps: [
        {
          title: 'DẬP MÁY NGAY LẬP TỨC',
          desc: 'Không tiếp tục tranh luận hay nghe đối tượng thao túng tâm lý.',
          icon: Phone,
        },
        {
          title: 'CHỦ ĐỘNG LIÊN HỆ NGÂN HÀNG',
          desc: `Gọi đường dây nóng chính thức của VietinBank (${settings.hotline_support}) để xác minh thông tin tài khoản nếu còn băn khoăn.`,
          icon: PhoneCall,
        },
        {
          title: 'CHIA SẺ VỚI NGƯỜI THÂN',
          desc: 'Trao đổi ngay với người thân trong gia đình hoặc liên hệ Công an khu vực gần nhất.',
          icon: CheckCircle2,
        },
      ],
      warningNote: 'Cơ quan Công an, Tòa án và Ngân hàng tuyệt đối không làm việc, đe dọa hay yêu cầu chuyển tiền qua điện thoại.',
    },
    {
      id: 'phishing_link',
      icon: LinkIcon,
      label: '🔗 Tôi nhận được một đường link lạ',
      isUrgent: false,
      alertTitle: 'CẢNH BÁO TRANG WEB GIẢ MẠO (PHISHING)',
      mustNotDo: [
        'KHÔNG bấm vào đường link lạ gửi qua tin nhắn SMS, Zalo, Messenger hoặc Email.',
        'KHÔNG nhập tên đăng nhập, mật khẩu ngân hàng hoặc mã OTP vào trang web mở ra từ link.',
        'KHÔNG quét mã QR đính kèm trong tin nhắn không rõ nguồn gốc.',
      ],
      mustDoSteps: [
        {
          title: 'ĐÓNG TRÌNH DUYỆT NGAY',
          desc: 'Nếu đã lỡ bấm vào, hãy thoát ngay lập tức và xóa lịch sử duyệt web.',
          icon: CheckCircle2,
        },
        {
          title: 'ĐỔI MẬT KHẨU NẾU ĐÃ LỠ NHẬP',
          desc: 'Nếu đã lỡ điền thông tin đăng nhập, dùng ứng dụng chính thức VietinBank iPay đổi mật khẩu ngay hoặc gọi ngân hàng khóa tài khoản.',
          icon: Lock,
        },
      ],
      warningNote: 'Trang web chính thức của VietinBank có tên miền duy nhất là vietinbank.vn và luôn có biểu tượng ổ khóa bảo mật.',
    },
    {
      id: 'fake_app',
      icon: Smartphone,
      label: '📱 Tôi được yêu cầu cài ứng dụng',
      isUrgent: true,
      alertTitle: 'CẢNH BÁO MÃ ĐỘC CHIẾM QUYỀN ĐIỀU KHIỂN ĐIỆN THOẠI!',
      mustNotDo: [
        'KHÔNG tải tệp tin có đuôi .apk từ các đường link lạ bên ngoài App Store / CH Play.',
        'KHÔNG cấp quyền "Trợ năng" (Accessibility), quyền "Đọc tin nhắn" hoặc "Quản lý thiết bị" cho bất kỳ app lạ nào.',
        'KHÔNG cắm sạc hoặc cắm vào máy tính lạ khi điện thoại có dấu hiệu bị treo/tự thao tác.',
      ],
      mustDoSteps: [
        {
          title: 'NGẮT MẠNG WIFI / 4G HOẶC BẬT CHẾ ĐỘ MÁY BAY',
          desc: 'Cắt đứt kết nối internet ngay lập tức để kẻ gian không thể truyền lệnh điều khiển hoặc chuyển tiền từ xa.',
          icon: WifiOff,
        },
        {
          title: 'DÙNG MÁY KHÁC GỌI NGÂN HÀNG ĐỂ KHÓA TÀI KHOẢN',
          desc: `Gọi hotline ${settings.hotline_support} yêu cầu khóa dịch vụ ngân hàng điện tử VietinBank iPay ngay lập tức.`,
          icon: PhoneCall,
        },
        {
          title: 'KHÔI PHỤC CÀI ĐẶT GỐC HOẶC MANG ĐI BẢO HÀNH',
          desc: 'Chạy lại phần mềm máy để xóa sạch mã độc hoàn toàn trước khi mở lại tài khoản.',
          icon: CheckCircle2,
        },
      ],
      warningNote: 'Cơ quan Nhà nước không bao giờ gửi link lạ qua Zalo bắt người dân tải file cài đặt Dịch vụ công, VNeID hay Thuế.',
    },
    {
      id: 'leaked_otp',
      icon: KeyRound,
      label: '🔐 Tôi đã cung cấp OTP/mật khẩu',
      isUrgent: true,
      alertTitle: 'TÌNH HUỐNG KHẨN CẤP: TÀI KHOẢN CỦA BẠN ĐANG BỊ XÂM NHẬP!',
      mustNotDo: [
        'KHÔNG cung cấp thêm bất kỳ mã xác nhận nào tiếp theo dù người gọi thúc giục.',
        'KHÔNG chần chừ - từng giây đều vô cùng quan trọng.',
      ],
      mustDoSteps: [
        {
          title: 'KHÓA TÀI KHOẢN / THẺ NGAY LẬP TỨC',
          desc: 'Mở ứng dụng VietinBank iPay trên máy khác hoặc gọi ngay tổng đài để tổng đài viên khóa toàn bộ dịch vụ.',
          icon: Lock,
        },
        {
          title: 'GỌI ĐƯỜNG DÂY NÓNG 24/7 CỦA VIETINBANK',
          desc: `Bấm nút "LIÊN HỆ NGÂN HÀNG" bên dưới (${settings.hotline_support}) để hỗ trợ phong tỏa tài khoản tức thì.`,
          icon: PhoneCall,
        },
      ],
      warningNote: 'VietinBank KHÔNG BAO GIỜ yêu cầu khách hàng cung cấp mã OTP dưới bất kỳ hình thức nào. OTP là chìa khóa mở két sắt tiền của bạn.',
    },
    {
      id: 'transferred_money',
      icon: CreditCard,
      label: '💳 Tôi đã chuyển tiền',
      isUrgent: true,
      alertTitle: 'TÌNH HUỐNG KHẨN CẤP: LIÊN HỆ NGÂN HÀNG VÀ CÔNG AN NGAY!',
      mustNotDo: [
        'KHÔNG tiếp tục nộp thêm các khoản "phí giải tỏa", "phí thuế" hay "tiền bảo hiểm" để lấy lại tiền (đây là bẫy lừa tiếp theo).',
        'KHÔNG xóa lịch sử tin nhắn, số điện thoại hay biên lai chuyển tiền.',
      ],
      mustDoSteps: [
        {
          title: 'GỌI NGÂN HÀNG ĐỂ TRA SOÁT KHẨN CẤP',
          desc: 'Cung cấp số tài khoản người nhận, thời gian chuyển, số tiền để ngân hàng hỗ trợ gửi điện khẩn tra soát phong tỏa.',
          icon: PhoneCall,
        },
        {
          title: 'CHỤP LẠI TOÀN BỘ BẰNG CHỨNG GIAO DỊCH',
          desc: 'Lưu ảnh màn hình giao dịch chuyển khoản, nội dung tin nhắn lừa đảo và số điện thoại đối tượng.',
          icon: CheckCircle2,
        },
        {
          title: 'ĐẾN CÔNG AN VÀ ĐIỂM GIAO DỊCH GẦN NHẤT',
          desc: `Đến Công an nơi cư trú trình báo và liên hệ điểm giao dịch ${settings.branch_name} (${settings.emergency_address}) để được hỗ trợ thủ tục.`,
          icon: ShieldAlert,
        },
      ],
      warningNote: '10–30 phút đầu tiên là thời gian vàng để ngân hàng gửi điện tra soát ngăn chặn đối tượng rút tiền tẩu tán.',
    },
    {
      id: 'fake_banker',
      icon: UserCheck,
      label: '👤 Có người tự xưng là nhân viên ngân hàng',
      isUrgent: false,
      alertTitle: 'CẢNH BÁO GIẢ DANH CÁN BỘ NGÂN HÀNG',
      mustNotDo: [
        'KHÔNG cung cấp mật khẩu ngân hàng điện tử, mã số in trên thẻ ATM/Visa hay mã OTP.',
        'KHÔNG chuyển tiền vào tài khoản "chờ xử lý" hoặc tài khoản mang tên cá nhân khác.',
        'KHÔNG làm theo hướng dẫn "nâng hạn mức thẻ", "hủy dịch vụ trừ tiền tự động" qua điện thoại.',
      ],
      mustDoSteps: [
        {
          title: 'KIỂM TRA LẠI VỚI CHI NHÁNH',
          desc: `Gọi hotline hỗ trợ khách hàng của VietinBank (${settings.hotline_support}) hoặc hotline chi nhánh Ninh Bình (${settings.hotline_branch}) để kiểm tra.`,
          icon: PhoneCall,
        },
        {
          title: 'ĐẾN TRỰC TIẾP QUẦY GIAO DỊCH',
          desc: 'Mọi thủ tục nâng hạn mức, xử lý lỗi giao dịch nên thực hiện trực tiếp tại quầy của VietinBank.',
          icon: Building,
        },
      ],
      warningNote: 'Cán bộ VietinBank không bao giờ gọi điện yêu cầu khách hàng đọc mã OTP hay mật khẩu tài khoản.',
    },
    {
      id: 'lottery_gift',
      icon: Gift,
      label: '🎁 Tôi được thông báo trúng thưởng',
      isUrgent: false,
      alertTitle: 'CẢNH BÁO BẪY TRÚNG THƯỞNG / QUÀ TẶNG TRI ÂN',
      mustNotDo: [
        'KHÔNG nộp bất kỳ khoản "phí vận chuyển", "thuế thu nhập cá nhân" hay "phí mở hồ sơ trúng thưởng".',
        'KHÔNG cung cấp thông tin tài khoản ngân hàng để "nhận tiền thưởng".',
      ],
      mustDoSteps: [
        {
          title: 'BỎ QUA VÀ CHẶN SỐ ĐIỆN THOẠI',
          desc: 'Nếu không tham gia chương trình quay số có đăng ký của Bộ Công thương, chắc chắn đó là tin nhắn lừa đảo.',
          icon: CheckCircle2,
        },
        {
          title: 'CẢNH BÁO CHO NGƯỜI THÂN',
          desc: 'Nhiều người lớn tuổi hay bị lừa bởi bẫy "tặng quà tri ân", hãy nhắc nhở gia đình cảnh giác.',
          icon: PhoneCall,
        },
      ],
      warningNote: 'Các doanh nghiệp uy tín không bao giờ bắt người trúng thưởng phải chuyển tiền trước vào tài khoản cá nhân để nhận quà.',
    },
    {
      id: 'online_job',
      icon: Briefcase,
      label: '💼 Tôi được mời làm việc online',
      isUrgent: false,
      alertTitle: 'CẢNH BÁO BẪY "CỘNG TÁC VIÊN ONLINE / VIỆC NHẸ LƯƠNG CAO"',
      mustNotDo: [
        'KHÔNG nạp tiền "giữ chỗ" hoặc "nạp tiền làm nhiệm vụ xem video, chốt đơn Shopee/Lazada".',
        'KHÔNG tin vào cam kết hoa hồng 20-50% mỗi ngày.',
        'KHÔNG nạp thêm tiền khi hệ thống báo "sai cú pháp" hoặc "cần nạp thêm để rút cả gốc lẫn lãi".',
      ],
      mustDoSteps: [
        {
          title: 'DỪNG NẠP TIỀN NGAY LẬP TỨC',
          desc: 'Càng nạp bạn sẽ càng mất thêm tiền. Hãy chấp nhận dừng lại ngay để không bị cuốn vào bẫy.',
          icon: Lock,
        },
        {
          title: 'LƯU LẠI BẰNG CHỨNG VÀ BÁO CÔNG AN',
          desc: 'Chụp lại lịch sử nạp tiền, thông tin tài khoản nhận tiền và báo cơ quan chức năng.',
          icon: ShieldAlert,
        },
      ],
      warningNote: 'Không có công việc nào chỉ xem video hay click chuột vài phút mà nhận được tiền triệu mỗi ngày.',
    },
    {
      id: 'other',
      icon: HelpCircle,
      label: '❓ Tình huống đáng ngờ khác',
      isUrgent: false,
      alertTitle: 'NGUYÊN TẮC AN TOÀN TUYỆT ĐỐI CẦN NHỚ',
      mustNotDo: [
        'KHÔNG vội vàng làm theo bất cứ yêu cầu chuyển tiền hay cung cấp thông tin nào.',
        'KHÔNG cài đặt ứng dụng từ ngoài chợ ứng dụng chính thức.',
        'KHÔNG chia sẻ mã OTP cho bất kỳ ai, kể cả người tự xưng là công an hay ngân hàng.',
      ],
      mustDoSteps: [
        {
          title: 'BÌNH TĨNH VÀ THAM VẤN',
          desc: 'Hãy dừng lại 5 phút, chia sẻ với người thân đáng tin cậy hoặc gọi ngân hàng để xin tư vấn.',
          icon: CheckCircle2,
        },
        {
          title: 'LIÊN HỆ VIETINBANK NINH BÌNH',
          desc: `Gọi hotline ${settings.hotline_support} hoặc đến trực tiếp ${settings.emergency_address} để được hướng dẫn an toàn.`,
          icon: PhoneCall,
        },
      ],
      warningNote: 'Chậm lại một nhịp sẽ giúp bạn bảo vệ toàn bộ tài sản tích lũy cả đời.',
    },
  ];

  const currentSituation = situations.find(s => s.id === selectedSituationId);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-[#004B87]/15 pb-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 py-2 px-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 hover:text-[#004B87] active:scale-95 transition-all shadow-xs min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 text-[#004B87]" />
          <span>← Trang chủ</span>
        </button>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
          <span className="text-[11px] font-black uppercase text-red-600 tracking-wider">
            CỨU HỘ KHẨN CẤP 24/7
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {!currentSituation ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-3xl p-5 space-y-1.5">
            <h1 className="text-lg sm:text-xl font-black text-red-700 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <span>BẠN ĐANG GẶP TÌNH HUỐNG NÀO?</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Không yêu cầu nhập thông tin cá nhân. Hãy chạm vào tình huống bạn đang gặp phải:
            </p>
          </div>

          <div className="space-y-2.5">
            {situations.map(sit => {
              const Icon = sit.icon;
              return (
                <button
                  key={sit.id}
                  onClick={() => {
                    setSelectedSituationId(sit.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full p-4 rounded-2xl bg-white border border-slate-200 hover:border-red-400 hover:shadow-md text-left transition-all active:scale-98 shadow-xs flex items-center justify-between group min-h-[58px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 group-hover:bg-red-50 group-hover:text-red-700 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                      {sit.label}
                    </span>
                  </div>
                  <span className="text-slate-400 group-hover:text-red-600 font-bold text-sm shrink-0 pl-2">
                    →
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Detailed Action Guidance for the Selected Situation */
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <button
              onClick={() => setSelectedSituationId(null)}
              className="text-xs text-[#004B87] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>← Chọn tình huống khác</span>
            </button>

            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-sm bg-red-600 text-white inline-block mb-2">
                {currentSituation.isUrgent ? '🚨 XỬ LÝ KHẨN CẤP' : '⚠️ KHUYẾN NGHỊ BẢO MẬT'}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {currentSituation.alertTitle}
              </h2>
            </div>

            {/* MUST NOT DO (🛑 KHÔNG) */}
            <div className="space-y-2">
              <h3 className="text-xs sm:text-sm font-black text-red-700 uppercase tracking-wide flex items-center gap-1.5">
                <span>🛑 NGUYÊN TẮC: TUYỆT ĐỐI KHÔNG LÀM</span>
              </h3>
              <div className="space-y-1.5 bg-red-50/70 border border-red-200 rounded-2xl p-4">
                {currentSituation.mustNotDo.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-red-950 font-bold">
                    <span className="text-red-600 font-black shrink-0">✕</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MUST DO STEPS (🚨 BẠN NÊN LÀM GÌ?) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs sm:text-sm font-black text-[#003B70] uppercase tracking-wide flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#004B87]" />
                <span>🚨 BẠN NÊN LÀM GÌ NGAY BÂY GIỜ?</span>
              </h3>
              <div className="space-y-2.5">
                {currentSituation.mustDoSteps.map((step, idx) => {
                  const StepIcon = step.icon || CheckCircle2;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 rounded-2xl bg-[#F4F7FB] border border-[#004B87]/15 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#004B87] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                          {step.title}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warning Note */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium">
              <strong>Lưu ý:</strong> {currentSituation.warningNote}
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY CONTACT SECTION (VIETINBANK HOTLINE) */}
      <div className="bg-gradient-to-br from-[#D32F2F] via-[#E53935] to-[#C62828] text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-red-600/25 space-y-4">
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-red-200">
            HỖ TRỢ KHẨN CẤP 24/7 – VIETINBANK
          </div>
          <h3 className="text-base sm:text-lg font-black leading-tight">
            CẦN TRỢ GIÚP NGAY TỪ NGÂN HÀNG?
          </h3>
          <p className="text-xs text-red-100 font-medium">
            Liên hệ tổng đài viên VietinBank để kích hoạt lệnh chặn giao dịch hoặc phong tỏa tài khoản tức thì.
          </p>
        </div>

        {/* Big Call Button */}
        <a
          href={`tel:${settings.hotline_support.replace(/\s+/g, '')}`}
          className="w-full py-4 px-4 rounded-2xl bg-white text-[#D32F2F] hover:bg-red-50 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg active:scale-98 transition-all min-h-[52px]"
        >
          <PhoneCall className="w-5 h-5 animate-bounce" />
          <span>📞 LIÊN HỆ NGÂN HÀNG: {settings.hotline_support}</span>
        </a>

        {/* Branch Details */}
        <div className="pt-2 border-t border-white/20 text-[11px] text-red-100 space-y-1 font-medium">
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 shrink-0 text-red-200" />
            <span>
              {settings.branch_name} – ĐT: <strong>{settings.hotline_branch}</strong>
            </span>
          </div>
          <div>📍 {settings.emergency_address}</div>
        </div>
      </div>
    </div>
  );
}
