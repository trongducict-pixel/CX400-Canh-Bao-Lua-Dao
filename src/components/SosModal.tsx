import { useState } from 'react';
import {
  AlertTriangle,
  Phone,
  Link as LinkIcon,
  Smartphone,
  KeyRound,
  CreditCard,
  UserCheck,
  X,
  PhoneCall,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
  Lock,
  WifiOff,
} from 'lucide-react';
import { SystemSettings } from '../types';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onTrackSos: () => void;
}

type ScenarioId =
  | 'phone_call'
  | 'phishing_link'
  | 'fake_app'
  | 'leaked_otp'
  | 'transferred_money'
  | 'fake_banker';

interface ScenarioDetail {
  id: ScenarioId;
  icon: any;
  title: string;
  isUrgent: boolean;
  alertHeadline: string;
  steps: { title: string; desc: string; icon?: any }[];
  warningNote: string;
}

function getScenarios(settings: SystemSettings): ScenarioDetail[] {
  return [
  {
    id: 'leaked_otp',
    icon: KeyRound,
    title: '🔐 Tôi đã lỡ cung cấp mã OTP',
    isUrgent: true,
    alertHeadline: 'TÌNH HUỐNG KHẨN CẤP: TÀI KHOẢN ĐANG CÓ NGUY CƠ BỊ RÚT TIỀN NGAY!',
    steps: [
      {
        title: 'BƯỚC 1: KHÓA TÀI KHOẢN / THẺ NGAY LẬP TỨC',
        desc: 'Mở ứng dụng VietinBank iPay -> Chọn Dịch vụ thẻ / Tài khoản -> Bấm "Khóa thẻ / Khóa dịch vụ iPay" hoặc gọi ngay Hotline bên dưới.',
        icon: Lock,
      },
      {
        title: 'BƯỚC 2: GỌI TỔNG ĐÀI KHẨN CẤP ĐỂ TỔNG ĐÀI VIÊN PHONG TỎA',
        desc: 'Bấm nút "LIÊN HỆ NGÂN HÀNG" bên dưới để nhân viên VietinBank kích hoạt lệnh chặn giao dịch ngay lập tức.',
        icon: PhoneCall,
      },
      {
        title: 'BƯỚC 3: ĐỔI MẬT KHẨU HOẶC HỦY LIÊN KẾT',
        desc: 'Đổi mật khẩu tài khoản ngân hàng điện tử từ một thiết bị an toàn khác.',
        icon: CheckCircle2,
      },
    ],
    warningNote: 'VietinBank tuyệt đối không bao giờ yêu cầu khách hàng cung cấp mã OTP. Kẻ lừa đảo chỉ cần mã OTP là có thể chuyển sạch tiền của bạn.',
  },
  {
    id: 'transferred_money',
    icon: CreditCard,
    title: '💳 Tôi đã chuyển tiền cho kẻ lừa đảo',
    isUrgent: true,
    alertHeadline: 'TÌNH HUỐNG KHẨN CẤP: LIÊN HỆ NGÂN HÀNG VÀ CƠ QUAN CÔNG AN NGAY!',
    steps: [
      {
        title: 'BƯỚC 1: GỌI NGAY CHO VIETINBANK ĐỂ TRA SOÁT KHẨN',
        desc: 'Cung cấp mã giao dịch, số tài khoản người nhận, thời gian chuyển tiền để ngân hàng liên hệ ngân hàng thụ hưởng phong tỏa tài khoản lừa đảo (nếu tiền chưa bị rút).',
        icon: PhoneCall,
      },
      {
        title: 'BƯỚC 2: CHỤP LẠI TOÀN BỘ CHỨNG TỪ GIAO DỊCH VÀ TIN NHẮN',
        desc: 'Lưu lại hình ảnh chuyển khoản, số tài khoản đích, tên người nhận và toàn bộ lịch sử tin nhắn/cuộc gọi lừa đảo.',
        icon: CheckCircle2,
      },
      {
        title: 'BƯỚC 3: ĐẾN CÔNG AN PHƯỜNG/XÃ GẦN NHẤT TRÌNH BÁO',
        desc: 'Nộp đơn tố giác tội phạm kèm chứng từ sao kê ngân hàng đã in tại VietinBank Ninh Bình.',
        icon: ShieldAlert,
      },
    ],
    warningNote: 'Thời gian 10-30 phút đầu tiên là thời điểm vàng để ngân hàng hỗ trợ gửi điện khẩn phong tỏa dòng tiền.',
  },
  {
    id: 'fake_app',
    icon: Smartphone,
    title: '📱 Tôi được yêu cầu hoặc đã cài ứng dụng lạ (.apk)',
    isUrgent: true,
    alertHeadline: 'CẢNH BÁO MÃ ĐỘC: ĐIỆN THOẠI CỦA BẠN CÓ THỂ ĐANG BỊ ĐIỀU KHIỂN TỪ XA!',
    steps: [
      {
        title: 'BƯỚC 1: NGẮT NGAY MẠNG WIFI VÀ DỮ LIỆU DI ĐỘNG (4G/5G)',
        desc: 'Bật ngay chế độ máy bay (Airplane mode) hoặc tắt nguồn điện thoại ngay lập tức để cắt đứt liên lạc của kẻ gian với thiết bị.',
        icon: WifiOff,
      },
      {
        title: 'BƯỚC 2: DÙNG MỘT ĐIỆN THOẠI KHÁC GỌI NGÂN HÀNG KHÓA iPAY',
        desc: 'Gọi hotline VietinBank để tạm thời đình chỉ đăng nhập ứng dụng iPay trên thiết bị nhiễm mã độc.',
        icon: PhoneCall,
      },
      {
        title: 'BƯỚC 3: GỠ CÀI ĐẶT ỨNG DỤNG HOẶC KHÔI PHỤC CÀI ĐẶT GỐC',
        desc: 'Mang máy đến trung tâm bảo hành chính hãng để chạy lại phần mềm trắng, không tiếp tục sử dụng máy khi chưa quét sạch mã độc.',
        icon: CheckCircle2,
      },
    ],
    warningNote: 'Các ứng dụng dịch vụ công, thuế giả mạo thường lừa người dùng bật quyền "Trợ năng" để đọc trộm bàn phím và mã OTP.',
  },
  {
    id: 'phone_call',
    icon: Phone,
    title: '📞 Có người gọi điện yêu cầu chuyển tiền / đe dọa',
    isUrgent: false,
    alertHeadline: 'HÃY BÌNH TĨNH: 100% CÁC CUỘC GỌI TỰ XƯNG CÔNG AN/VIỆN KIỂM SÁT YÊU CẦU CHUYỂN TIỀN ĐỀU LÀ LỪA ĐẢO!',
    steps: [
      {
        title: 'BƯỚC 1: TẮT MÁY NGAY LẬP TỨC',
        desc: 'Không đôi co, không giải thích, không nghe theo lời đe dọa. Bạn không có nghĩa vụ phải chứng minh sự trong sạch qua điện thoại.',
        icon: PhoneCall,
      },
      {
        title: 'BƯỚC 2: KHÔNG LÀM THEO BẤT KỲ LỆNH NÀO',
        desc: 'Tuyệt đối không ra cây ATM, không ra quầy giao dịch chuyển tiền vào bất kỳ "tài khoản an toàn/tư pháp" nào.',
        icon: Lock,
      },
      {
        title: 'BƯỚC 3: CHIA SẺ VỚI NGƯỜI THÂN HOẶC ĐẾN CÔNG AN PHƯỜNG',
        desc: 'Kể cho người trong gia đình hoặc trực tiếp đến trụ sở Công an nơi cư trú để được hỗ trợ xác minh.',
        icon: CheckCircle2,
      },
    ],
    warningNote: 'Cơ quan Công an, Tòa án, Viện Kiểm sát không bao giờ làm việc qua điện thoại và không bao giờ yêu cầu chuyển tiền.',
  },
  {
    id: 'phishing_link',
    icon: LinkIcon,
    title: '🔗 Tôi nhận được tin nhắn chứa đường link lạ',
    isUrgent: false,
    alertHeadline: 'CẢNH GIÁC PHISHING: KHÔNG BẤM VÀO ĐƯỜNG LINK TRONG TIN NHẮN!',
    steps: [
      {
        title: 'BƯỚC 1: XÓA NGAY TIN NHẮN CHỨA LINK',
        desc: 'Không bấm thử, không tò mò. Các đường link này thường có đuôi lạ như .vip, .top, .xyz, .cc mạo danh ngân hàng.',
        icon: CheckCircle2,
      },
      {
        title: 'BƯỚC 2: NẾU ĐÃ LỠ BẤM VÀO LINK',
        desc: 'Nếu chỉ mới bấm link nhưng CHƯA NHẬP thông tin gì: Hãy đóng tab trình duyệt, xóa lịch sử duyệt web và yên tâm.',
        icon: CheckCircle2,
      },
      {
        title: 'BƯỚC 3: NẾU ĐÃ NHẬP TÀI KHOẢN VÀ MẬT KHẨU',
        desc: 'Ngay lập tức mở app VietinBank iPay chính thức để đổi mật khẩu mới, hoặc gọi hotline ngân hàng yêu cầu hỗ trợ.',
        icon: Lock,
      },
    ],
    warningNote: 'Địa chỉ cổng thông tin chính thức của VietinBank duy nhất là: vietinbank.vn',
  },
  {
    id: 'fake_banker',
    icon: UserCheck,
    title: '👤 Có người tự xưng là cán bộ VietinBank liên hệ',
    isUrgent: false,
    alertHeadline: 'CẢNH BÁO GIẢ MẠO CÁN BỘ NGÂN HÀNG ĐỂ ĐÁNH CẮP THÔNG TIN!',
    steps: [
      {
        title: 'BƯỚC 1: XÁC MINH NGUYÊN TẮC BẢO MẬT CỦA VIETINBANK',
        desc: 'Cán bộ ngân hàng không bao giờ gọi điện yêu cầu khách hàng đọc mật khẩu, OTP, mã CVV sau thẻ hoặc yêu cầu nộp phí "phê duyệt hồ sơ vay".',
        icon: Lock,
      },
      {
        title: 'BƯỚC 2: YÊU CẦU LÀM VIỆC TẠI TRỤ SỞ CHI NHÁNH',
        desc: `Đề nghị đối tượng cho bạn đến trực tiếp ${settings.bank_name} - ${settings.branch_name} tại địa chỉ: ${settings.emergency_address} để giao dịch. Kẻ lừa đảo sẽ lập tức tìm cớ từ chối.`,
        icon: CheckCircle2,
      },
      {
        title: 'BƯỚC 3: GỌI ĐIỆN ĐẾN SỐ MÁY BÀN CHI NHÁNH ĐỂ KIỂM TRA',
        desc: `Liên hệ số điện thoại chính thức của Chi nhánh Ninh Bình: ${settings.hotline_branch} để kiểm tra danh tính cán bộ.`,
        icon: PhoneCall,
      },
    ],
    warningNote: 'Mọi thủ tục mở thẻ, cấp tín dụng hoặc hỗ trợ kỹ thuật VietinBank đều miễn phí hoặc niêm yết công khai trên website.',
  },
  ];
}

export function SosModal({ isOpen, onClose, settings, onTrackSos }: SosModalProps) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioDetail | null>(null);

  if (!isOpen) return null;

  const scenarios = getScenarios(settings);

  const handleSelectScenario = (scenario: ScenarioDetail) => {
    setSelectedScenario(scenario);
    onTrackSos();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {selectedScenario ? (
              <button
                onClick={() => setSelectedScenario(null)}
                className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                title="Quay lại"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2 rounded-xl bg-white/20">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {selectedScenario ? 'Hướng dẫn xử lý khẩn cấp' : '🆘 TÔI ĐANG NGHI BỊ LỪA'}
              </h2>
              <p className="text-xs text-red-100 font-medium">
                {selectedScenario ? 'Hãy bình tĩnh và làm đúng theo các bước' : 'Chọn đúng tình huống bạn đang gặp phải'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedScenario(null);
              onClose();
            }}
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {!selectedScenario ? (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 leading-relaxed font-medium">
                🛡️ <strong>Lưu ý:</strong> Ứng dụng không yêu cầu bạn nhập bất kỳ thông tin cá nhân hay tài khoản nào. Vui lòng bấm chọn vấn đề bạn đang đối mặt:
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {scenarios.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectScenario(item)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group active:scale-[0.99] ${
                        item.isUrgent
                          ? 'border-red-200 bg-red-50/50 hover:bg-red-50 hover:border-red-400'
                          : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            item.isUrgent
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-blue-600 text-white shadow-xs'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 group-hover:text-blue-800">
                            {item.title}
                          </div>
                          {item.isUrgent && (
                            <span className="text-[11px] font-semibold text-red-600">
                              Nguy cơ mất tiền rất cao - Cần hành động ngay
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-slate-400 group-hover:text-blue-600 font-bold text-lg">
                        →
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Alert Notice */}
              <div
                className={`p-3.5 rounded-xl border ${
                  selectedScenario.isUrgent
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  {selectedScenario.alertHeadline}
                </div>
                <p className="text-xs font-medium leading-relaxed">
                  {selectedScenario.warningNote}
                </p>
              </div>

              {/* Action Steps */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  CÁC BƯỚC HÀNH ĐỘNG CỤ THỂ
                </div>

                {selectedScenario.steps.map((st, idx) => {
                  const StepIcon = st.icon || CheckCircle2;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex gap-3 items-start"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 leading-tight mb-1">
                          {st.title}
                        </div>
                        <div className="text-xs text-slate-600 leading-relaxed font-medium">
                          {st.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Emergency Hotline Buttons */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2.5">
                <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-blue-700" />
                  LIÊN HỆ TRỰC TIẾP NGÂN HÀNG HỖ TRỢ
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={`tel:${settings.hotline_support.replace(/\s+/g, '')}`}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 active:scale-95 transition-all text-center"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Hotline 24/7: {settings.hotline_support}</span>
                  </a>
                  <a
                    href={`tel:${settings.hotline_branch.replace(/\s+/g, '')}`}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs shadow-md shadow-blue-800/20 active:scale-95 transition-all text-center"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Ninh Bình: {settings.hotline_branch}</span>
                  </a>
                </div>
                <p className="text-[11px] text-slate-500 text-center font-medium">
                  Địa chỉ hỗ trợ trực tiếp: {settings.emergency_address}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            {settings.bank_name} · {settings.department_name}
          </span>
          <button
            onClick={() => {
              setSelectedScenario(null);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
