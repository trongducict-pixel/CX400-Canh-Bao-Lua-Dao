import { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Share2,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  Lightbulb,
  HelpCircle,
  PhoneCall,
  Calendar,
  User,
} from 'lucide-react';
import { Category, Story, SystemSettings } from '../types';

interface StoryDetailModalProps {
  story: Story | null;
  category?: Category;
  settings: SystemSettings;
  onClose: () => void;
  onOpenQuiz: (storyId?: string) => void;
  onOpenSos: () => void;
}

export function StoryDetailModal({
  story,
  category,
  settings,
  onClose,
  onOpenQuiz,
  onOpenSos,
}: StoryDetailModalProps) {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Stop voice on unmount or story close
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [story]);

  if (!story) return null;

  // Text-To-Speech handler
  const handleToggleVoice = () => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn chưa hỗ trợ tính năng đọc tự động.');
      return;
    }

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Prepare clear text for listening
    const textToRead = `
      Cảnh giác lừa đảo: ${story.title}.
      Chuyện gì đã xảy ra: ${story.situation}.
      Thủ đoạn của kẻ lừa đảo: ${story.scam_method}.
      Dấu hiệu nhận biết: ${story.warning_signs.join('. ')}.
      Cách xử lý: ${Array.isArray(story.recommended_action) ? story.recommended_action.join('. ') : story.recommended_action}.
      Bài học ghi nhớ: ${story.lesson}
    `;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.95; // Slightly slower for elderly listeners

    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingVoice(true);
  };

  // Share handler
  const handleShare = async () => {
    const shareTitle = `🛡️ CX400 CẢNH GIÁC LỪA ĐẢO: ${story.title}`;
    const shareText = `Bạn có nhận ra chiêu trò này không? "${story.title}" - Bài học cảnh giác bảo vệ tài khoản ngân hàng từ VietinBank Ninh Bình.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (e) {
        // Fallback to custom preview modal
      }
    }
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  // Format method steps
  const methodSteps = story.scam_method
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  const riskLabel =
    story.risk_level === 'RAT_CAO'
      ? 'MỨC ĐỘ CẢNH BÁO: RẤT CAO'
      : story.risk_level === 'CAO'
      ? 'MỨC ĐỘ CẢNH BÁO: CAO'
      : 'MỨC ĐỘ CẢNH BÁO: CẢNH GIÁC';

  const riskColor =
    story.risk_level === 'RAT_CAO'
      ? 'bg-red-600 text-white'
      : story.risk_level === 'CAO'
      ? 'bg-orange-600 text-white'
      : 'bg-amber-600 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden my-auto">
        {/* Sticky Header with Action Tools */}
        <div className="p-3.5 px-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide ${riskColor}`}>
              {riskLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Voice Reader Button */}
            <button
              onClick={handleToggleVoice}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isPlayingVoice
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title="Đọc to nội dung bằng giọng nói"
            >
              {isPlayingVoice ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isPlayingVoice ? 'Dừng đọc' : 'Đọc bài'}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
              title="Chia sẻ câu chuyện cảnh giác"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                setIsPlayingVoice(false);
                onClose();
              }}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors ml-1"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Story Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Main Title Section */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-blue-700 tracking-wide uppercase">
              {category?.name || 'Chiêu trò lừa đảo'}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {story.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1 border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Ghi nhận bởi: <strong>{story.author_name}</strong>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {story.published_at ? new Date(story.published_at).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
              </span>
            </div>
          </div>

          {/* Optional Illustration Banner */}
          {story.image_url && (
            <div className="rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-slate-100 max-h-56">
              <img
                src={story.image_url}
                alt={story.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* 1️⃣ CHUYỆN GÌ ĐÃ XẢY RA? */}
          <section className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm sm:text-base">
              <span className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center text-xs font-black shrink-0">
                1
              </span>
              <span>CHUYỆN GÌ ĐÃ XẢY RA?</span>
            </div>
            <div className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal pl-9">
              {story.situation}
            </div>
          </section>

          {/* 2️⃣ KẺ LỪA ĐẢO ĐÃ LÀM GÌ? */}
          <section className="bg-red-50/50 rounded-2xl p-4 sm:p-5 border border-red-200 space-y-3">
            <div className="flex items-center gap-2 text-red-900 font-extrabold text-sm sm:text-base">
              <span className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                2
              </span>
              <span>KẺ LỪA ĐẢO ĐÃ LÀM GÌ?</span>
            </div>
            <div className="space-y-2.5 pl-2 sm:pl-9">
              {methodSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-800 leading-relaxed">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                  <div>{step}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 3️⃣ 🚨 DẤU HIỆU NHẬN BIẾT */}
          <section className="bg-amber-50/60 rounded-2xl p-4 sm:p-5 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm sm:text-base">
              <span className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                3
              </span>
              <span>🚨 DẤU HIỆU NHẬN BIẾT CHIÊU TRÒ</span>
            </div>
            <div className="space-y-2.5 pl-2 sm:pl-9">
              {story.warning_signs.map((sign, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-amber-200/80 text-sm sm:text-base font-semibold text-slate-900 shadow-2xs"
                >
                  <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <span className="leading-snug">{sign}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 4️⃣ 🛡️ BẠN NÊN LÀM GÌ? */}
          <section className="bg-emerald-50/60 rounded-2xl p-4 sm:p-5 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm sm:text-base">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                4
              </span>
              <span>🛡️ BẠN NÊN LÀM GÌ ĐỂ TỰ BẢO VỆ?</span>
            </div>
            <div className="space-y-2 pl-2 sm:pl-9">
              {(Array.isArray(story.recommended_action)
                ? story.recommended_action
                : [story.recommended_action]
              ).map((act, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-emerald-200 text-sm sm:text-base text-slate-800 leading-relaxed font-medium shadow-2xs"
                >
                  {act}
                </div>
              ))}
            </div>
          </section>

          {/* 5️⃣ 💡 BÀI HỌC GHI NHỚ */}
          <section className="bg-gradient-to-br from-blue-900 to-sky-900 rounded-2xl p-5 text-white shadow-lg space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-amber-300" />
              <span>BÀI HỌC CỐT LÕI</span>
            </div>
            <blockquote className="text-base sm:text-lg font-bold leading-snug border-l-4 border-amber-400 pl-3">
              “{story.lesson}”
            </blockquote>
          </section>

          {/* Bottom Fast Action Buttons */}
          <div className="pt-2 space-y-3">
            {/* Quick Quiz Check */}
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-indigo-950">Kiểm tra kiến thức nhanh</div>
                  <div className="text-xs text-indigo-700">Bạn có nhận ra dấu hiệu lừa đảo trong tình huống này không?</div>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenQuiz(story.id);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-sm active:scale-95 transition-all"
              >
                <span>Làm Quiz ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* In-case of Emergency */}
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertOctagon className="w-6 h-6 text-red-600 shrink-0" />
                <div className="text-xs text-red-900 font-semibold leading-tight">
                  Đang gặp tình huống tương tự? Hãy để chúng tôi trợ giúp bạn!
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenSos();
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shrink-0 shadow-sm active:scale-95 transition-all"
              >
                Hỗ trợ khẩn cấp
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            VietinBank Ninh Bình đồng hành bảo vệ khách hàng
          </div>
          <button
            onClick={() => {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              setIsPlayingVoice(false);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all"
          >
            Đóng bài đọc
          </button>
        </div>
      </div>

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-blue-600" />
                Chia sẻ câu chuyện
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Social Preview Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-[11px] font-bold text-blue-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                CX400 – CẢNH GIÁC LỪA ĐẢO
              </div>
              <div className="text-xs font-bold text-slate-800 line-clamp-2">
                “Bạn có nhận ra chiêu trò này không? {story.title}”
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 font-medium">
                {story.situation}
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={copyShareLink}
                className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-700/20"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Đã sao chép link thành công!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép link gửi Zalo / Messenger</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
