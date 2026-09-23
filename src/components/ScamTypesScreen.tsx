import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  PhoneCall,
  CreditCard,
  Link as LinkIcon,
  Smartphone,
  Briefcase,
  TrendingUp,
  PackageCheck,
  Users,
  Gift,
  HeartHandshake,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  X,
  BookOpen,
  BrainCircuit,
  ArrowRight,
} from 'lucide-react';
import { Category, QuizQuestion, Story } from '../types';

interface ScamTypesScreenProps {
  categories: Category[];
  stories: Story[];
  quizzes: QuizQuestion[];
  onBack: () => void;
  onOpenStory: (story: Story) => void;
  onOpenQuizForCategory: (categoryId: string) => void;
}

// Icon mapper
function getIconForCategory(iconName: string) {
  switch (iconName) {
    case 'ShieldAlert':
      return PhoneCall;
    case 'CreditCard':
      return CreditCard;
    case 'Link':
      return LinkIcon;
    case 'Smartphone':
      return Smartphone;
    case 'Briefcase':
      return Briefcase;
    case 'TrendingUp':
      return TrendingUp;
    case 'PackageCheck':
      return PackageCheck;
    case 'Users':
      return Users;
    case 'Gift':
      return Gift;
    case 'HeartHandshake':
      return HeartHandshake;
    default:
      return AlertTriangle;
  }
}

// Detailed scam knowledge database matching Section IX
interface CategoryDetails {
  whatTheyDo: string;
  scenarios: string[];
  warningSigns: string[];
  howToPrevent: string[];
}

const CATEGORY_KNOWLEDGE: Record<string, CategoryDetails> = {
  cat_congan: {
    whatTheyDo: 'Mạo danh cán bộ Công an, Viện kiểm sát hoặc Tòa án gọi điện thông báo nạn nhân liên quan đến đường dây buôn ma túy, rửa tiền xuyên quốc gia.',
    scenarios: [
      'Gọi điện xưng là cán bộ điều tra, đọc rõ số CCCD và địa chỉ để tạo lòng tin.',
      'Gửi lệnh bắt tạm giam, lệnh phong tỏa tài sản giả mạo qua Zalo.',
      'Yêu cầu nạn nhân ra thuê phòng khách sạn, không nói với ai để "phục vụ điều tra".',
      'Yêu cầu chuyển toàn bộ tiền vào "tài khoản tạm giữ của cơ quan điều tra" để giám định.',
    ],
    warningSigns: [
      'Tạo tâm lý hoang mang, sợ hãi tột cùng và đe dọa khởi tố hình sự.',
      'Gây áp lực thời gian: bắt phải xử lý ngay trong 30-60 phút.',
      'Yêu cầu giữ bí mật tuyệt đối: không được nói cho người thân, bạn bè hay cán bộ ngân hàng.',
      'Yêu cầu cài ứng dụng "Bộ Công an" hoặc "Cổng thông tin điện tử" (.apk) giả mạo.',
      'Yêu cầu chuyển tiền vào tài khoản cá nhân khác mang tên người lạ.',
    ],
    howToPrevent: [
      'Cơ quan Công an không bao giờ làm việc qua điện thoại hay gửi lệnh bắt qua Zalo.',
      'Công an không có "tài khoản tạm giữ" để yêu cầu người dân chuyển tiền giám định.',
      'Khi nhận cuộc gọi nghi ngờ, dập máy ngay và đến Công an phường/xã gần nhất để xác minh.',
    ],
  },
  cat_nganhang: {
    whatTheyDo: 'Tự xưng là nhân viên ngân hàng VietinBank hỗ trợ xử lý sự cố tài khoản, hủy phí trừ tự động hoặc nâng hạn mức thẻ tín dụng.',
    scenarios: [
      'Báo tài khoản của bạn đang có giao dịch trừ tiền lạ tại nước ngoài.',
      'Hướng dẫn bấm link hoặc đọc mã OTP để "hủy gói dịch vụ trừ phí hàng tháng".',
      'Đề nghị hỗ trợ sang tên sổ tiết kiệm online hoặc vay vốn lãi suất 0%.',
    ],
    warningSigns: [
      'Yêu cầu đọc mã xác thực OTP gửi về số điện thoại.',
      'Yêu cầu cung cấp mật khẩu ngân hàng điện tử VietinBank iPay.',
      'Yêu cầu chụp 2 mặt thẻ ngân hàng (đặc biệt là 3 số bảo mật CVV ở mặt sau).',
    ],
    howToPrevent: [
      'Ngân hàng VietinBank tuyệt đối không bao giờ yêu cầu khách hàng cung cấp mã OTP.',
      'Mọi nhu cầu vay vốn, nâng hạn mức hãy đến trực tiếp chi nhánh hoặc dùng app chính thức.',
    ],
  },
  cat_appgia: {
    whatTheyDo: 'Lừa nạn nhân cài đặt ứng dụng chứa mã độc gián điệp (.apk) nhằm chiếm quyền điều khiển điện thoại từ xa, tự động chuyển tiền trong tài khoản.',
    scenarios: [
      'Giả danh cán bộ thuế hoặc công an phường hướng dẫn cập nhật CCCD cấp 2 trên VNeID.',
      'Gửi đường link lạ có đuôi .apk hoặc trang web giả mạo Cổng dịch vụ công quốc gia.',
      'Hướng dẫn nạn nhân vào mục Cài đặt bật quyền "Trợ năng" (Accessibility Service).',
    ],
    warningSigns: [
      'Ứng dụng không tải từ kho chính thức (Google Play Store hoặc Apple App Store).',
      'Điện thoại bị đen màn hình, đơ giật hoặc tự động bật sáng sau khi cài đặt.',
      'Tin nhắn ngân hàng báo trừ tiền vào ban đêm dù chủ tài khoản không thực hiện.',
    ],
    howToPrevent: [
      'Chỉ cài đặt ứng dụng từ Google Play hoặc App Store.',
      'Tuyệt đối không bao giờ bấm vào link cài file .apk do người lạ gửi qua Zalo/Facebook.',
      'Nếu lỡ cài đặt, bật ngay Chế độ máy bay (Airplane mode) và gọi ngân hàng khóa tài khoản.',
    ],
  },
  cat_linkgia: {
    whatTheyDo: 'Tạo các trang web giả mạo giao diện ngân hàng hoặc cổng quà tặng giống hệt bản thật để đánh cắp tên đăng nhập, mật khẩu và OTP.',
    scenarios: [
      'Tin nhắn SMS Brandname giả mạo báo tài khoản sắp bị khóa, yêu cầu đăng nhập xác thực.',
      'Link bình chọn cuộc thi ảnh, nhận quà tri ân kỷ niệm thành lập ngân hàng.',
      'Trang web mua sắm giá rẻ bất thường yêu cầu thanh toán trực tuyến.',
    ],
    warningSigns: [
      'Đường link có đuôi lạ (.top, .xyz, .cc, .vip, tên miền viết sai chính tả).',
      'Yêu cầu đăng nhập tài khoản ngân hàng trên trang web không có ổ khóa bảo mật.',
    ],
    howToPrevent: [
      'Trang web chính thức của VietinBank là vietinbank.vn.',
      'Không bao giờ đăng nhập tài khoản ngân hàng từ các đường link gửi qua tin nhắn.',
    ],
  },
  cat_dautu: {
    whatTheyDo: 'Dụ dỗ nạn nhân tham gia các sàn giao dịch ngoại hối, tiền điện tử, chứng khoán quốc tế với lời hứa hẹn sinh lời "khủng" 30-50%/tháng.',
    scenarios: [
      'Được thêm vào các hội nhóm Zalo/Telegram với hàng trăm thành viên khoe lãi tiền tỷ.',
      'Ban đầu nạp vài trăm nghìn thì rút được cả gốc lẫn lãi để tạo niềm tin.',
      'Khi nạp số tiền lớn (vài trăm triệu đến vài tỷ) thì bị khóa tài khoản, báo lỗi và bắt nạp thêm "thuế" mới cho rút.',
    ],
    warningSigns: [
      'Cam kết lợi nhuận phi thực tế, "bao lỗ", "đầu tư chắc thắng 100%".',
      'Tài khoản nạp tiền là số tài khoản cá nhân, không phải tài khoản công ty chứng khoán được cấp phép.',
    ],
    howToPrevent: [
      'Không có kênh đầu tư hợp pháp nào cam kết lợi nhuận 30-50% mỗi tháng.',
      'Chỉ đầu tư qua các công ty chứng khoán và tổ chức tài chính được Nhà nước cấp phép.',
    ],
  },
};

export function ScamTypesScreen({
  categories,
  stories,
  quizzes,
  onBack,
  onOpenStory,
  onOpenQuizForCategory,
}: ScamTypesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  // Published stories related to selected category
  const relatedStories = useMemo(() => {
    if (!selectedCategory) return [];
    return stories
      .filter(s => s.status === 'PUBLISHED' && s.category_id === selectedCategory.id)
      .slice(0, 3);
  }, [stories, selectedCategory]);

  // Check if there is any quiz for this category
  const categoryQuiz = useMemo(() => {
    if (!selectedCategory) return null;
    return quizzes.find(q => q.category_id === selectedCategory.id && q.status === 'active');
  }, [quizzes, selectedCategory]);

  const details = selectedCategory
    ? CATEGORY_KNOWLEDGE[selectedCategory.id] || {
        whatTheyDo: selectedCategory.description,
        scenarios: [
          'Đối tượng tiếp cận nạn nhân qua điện thoại, mạng xã hội hoặc tin nhắn SMS.',
          'Dùng thủ đoạn đe dọa hoặc đánh vào lòng tham để dẫn dắt nạn nhân làm theo kịch bản.',
        ],
        warningSigns: [
          'Tạo tâm lý sợ hãi, hoang mang hoặc nôn nóng.',
          'Yêu cầu giữ bí mật tuyệt đối với người thân và ngân hàng.',
          'Yêu cầu cung cấp OTP, mật khẩu hoặc chuyển tiền ngay.',
        ],
        howToPrevent: [
          'Luôn bình tĩnh, kiểm chứng thông tin qua các kênh chính thức của ngân hàng và cơ quan chức năng.',
          'Tuyệt đối không chuyển tiền theo bất kỳ yêu cầu đột ngột nào qua điện thoại.',
        ],
      }
    : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <button
          onClick={() => {
            if (selectedCategory) {
              setSelectedCategory(null);
            } else {
              onBack();
            }
          }}
          className="inline-flex items-center gap-2 py-2 px-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 active:scale-95 transition-all shadow-xs min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{selectedCategory ? '← Xem danh sách chiêu trò' : '← Trang chủ'}</span>
        </button>
        <span className="text-[11px] font-black uppercase text-blue-700 tracking-wider">
          NHẬN DIỆN CHIÊU TRÒ
        </span>
      </div>

      {/* VIEW 1: CATEGORY GRID (2 COLUMNS) */}
      {!selectedCategory ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 space-y-1">
            <h1 className="text-lg sm:text-xl font-black text-blue-950 tracking-tight flex items-center gap-2">
              <span>🔎 CÁC HÌNH THỨC LỪA ĐẢO THƯỜNG GẶP</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Chạm vào từng chiêu trò để xem kịch bản, dấu hiệu nhận biết và cách phòng ngừa:
            </p>
          </div>

          {/* Search inside Scam Types */}
          <div className="relative">
            <div className="relative flex items-center bg-white rounded-2xl border border-slate-300 shadow-xs focus-within:border-blue-600 transition-colors">
              <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm thủ đoạn (ví dụ: công an, app giả, vay vốn...)"
                className="w-full px-3 py-3 text-xs sm:text-sm rounded-2xl focus:outline-hidden text-slate-800 placeholder-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-2 mr-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2-Column Grid on Mobile */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {filteredCategories.map(cat => {
              const Icon = getIconForCategory(cat.icon);
              const storiesCount = stories.filter(
                s => s.status === 'PUBLISHED' && s.category_id === cat.id
              ).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-4 rounded-3xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md text-left transition-all active:scale-95 shadow-xs flex flex-col justify-between group min-h-[115px]"
                >
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition-all shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="pt-2">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-2">
                      {cat.name}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mt-1">
                      <span>{storiesCount} bài học</span>
                      <span className="text-blue-700 font-bold group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW 2: DETAILED SCAM VIEW ACCORDING TO SECTION IX */
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            {/* Category Title */}
            <div className="flex items-start gap-3.5 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-700/20">
                {(() => {
                  const Icon = getIconForCategory(selectedCategory.icon);
                  return <Icon className="w-6 h-6" />;
                })()}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">
                  CHI TIẾT THỦ ĐOẠN
                </span>
                <h1 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                  {selectedCategory.name}
                </h1>
              </div>
            </div>

            {/* 1. KẺ LỪA ĐẢO THƯỜNG LÀM GÌ? */}
            <div className="space-y-2">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <span>📌 KẺ LỪA ĐẢO THƯỜNG LÀM GÌ?</span>
              </h2>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                {details?.whatTheyDo}
              </div>
            </div>

            {/* 2. KỊCH BẢN THƯỜNG GẶP */}
            <div className="space-y-2">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <span>🎭 KỊCH BẢN THƯỜNG GẶP</span>
              </h2>
              <div className="space-y-2">
                {details?.scenarios.map((scen, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 font-medium"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{scen}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. DẤU HIỆU NHẬN BIẾT */}
            <div className="space-y-2">
              <h2 className="text-xs sm:text-sm font-black text-red-700 uppercase tracking-wide flex items-center gap-1.5">
                <span>🚨 DẤU HIỆU NHẬN BIẾT</span>
              </h2>
              <div className="space-y-1.5 bg-red-50/70 border border-red-200 rounded-2xl p-4">
                {details?.warningSigns.map((sign, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-red-950 font-bold">
                    <span className="text-red-600 font-black shrink-0">☑</span>
                    <span>{sign}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. CÁCH PHÒNG TRÁNH */}
            <div className="space-y-2">
              <h2 className="text-xs sm:text-sm font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                <span>🛡️ CÁCH PHÒNG TRÁNH</span>
              </h2>
              <div className="space-y-1.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                {details?.howToPrevent.map((prev, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-emerald-950 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{prev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. CÂU CHUYỆN THỰC TẾ LIÊN QUAN */}
            {relatedStories.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-700" />
                  <span>📖 CÂU CHUYỆN LIÊN QUAN ĐÃ XUẤT BẢN</span>
                </h2>
                <div className="space-y-2.5">
                  {relatedStories.map(st => (
                    <div
                      key={st.id}
                      onClick={() => onOpenStory(st)}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-all active:scale-98 flex items-center justify-between group"
                    >
                      <div className="space-y-1 pr-2">
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug group-hover:text-blue-700">
                          {st.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                          {st.situation}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-blue-700 whitespace-nowrap flex items-center gap-1 shrink-0">
                        Xem <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. LINK SANG QUIZ */}
            {categoryQuiz && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => onOpenQuizForCategory(selectedCategory.id)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-700/20 active:scale-98 transition-all min-h-[48px]"
                >
                  <BrainCircuit className="w-4 h-4 text-amber-300" />
                  <span>🧠 LÀM QUIZ VỀ CHIÊU TRÒ NÀY →</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
