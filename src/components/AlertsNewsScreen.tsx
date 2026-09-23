import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  AlertTriangle,
  Flame,
  ArrowRight,
  Volume2,
  VolumeX,
  Share2,
  Calendar,
  CheckCircle2,
  Lightbulb,
  BrainCircuit,
  X,
  ShieldCheck,
  PhoneCall,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react';
import { Category, QuizQuestion, Story, SystemSettings } from '../types';
import { store } from '../services/store';

interface AlertsNewsScreenProps {
  stories: Story[];
  categories: Category[];
  quizzes: QuizQuestion[];
  settings: SystemSettings;
  onBack: () => void;
  onOpenQuizForStory: (storyId?: string) => void;
  selectedStoryProp?: Story | null;
}

export function AlertsNewsScreen({
  stories,
  categories,
  quizzes,
  settings,
  onBack,
  onOpenQuizForStory,
  selectedStoryProp,
}: AlertsNewsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStory, setSelectedStory] = useState<Story | null>(selectedStoryProp || null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [votedStories, setVotedStories] = useState<Record<string, boolean>>({});

  const handleVoteHelpful = (storyId: string) => {
    if (votedStories[storyId]) return;
    store.voteStoryHelpful(storyId);
    setVotedStories(prev => ({ ...prev, [storyId]: true }));
    if (selectedStory && selectedStory.id === storyId) {
      setSelectedStory(prev => (prev ? { ...prev, helpful_votes: (prev.helpful_votes || 0) + 1 } : prev));
    }
  };

  // Sync if prop changes
  useEffect(() => {
    if (selectedStoryProp) {
      setSelectedStory(selectedStoryProp);
    }
  }, [selectedStoryProp]);

  // Clean up speech synthesis on unmount or story change
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedStory]);

  // ONLY PUBLISHED stories for public news feed
  const publishedStories = useMemo(() => {
    return stories.filter(s => s.status === 'PUBLISHED');
  }, [stories]);

  // Filter by search
  const filteredStories = useMemo(() => {
    if (!searchQuery.trim()) return publishedStories;
    const q = searchQuery.toLowerCase().trim();
    return publishedStories.filter(
      s =>
        s.title.toLowerCase().includes(q) ||
        s.situation.toLowerCase().includes(q) ||
        s.scam_method.toLowerCase().includes(q) ||
        s.warning_signs.some(w => w.toLowerCase().includes(q)) ||
        s.lesson.toLowerCase().includes(q)
    );
  }, [publishedStories, searchQuery]);

  // Check if current story has related quiz
  const storyQuiz = useMemo(() => {
    if (!selectedStory) return null;
    return (
      quizzes.find(q => q.story_id === selectedStory.id && q.status === 'active') ||
      quizzes.find(q => q.category_id === selectedStory.category_id && q.status === 'active')
    );
  }, [quizzes, selectedStory]);

  // Text-To-Speech handler
  const handleToggleVoice = () => {
    if (!('speechSynthesis' in window) || !selectedStory) return;

    if (isPlayingVoice) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(false);
      return;
    }

    window.speechSynthesis.cancel();

    const textToRead = `
      Cảnh giác lừa đảo: ${selectedStory.title}.
      Tình huống: ${selectedStory.situation}.
      Thủ đoạn kẻ gian: ${selectedStory.scam_method}.
      Bài học cảnh giác: ${selectedStory.lesson}.
    `;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.95;

    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingVoice(true);
  };

  const handleShare = () => {
    if (!selectedStory) return;
    const shareText = `⚠️ CẢNH GIÁC LỪA ĐẢO TỪ VIETINBANK: ${selectedStory.title}\n${selectedStory.lesson}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'RAT_CAO':
        return {
          label: '🔴 NGUY CƠ RẤT CAO',
          class: 'bg-red-600 text-white',
        };
      case 'CAO':
        return {
          label: '🔴 CẢNH BÁO CAO',
          class: 'bg-rose-600 text-white',
        };
      case 'TRUNG_BINH':
        return {
          label: '🟠 NGUY CƠ TRUNG BÌNH',
          class: 'bg-amber-600 text-white',
        };
      default:
        return {
          label: '🟢 CẢNH GIÁC',
          class: 'bg-emerald-600 text-white',
        };
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <button
          onClick={() => {
            if (selectedStory) {
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              setIsPlayingVoice(false);
              setSelectedStory(null);
            } else {
              onBack();
            }
          }}
          className="inline-flex items-center gap-2 py-2 px-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 active:scale-95 transition-all shadow-xs min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{selectedStory ? '← Danh sách bản tin' : '← Trang chủ'}</span>
        </button>
        <span className="text-[11px] font-black uppercase text-[#004B87] tracking-wider">
          BẢN TIN CẢNH BÁO – VIETINBANK
        </span>
      </div>

      {/* VIEW 1: STORY LIST */}
      {!selectedStory ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#003B70] via-[#004B87] to-[#005A9C] text-white rounded-3xl p-5 shadow-lg space-y-1.5 shadow-[#004B87]/15">
            <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-300" />
              <span>🚨 BẢN TIN CẢNH BÁO THỰC TẾ</span>
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 font-medium">
              Các câu chuyện người thật, việc thật đã được VietinBank thẩm định để phòng ngừa rủi ro tài sản:
            </p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="relative flex items-center bg-white rounded-2xl border border-slate-300 shadow-xs focus-within:border-[#004B87] transition-colors">
              <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm câu chuyện lừa đảo..."
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

          {/* Stories List */}
          {filteredStories.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
              <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Không tìm thấy bản tin phù hợp.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-blue-700 hover:underline"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredStories.map(story => {
                const badge = getRiskBadge(story.risk_level);
                return (
                  <div
                    key={story.id}
                    onClick={() => {
                      setSelectedStory(story);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-red-400 hover:shadow-md transition-all active:scale-98 cursor-pointer shadow-xs space-y-3 group"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-sm ${badge.class}`}
                        >
                          {badge.label}
                        </span>
                        {story.source_type === 'CUSTOMER' && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-sky-600" />
                            <span>Khách hàng chia sẻ</span>
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(story.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {story.image_url && (
                      <div className="rounded-2xl overflow-hidden max-h-44 bg-slate-100">
                        <img
                          src={story.image_url}
                          alt={story.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-red-700 transition-colors">
                      {story.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed font-medium">
                      {story.situation}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-red-600">
                      <span>Xem câu chuyện đầy đủ</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: FULL STORY DETAIL ACCORDING TO SECTION XII */
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
            {/* Story Header */}
            <div className="space-y-3 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-sm ${
                      getRiskBadge(selectedStory.risk_level).class
                    }`}
                  >
                    {getRiskBadge(selectedStory.risk_level).label}
                  </span>
                  {selectedStory.source_type === 'CUSTOMER' && (
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-sm bg-sky-100 text-[#004B87] border border-sky-300 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-[#004B87]" />
                      <span>CÂU CHUYỆN KHÁCH HÀNG CHIA SẺ</span>
                    </span>
                  )}
                </div>
                <span className="text-slate-400 font-mono text-xs flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(selectedStory.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                {selectedStory.title}
              </h1>

              {selectedStory.source_type === 'CUSTOMER' && (
                <div className="text-xs font-bold text-[#004B87] flex items-center gap-1.5 bg-[#004B87]/5 px-3 py-1.5 rounded-xl border border-[#004B87]/15">
                  <span>Người chia sẻ:</span>
                  <span className="text-slate-800">{selectedStory.author_name || 'Khách hàng chia sẻ'}</span>
                </div>
              )}

              {/* Action Toolbar: Voice Player & Share */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleToggleVoice}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    isPlayingVoice
                      ? 'bg-amber-600 text-white animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {isPlayingVoice ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  <span>{isPlayingVoice ? 'Đang đọc (Dừng)' : 'Nghe đọc bài'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all shadow-xs"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copiedShare ? 'Đã sao chép!' : 'Chia sẻ'}</span>
                </button>
              </div>
            </div>

            {/* Story Image if present */}
            {selectedStory.image_url && (
              <div className="rounded-2xl overflow-hidden max-h-64 bg-slate-100">
                <img
                  src={selectedStory.image_url}
                  alt={selectedStory.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* SECTION: CHUYỆN GÌ ĐÃ XẢY RA? */}
            <div className="space-y-2">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <span>📖 CHUYỆN GÌ ĐÃ XẢY RA?</span>
              </h2>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 font-normal leading-relaxed whitespace-pre-line">
                {selectedStory.situation}
              </div>
            </div>

            {/* SECTION: KẺ LỪA ĐẢO ĐÃ LÀM GÌ? */}
            <div className="space-y-2">
              <h2 className="text-xs sm:text-sm font-black text-red-700 uppercase tracking-wide flex items-center gap-1.5">
                <span>🎭 KẺ LỪA ĐẢO ĐÃ LÀM GÌ?</span>
              </h2>
              <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 text-xs sm:text-sm text-red-950 font-normal leading-relaxed whitespace-pre-line">
                {selectedStory.scam_method}
              </div>
            </div>

            {/* SECTION: DẤU HIỆU NHẬN BIẾT */}
            {selectedStory.warning_signs && selectedStory.warning_signs.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-black text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span>🚨 DẤU HIỆU NHẬN BIẾT</span>
                </h2>
                <div className="space-y-1.5 bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                  {selectedStory.warning_signs.map((sign, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-amber-950 font-medium">
                      <span className="text-amber-700 font-bold shrink-0">☑</span>
                      <span>{sign}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION: BẠN NÊN LÀM GÌ? */}
            {selectedStory.recommended_action && selectedStory.recommended_action.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs sm:text-sm font-black text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>🛡️ BẠN NÊN LÀM GÌ?</span>
                </h2>
                <div className="space-y-2 bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                  {selectedStory.recommended_action.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-emerald-950 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION: BÀI HỌC */}
            <div className="space-y-2">
              <h2 className="text-xs sm:text-sm font-black text-[#003B70] uppercase tracking-wide flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>💡 BÀI HỌC CỐT LÕI TỪ VIETINBANK</span>
              </h2>
              <div className="p-4 rounded-2xl bg-[#004B87]/5 border border-[#004B87]/20 text-xs sm:text-sm text-[#003B70] font-semibold leading-relaxed">
                {selectedStory.lesson}
              </div>
            </div>

            {/* FEEDBACK INTERACTION (SECTION LVIII) */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs sm:text-sm font-bold text-slate-800 text-center sm:text-left">
                Câu chuyện này có giúp bạn cảnh giác hơn không?
              </div>
              <button
                type="button"
                onClick={() => handleVoteHelpful(selectedStory.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs min-h-[42px] active:scale-95 ${
                  votedStories[selectedStory.id]
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white hover:bg-slate-100 text-[#004B87] border border-[#004B87]/30'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>
                  {votedStories[selectedStory.id]
                    ? 'Đã cảm ơn (Hữu ích)'
                    : `👍 Có, rất hữu ích (${selectedStory.helpful_votes || 12})`}
                </span>
              </button>
            </div>

            {/* QUIZ HOOK LINK (SECTION XII & XXXI) */}
            {storyQuiz && (
              <div className="pt-3 border-t border-slate-100">
                <div className="bg-[#004B87]/5 border border-[#004B87]/20 rounded-2xl p-4 text-center space-y-2">
                  <h3 className="text-xs sm:text-sm font-black text-[#003B70]">
                    🧠 THỬ XEM BẠN CÓ NHẬN RA CHIÊU TRÒ NÀY KHÔNG?
                  </h3>
                  <button
                    onClick={() => onOpenQuizForStory(selectedStory.id)}
                    className="w-full py-3 px-4 rounded-xl bg-[#004B87] hover:bg-[#003B70] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#004B87]/20 active:scale-98 transition-all min-h-[46px]"
                  >
                    <BrainCircuit className="w-4 h-4 text-[#00A3E0]" />
                    <span>LÀM QUIZ VỀ TÌNH HUỐNG NÀY →</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
