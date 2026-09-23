import React, { useState } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Lock,
  EyeOff,
  UserCheck,
  Send,
  Sparkles,
  PhoneCall,
  Landmark,
  Smartphone,
  Link as LinkIcon,
  TrendingUp,
  Briefcase,
  ShoppingBag,
  Gift,
  Users,
  HelpCircle,
  X,
  FileImage,
} from 'lucide-react';
import { store } from '../services/store';
import { Category, RiskLevel } from '../types';

interface ShareStoryScreenProps {
  categories: Category[];
  onBack: () => void;
  onGoHome: () => void;
}

const SCAM_CATEGORIES_PRESET = [
  { id: 'cat_congan', label: '📞 Giả danh Công an / Cơ quan chức năng', icon: PhoneCall },
  { id: 'cat_nganhang', label: '🏦 Giả danh cán bộ Ngân hàng', icon: Landmark },
  { id: 'cat_appgia', label: '📱 Ứng dụng giả mạo (APK)', icon: Smartphone },
  { id: 'cat_linkgia', label: '🔗 Link giả / Website lừa đảo', icon: LinkIcon },
  { id: 'cat_dautu', label: '💰 Đầu tư tài chính / Tiền ảo', icon: TrendingUp },
  { id: 'cat_ctv', label: '💼 Việc làm online / Tuyển CTV', icon: Briefcase },
  { id: 'cat_shipper', label: '🛒 Mua bán online / Giả Shipper', icon: ShoppingBag },
  { id: 'cat_nguoithan', label: '👨‍👩‍👧 Giả danh người thân mượn tiền', icon: Users },
  { id: 'cat_trungthuong', label: '🎁 Thông báo trúng thưởng / Quà tri ân', icon: Gift },
  { id: 'cat_khac', label: '❓ Hình thức lừa đảo khác', icon: HelpCircle },
];

export function ShareStoryScreen({ categories, onBack, onGoHome }: ShareStoryScreenProps) {
  // Navigation inside this feature: 'intro' | 'form' | 'success'
  const [step, setStep] = useState<'intro' | 'form' | 'success'>('intro');

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<string>('cat_congan');
  const [rawTitle, setRawTitle] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [scamMethod, setScamMethod] = useState('');
  const [customerAction, setCustomerAction] = useState('');
  const [customerLesson, setCustomerLesson] = useState('');

  // Identity & Privacy
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Images
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageInputValue, setImageInputValue] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  // Consent
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Add sample/uploaded image
  const handleAddImage = (url: string) => {
    if (!url.trim()) return;
    if (imageUrls.length >= 3) {
      alert('Tối đa 3 hình ảnh đính kèm.');
      return;
    }
    setImageUrls(prev => [...prev, url.trim()]);
    setImageInputValue('');
    setShowImageInput(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Dung lượng ảnh tối đa 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const base64 = event.target?.result as string;
      if (base64) {
        setImageUrls(prev => [...prev, base64]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!rawContent.trim()) {
      setErrorMessage('Vui lòng kể lại ngắn gọn điều đã xảy ra với bạn.');
      return;
    }

    if (!consentAccepted) {
      setErrorMessage('Vui lòng đồng ý để ngân hàng biên tập trước khi gửi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const generatedTitle =
        rawTitle.trim() ||
        `Cảnh giác: Khách hàng chia sẻ tình huống ${
          SCAM_CATEGORIES_PRESET.find(c => c.id === selectedCategory)?.label.split(' ')[1] || 'lừa đảo'
        }`;

      store.createCustomerSubmission({
        category_id: selectedCategory,
        risk_level: 'CAO' as RiskLevel,
        raw_title: generatedTitle,
        raw_content: rawContent.trim(),
        scam_method: scamMethod.trim() || undefined,
        customer_action: customerAction.trim() || undefined,
        customer_lesson: customerLesson.trim() || undefined,
        display_name: isAnonymous ? undefined : displayName.trim() || 'Khách hàng VietinBank',
        is_anonymous: isAnonymous,
        contact_phone: contactPhone.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      setIsSubmitting(false);
      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi gửi câu chuyện. Vui lòng thử lại.');
    }
  };

  // =========================================================================
  // VIEW 1: INTRO SCREEN (Section IV)
  // =========================================================================
  if (step === 'intro') {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 py-2 px-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 active:scale-95 transition-all shadow-xs min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Trang chủ</span>
          </button>
          <span className="text-[11px] font-black uppercase text-[#004B87] tracking-wider">
            CHIA SẺ CÂU CHUYỆN
          </span>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-[#003B70] via-[#004B87] to-[#005A9C] text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-[#004B87]/15 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner">
            <MessageSquare className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              💬 CÂU CHUYỆN CỦA BẠN CÓ THỂ GIÚP NGƯỜI KHÁC
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed font-medium">
              Bạn từng nhận cuộc gọi nghi vấn? Bạn từng được gửi link lạ hoặc lời mời làm việc hấp dẫn? Hãy chia sẻ trải nghiệm thực tế để cùng VietinBank bảo vệ cộng đồng tránh mất tiền.
            </p>
          </div>
        </div>

        {/* Empathy Guide List */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-xs sm:text-sm font-black text-[#003B70] uppercase tracking-wide">
            CÂU CHUYỆN BẠN CÓ THỂ CHIA SẺ:
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-lg">📞</span>
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                Từng nhận cuộc gọi đe dọa, tự xưng Công an, Viện kiểm sát hoặc Cán bộ ngân hàng?
              </p>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-lg">🔗</span>
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                Từng bị dẫn dụ bấm vào đường link lạ, quét mã QR nhận quà hay cài file APK?
              </p>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-lg">💼</span>
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                Từng gặp các chiêu trò nạp tiền làm nhiệm vụ, đầu tư tài chính siêu lợi nhuận?
              </p>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-lg">🛒</span>
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                Từng gặp bẫy giao hàng giả mạo, hoàn tiền đơn hàng hay giả mạo người thân?
              </p>
            </div>
          </div>

          {/* Privacy Guarantee Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <span className="font-bold text-emerald-950">Cam kết bảo mật 100%:</span>
              <p className="text-emerald-800 leading-relaxed font-medium">
                Mặc định chia sẻ ẩn danh. VietinBank tuyệt đối không công khai số điện thoại, email, số tài khoản hay thông tin cá nhân của bạn.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              setStep('form');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full py-4 px-6 rounded-2xl bg-[#004B87] hover:bg-[#003B70] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#004B87]/25 active:scale-98 transition-all min-h-[52px]"
          >
            <span>BẮT ĐẦU CHIA SẺ →</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FORM SUBMISSION (Sections V to X)
  // =========================================================================
  if (step === 'form') {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <button
            onClick={() => setStep('intro')}
            className="inline-flex items-center gap-2 py-2 px-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 active:scale-95 transition-all shadow-xs min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Quay lại</span>
          </button>
          <span className="text-[11px] font-black uppercase text-[#004B87] tracking-wider">
            GỬI CÂU CHUYỆN CẢNH GIÁC
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SECTION 1: Chọn hình thức lừa đảo */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3.5">
            <div>
              <label className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide block">
                1. BẠN ĐÃ GẶP HÌNH THỨC NÀO? <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Chạm để chọn hình thức tương tự nhất:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SCAM_CATEGORIES_PRESET.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all active:scale-98 min-h-[48px] ${
                      isSelected
                        ? 'bg-[#004B87] border-[#004B87] text-white shadow-md shadow-[#004B87]/20'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className="shrink-0">{cat.label.slice(0, 2)}</span>
                    <span className="line-clamp-1">{cat.label.slice(2).trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Chuyện gì đã xảy ra? */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
            <div>
              <label className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide block">
                2. CHUYỆN GÌ ĐÃ XẢY RA VỚI BẠN? <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Hãy kể ngắn gọn điều đã xảy ra (không cần viết dài):
              </p>
            </div>

            <textarea
              required
              rows={4}
              value={rawContent}
              onChange={e => setRawContent(e.target.value)}
              placeholder="Ví dụ: Sáng qua tôi nhận cuộc gọi từ số lạ tự xưng Công an thông báo tôi dính líu rửa tiền, yêu cầu vào phòng kín đóng cửa và chuẩn bị chuyển tiền..."
              className="w-full p-4 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-[#004B87] focus:ring-2 focus:ring-[#004B87]/20 leading-relaxed font-medium bg-slate-50/50"
            />
          </div>

          {/* SECTION 3: Kẻ lừa đảo đã làm gì? (Tùy chọn) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
            <div>
              <label className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide block">
                3. KẺ LỪA ĐẢO ĐÃ DÙNG THỦ ĐOẠN GÌ?
              </label>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Ví dụ: Gọi điện dọa nạt, gửi link giả, hướng dẫn cài ứng dụng... (Có thể bỏ qua)
              </p>
            </div>

            <textarea
              rows={2}
              value={scamMethod}
              onChange={e => setScamMethod(e.target.value)}
              placeholder="Ví dụ: Giả giọng cán bộ điều tra, đọc đúng họ tên, gửi link tải app .apk chứa mã độc..."
              className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-[#004B87] leading-relaxed font-medium bg-slate-50/50"
            />
          </div>

          {/* SECTION 4: Bạn đã xử lý như thế nào? (Tùy chọn) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
            <div>
              <label className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide block">
                4. BẠN ĐÃ XỬ LÝ NHƯ THẾ NÀO?
              </label>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Ví dụ: Dập máy gọi cho người thân, ra phòng giao dịch hỏi cán bộ ngân hàng... (Có thể bỏ qua)
              </p>
            </div>

            <textarea
              rows={2}
              value={customerAction}
              onChange={e => setCustomerAction(e.target.value)}
              placeholder="Ví dụ: Tôi nghi ngờ nên dập máy, gọi điện cho người thân và ra ngân hàng VietinBank gần nhất để hỏi..."
              className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-[#004B87] leading-relaxed font-medium bg-slate-50/50"
            />
          </div>

          {/* SECTION 5: Nhắn nhủ với người khác */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
            <div>
              <label className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide block">
                5. BẠN MUỐN NHẮN NHỦ GÌ VỚI MỌI NGƯỜI?
              </label>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Bài học rút ra để người khác tránh rơi vào hoàn cảnh tương tự:
              </p>
            </div>

            <textarea
              rows={2}
              value={customerLesson}
              onChange={e => setCustomerLesson(e.target.value)}
              placeholder="Ví dụ: Mọi người tuyệt đối không chuyển tiền theo lời đe dọa qua điện thoại, hãy bình tĩnh xác minh..."
              className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-[#004B87] leading-relaxed font-medium bg-slate-50/50"
            />
          </div>

          {/* SECTION 6: Ẩn danh & Thông tin hiển thị (Section VII & VIII) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs sm:text-sm font-black text-[#003B70] uppercase tracking-wide">
              🔒 TÙY CHỌN DANH TÍNH & BẢO MẬT
            </h3>

            <div className="space-y-3">
              <label
                onClick={() => setIsAnonymous(true)}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                  isAnonymous
                    ? 'bg-[#004B87]/5 border-[#004B87] text-[#003B70]'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="anon_option"
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous(true)}
                  className="w-4 h-4 text-[#004B87] focus:ring-[#004B87]"
                />
                <div className="space-y-0.5">
                  <div className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4 text-[#004B87]" />
                    <span>Chia sẻ ẩn danh (Khuyên dùng)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tên tác giả hiển thị công khai: &quot;Khách hàng chia sẻ&quot; hoặc &quot;Một khách hàng VietinBank&quot;.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setIsAnonymous(false)}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                  !isAnonymous
                    ? 'bg-[#004B87]/5 border-[#004B87] text-[#003B70]'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="anon_option"
                  checked={!isAnonymous}
                  onChange={() => setIsAnonymous(false)}
                  className="w-4 h-4 text-[#004B87] focus:ring-[#004B87]"
                />
                <div className="space-y-0.5">
                  <div className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#004B87]" />
                    <span>Tôi muốn để lại tên hiển thị</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Ví dụ: &quot;Cô Mai&quot;, &quot;Anh Tuấn&quot;... (Vẫn tuyệt đối không công khai số điện thoại).
                  </p>
                </div>
              </label>

              {!isAnonymous && (
                <div className="pt-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Nhập tên hiển thị (Ví dụ: Chị Lan, Anh Nam...)"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:border-[#004B87]"
                  />
                </div>
              )}

              {/* Tùy chọn liên hệ riêng cho cán bộ (tự nguyện) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">
                  📞 Bạn có muốn để lại SĐT để cán bộ hỗ trợ thêm nếu cần? (Tự nguyện):
                </span>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="Số điện thoại của bạn (chỉ lưu nội bộ, không công khai)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-[#004B87] bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION 7: Đính kèm hình ảnh bằng chứng (Section IX) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3.5">
            <div>
              <label className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide block">
                📷 BẠN CÓ HÌNH ẢNH BẰNG CHỨNG?
              </label>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Ảnh tin nhắn, số gọi đến, giao diện giả mạo... (Tối đa 3 ảnh):
              </p>
            </div>

            {/* Warning regarding security */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                ⚠️ <strong>Lưu ý an toàn:</strong> Vui lòng che/xóa mã OTP, mật khẩu, số tài khoản, CCCD và thông tin cá nhân trước khi gửi ảnh!
              </span>
            </div>

            {/* Upload Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Tải ảnh từ máy</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={imageUrls.length >= 3}
                />
              </label>

              <button
                type="button"
                onClick={() => setShowImageInput(prev => !prev)}
                className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                <span>Nhập liên kết ảnh</span>
              </button>
            </div>

            {showImageInput && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageInputValue}
                  onChange={e => setImageInputValue(e.target.value)}
                  placeholder="Dán link ảnh (https://...)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-[#004B87]"
                />
                <button
                  type="button"
                  onClick={() => handleAddImage(imageInputValue)}
                  className="px-4 py-2.5 rounded-xl bg-[#004B87] text-white text-xs font-bold"
                >
                  Thêm
                </button>
              </div>
            )}

            {/* Attached Images Preview */}
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-xs group"
                  >
                    <img src={url} alt="Bằng chứng" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white shadow-xs"
                      title="Xóa ảnh này"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 8: Cam kết & Xác nhận (Section X) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consentAccepted}
                onChange={e => setConsentAccepted(e.target.checked)}
                className="w-5 h-5 rounded-md text-[#004B87] focus:ring-[#004B87] mt-0.5 shrink-0"
              />
              <span className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                Tôi đồng ý cho ngân hàng biên tập nội dung câu chuyện để phục vụ mục đích cảnh báo, tuyên truyền và nâng cao nhận thức về phòng chống lừa đảo.
              </span>
            </label>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-[#004B87] hover:bg-[#003B70] disabled:bg-slate-400 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#004B87]/25 active:scale-98 transition-all min-h-[52px]"
            >
              {isSubmitting ? (
                <span>ĐANG GỬI CÂU CHUYỆN...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>📤 GỬI CÂU CHUYỆN</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: CONFIRMATION SUCCESS SCREEN (Section XI)
  // =========================================================================
  return (
    <div className="space-y-5 animate-in zoom-in-95 duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 p-7 sm:p-9 text-center space-y-5 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">
            TIẾP NHẬN THÀNH CÔNG
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            ✅ ĐÃ TIẾP NHẬN CÂU CHUYỆN
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium pt-1 max-w-sm mx-auto">
            Cảm ơn bạn đã chia sẻ. Câu chuyện của bạn sẽ được cán bộ VietinBank kiểm tra và biên tập cẩn thận trước khi xuất bản.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-left text-xs sm:text-sm text-sky-950 font-medium leading-relaxed space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-[#004B87]">
            <Sparkles className="w-4 h-4" />
            <span>Quy trình tiếp theo:</span>
          </p>
          <p>
            Nếu được duyệt, nội dung sẽ được đăng tải trong chuyên mục <strong>&quot;Bản tin cảnh báo&quot;</strong> để giúp các khách hàng khác chủ động phòng tránh rủi ro tài sản.
          </p>
        </div>

        <button
          onClick={onGoHome}
          className="w-full py-4 px-6 rounded-2xl bg-[#004B87] hover:bg-[#003B70] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#004B87]/25 active:scale-98 transition-all min-h-[52px]"
        >
          <span>← VỀ TRANG CHỦ</span>
        </button>
      </div>
    </div>
  );
}
