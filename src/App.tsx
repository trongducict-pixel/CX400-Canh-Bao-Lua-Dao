import { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Search,
  Flame,
  BrainCircuit,
  Lock,
  PhoneCall,
  MapPin,
  ExternalLink,
  Building,
  MessageSquare,
} from 'lucide-react';
import { Header, VIETINBANK_LOGO_URL } from './components/Header';
import { SuspiciousScamScreen } from './components/SuspiciousScamScreen';
import { ScamTypesScreen } from './components/ScamTypesScreen';
import { AlertsNewsScreen } from './components/AlertsNewsScreen';
import { QuizScreen } from './components/QuizScreen';
import { ShareStoryScreen } from './components/ShareStoryScreen';
import { AdminPortal } from './components/AdminPortal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { store, useStore } from './services/store';
import { Story } from './types';

export type PublicScreen = 'home' | 'suspicious' | 'scam_types' | 'alerts' | 'quiz' | 'share_story';

export default function App() {
  const {
    currentUser,
    stories,
    categories,
    alerts,
    quizzes,
    users,
    settings,
    analytics,
  } = useStore();

  // Navigation screen: 'home' | 'suspicious' | 'scam_types' | 'alerts' | 'quiz'
  const [currentScreen, setCurrentScreen] = useState<PublicScreen>('home');

  // Deep linking between sub-screens
  const [selectedStoryForDetail, setSelectedStoryForDetail] = useState<Story | null>(null);
  const [targetQuizStoryId, setTargetQuizStoryId] = useState<string | undefined>(undefined);
  const [targetQuizCategoryId, setTargetQuizCategoryId] = useState<string | undefined>(undefined);

  // Admin / Staff portal modal
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSheetsOpen, setIsSheetsOpen] = useState(false);

  // Navigate to story detail inside AlertsNewsScreen
  const handleOpenStory = (story: Story) => {
    setSelectedStoryForDetail(story);
    setCurrentScreen('alerts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    store.incrementStoryViews(story.id);
  };

  // Navigate to quiz targeted to a story
  const handleOpenQuizForStory = (storyId?: string) => {
    setTargetQuizStoryId(storyId);
    setTargetQuizCategoryId(undefined);
    setCurrentScreen('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to quiz targeted to a category
  const handleOpenQuizForCategory = (categoryId: string) => {
    setTargetQuizCategoryId(categoryId);
    setTargetQuizStoryId(undefined);
    setCurrentScreen('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate back to Home
  const handleGoHome = () => {
    setSelectedStoryForDetail(null);
    setTargetQuizStoryId(undefined);
    setTargetQuizCategoryId(undefined);
    setCurrentScreen('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user is authenticated, render Authenticated Portal directly
  if (currentUser !== null) {
    return (
      <div className="min-h-screen bg-slate-100">
        <AdminPortal
          currentUser={currentUser}
          stories={stories}
          categories={categories}
          alerts={alerts}
          quizzes={quizzes}
          users={users}
          settings={settings}
          analytics={analytics}
          onClose={() => {
            store.logout();
            setCurrentScreen('home');
          }}
          onOpenSheetsModal={() => setIsSheetsOpen(true)}
          onPreviewStory={st => {
            handleOpenStory(st);
          }}
        />

        {/* Google Sheets Sync Modal (ADMIN ONLY) */}
        {isSheetsOpen && currentUser.role === 'ADMIN' && (
          <GoogleSheetsSyncModal
            isOpen={isSheetsOpen}
            onClose={() => setIsSheetsOpen(false)}
          />
        )}
      </div>
    );
  }

  // If user tapped "Dành cho cán bộ", show the clean login screen
  if (isAdminOpen) {
    return (
      <div className="min-h-screen bg-slate-100">
        <AdminPortal
          currentUser={null}
          stories={stories}
          categories={categories}
          alerts={alerts}
          quizzes={quizzes}
          users={users}
          settings={settings}
          analytics={analytics}
          onClose={() => setIsAdminOpen(false)}
          onOpenSheetsModal={() => setIsSheetsOpen(true)}
          onPreviewStory={st => {
            setIsAdminOpen(false);
            handleOpenStory(st);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900 flex flex-col justify-between selection:bg-[#004B87] selection:text-white font-sans antialiased">
      {/* ======================================================== */}
      {/* 1. TOP HEADBAR WITH OFFICIAL VIETINBANK LOGO (PERSISTENT) */}
      {/* ======================================================== */}
      <Header
        settings={settings}
        onGoHome={handleGoHome}
        onOpenSos={() => {
          setCurrentScreen('suspicious');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* MAIN CONTAINER: Mobile-first 390px, responsive up to max-w-lg */}
      <main className="flex-1 w-full max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5 pt-4 sm:pt-6 pb-12">
        {/* ======================================================== */}
        {/* SCREEN 0: TRANG CHỦ (CHUẨN THƯƠNG HIỆU VIETINBANK)       */}
        {/* ======================================================== */}
        {currentScreen === 'home' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* HERO BANNER - CHUẨN THƯƠNG HIỆU VIETINBANK */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#003B70] via-[#004B87] to-[#005A9C] text-white p-5 sm:p-6 shadow-xl shadow-[#004B87]/20 border border-[#00A3E0]/30 select-none">
              {/* Background watermark / decorative circle */}
              <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[#00A3E0]/15 blur-xl pointer-events-none" />

              <div className="relative space-y-3">
                {/* Official Bank Header Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] sm:text-[11px] font-bold tracking-wide text-white border border-white/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00A3E0]" />
                  <span>VIETINBANK NINH BÌNH – PHÒNG DVKH</span>
                </div>

                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-white flex items-center gap-2">
                    <span>CX400 – CẢNH GIÁC LỪA ĐẢO</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-sky-100 font-medium leading-relaxed">
                    Nhận biết sớm – Chủ động phòng ngừa – Bảo vệ an toàn tài sản ngân hàng
                  </p>
                </div>

                {/* 3 Core Trust Signals */}
                <div className="pt-2 grid grid-cols-3 gap-2 border-t border-white/15 text-[10px] sm:text-[11px] text-sky-100 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                    <span>Chính thống</span>
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                    <span>Cập nhật 24/7</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300 shrink-0"></span>
                    <span>Bảo mật 100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 CORE NAVIGATION CARDS (VIETINBANK BRANDED) */}
            <div className="space-y-3 pt-1">
              {/* CARD 1: 🆘 NGHI NGỜ BỊ LỪA? (Ưu tiên số 1 - Sắc đỏ VietinBank & Cứu hộ khẩn cấp) */}
              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('suspicious');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#D32F2F] via-[#E53935] to-[#C62828] text-white shadow-xl shadow-red-600/25 border-2 border-red-400/40 hover:border-white/50 active:scale-[0.98] transition-all flex flex-col justify-between group min-h-[148px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                    <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white font-black text-[10px] uppercase tracking-wider border border-white/30">
                    🚨 ƯU TIÊN KHẨN CẤP
                  </span>
                </div>

                <div className="pt-3">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>🆘 NGHI NGỜ BỊ LỪA?</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-red-100 font-medium mt-1 leading-relaxed">
                    Bạn đang gặp tình huống đáng ngờ? Xem ngay hướng dẫn xử lý an toàn tức thì.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end text-xs sm:text-sm font-black text-white">
                  <span className="group-hover:underline flex items-center gap-1">
                    XỬ LÝ NGAY <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* CARD 2: 🔎 NHẬN DIỆN CHIÊU TRÒ (VietinBank Blue Theme) */}
              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('scam_types');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-5 sm:p-6 rounded-3xl bg-white border-2 border-[#004B87]/20 hover:border-[#004B87] hover:shadow-xl hover:shadow-[#004B87]/10 text-slate-900 shadow-sm active:scale-[0.98] transition-all flex flex-col justify-between group min-h-[140px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="w-12 h-12 rounded-2xl bg-[#004B87]/10 text-[#004B87] flex items-center justify-center group-hover:bg-[#004B87] group-hover:text-white transition-all shadow-xs">
                    <Search className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#004B87]/10 text-[#004B87] font-black text-[10px] uppercase tracking-wider border border-[#004B87]/20">
                    11 Nhóm thủ đoạn
                  </span>
                </div>

                <div className="pt-3">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-[#003B70] flex items-center gap-1.5">
                    <span>🔎 NHẬN DIỆN CHIÊU TRÒ</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    Tìm hiểu các thủ đoạn lừa đảo thường gặp, kịch bản thao túng và cách phòng vệ.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end text-xs sm:text-sm font-black text-[#004B87]">
                  <span className="group-hover:underline flex items-center gap-1">
                    XEM CHIÊU TRÒ <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* CARD 3: 🚨 BẢN TIN CẢNH BÁO (VietinBank Security Alert) */}
              <button
                type="button"
                onClick={() => {
                  setSelectedStoryForDetail(null);
                  setCurrentScreen('alerts');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-5 sm:p-6 rounded-3xl bg-white border-2 border-amber-300/80 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10 text-slate-900 shadow-sm active:scale-[0.98] transition-all flex flex-col justify-between group min-h-[140px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
                    <Flame className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] uppercase tracking-wider border border-amber-300">
                    Câu chuyện thực tế
                  </span>
                </div>

                <div className="pt-3">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                    <span>🚨 BẢN TIN CẢNH BÁO</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    Những tình huống lừa đảo có thật đã được VietinBank kiểm chứng và đúc rút bài học.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end text-xs sm:text-sm font-black text-amber-700">
                  <span className="group-hover:underline flex items-center gap-1">
                    XEM BẢN TIN <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* CARD 4: 🧠 QUIZ TRẮC NGHIỆM NHẬN DIỆN (VietinBank Reflex Quiz) */}
              <button
                type="button"
                onClick={() => {
                  setTargetQuizStoryId(undefined);
                  setTargetQuizCategoryId(undefined);
                  setCurrentScreen('quiz');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-5 sm:p-6 rounded-3xl bg-white border-2 border-indigo-200 hover:border-[#004B87] hover:shadow-xl hover:shadow-indigo-500/10 text-slate-900 shadow-sm active:scale-[0.98] transition-all flex flex-col justify-between group min-h-[140px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="w-12 h-12 rounded-2xl bg-[#00A3E0]/15 text-[#004B87] flex items-center justify-center group-hover:bg-[#004B87] group-hover:text-white transition-all shadow-xs">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#004B87]/10 text-[#004B87] font-black text-[10px] uppercase tracking-wider border border-[#004B87]/20">
                    Thử thách phản xạ
                  </span>
                </div>

                <div className="pt-3">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                    <span>🧠 QUIZ – TRẮC NGHIỆM</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    Bạn có nhận ra chiêu trò? Kiểm tra phản xạ an toàn tài chính trong 2 phút.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end text-xs sm:text-sm font-black text-[#004B87]">
                  <span className="group-hover:underline flex items-center gap-1">
                    BẮT ĐẦU NGAY → <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* CARD 5: 💬 CHIA SẺ CÂU CHUYỆN CỦA MÌNH (Customer Story Submission) */}
              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('share_story');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-5 sm:p-6 rounded-3xl bg-white border-2 border-teal-200 hover:border-[#004B87] hover:shadow-xl hover:shadow-teal-500/10 text-slate-900 shadow-sm active:scale-[0.98] transition-all flex flex-col justify-between group min-h-[140px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-[#004B87] group-hover:text-white transition-all shadow-xs border border-teal-200">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-teal-100/70 text-teal-800 font-black text-[10px] uppercase tracking-wider border border-teal-200">
                    Cảnh giác cộng đồng
                  </span>
                </div>

                <div className="pt-3">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                    <span>💬 CHIA SẺ CÂU CHUYỆN CỦA MÌNH</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    Bạn đã từng gặp một vụ lừa đảo? Hãy chia sẻ để giúp người khác cảnh giác.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end text-xs sm:text-sm font-black text-teal-800 group-hover:text-[#004B87]">
                  <span className="group-hover:underline flex items-center gap-1">
                    CHIA SẺ NGAY → <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>
            </div>

            {/* VIETINBANK OFFICIAL FOOTER INFO */}
            <div className="mt-8 pt-6 border-t border-slate-200/90 text-center space-y-3 select-none">
              <div className="flex items-center justify-center gap-2">
                <img
                  src={VIETINBANK_LOGO_URL}
                  alt="VietinBank"
                  className="h-6 w-auto object-contain opacity-90"
                />
              </div>

              <div className="text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-[#004B87]">
                  NGÂN HÀNG TMCP CÔNG THƯƠNG VIỆT NAM – CHI NHÁNH NINH BÌNH
                </p>
                <p className="flex items-center justify-center gap-1 text-slate-500">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{settings.emergency_address}</span>
                </p>
                <p className="flex items-center justify-center gap-3 text-slate-500">
                  <span>
                    Hotline 24/7: <strong className="text-red-600">{settings.hotline_support}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    ĐT Chi nhánh: <strong>{settings.hotline_branch}</strong>
                  </span>
                </p>
              </div>

              {/* Discreet Staff Portal Link */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-[#004B87] font-semibold transition-colors py-1 px-3 rounded-lg hover:bg-slate-100"
                >
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>🔐 Dành cho cán bộ</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 1: 🆘 NGHI NGỜ BỊ LỪA?                            */}
        {/* ======================================================== */}
        {currentScreen === 'suspicious' && (
          <SuspiciousScamScreen
            settings={settings}
            onBack={handleGoHome}
          />
        )}

        {/* ======================================================== */}
        {/* SCREEN 2: 🔎 NHẬN DIỆN CHIÊU TRÒ                         */}
        {/* ======================================================== */}
        {currentScreen === 'scam_types' && (
          <ScamTypesScreen
            categories={categories}
            stories={stories}
            quizzes={quizzes}
            onBack={handleGoHome}
            onOpenStory={handleOpenStory}
            onOpenQuizForCategory={handleOpenQuizForCategory}
          />
        )}

        {/* ======================================================== */}
        {/* SCREEN 3: 🚨 BẢN TIN CẢNH BÁO                            */}
        {/* ======================================================== */}
        {currentScreen === 'alerts' && (
          <AlertsNewsScreen
            stories={stories}
            categories={categories}
            quizzes={quizzes}
            settings={settings}
            selectedStoryProp={selectedStoryForDetail}
            onBack={handleGoHome}
            onOpenQuizForStory={handleOpenQuizForStory}
          />
        )}

        {/* ======================================================== */}
        {/* SCREEN 4: 🧠 QUIZ TRẮC NGHIỆM                            */}
        {/* ======================================================== */}
        {currentScreen === 'quiz' && (
          <QuizScreen
            questions={quizzes}
            targetStoryId={targetQuizStoryId}
            targetCategoryId={targetQuizCategoryId}
            onBack={handleGoHome}
            onGoToScamTypes={() => {
              setCurrentScreen('scam_types');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCompleteQuiz={() => store.trackEvent('quiz')}
          />
        )}

        {/* ======================================================== */}
        {/* SCREEN 5: 💬 CHIA SẺ CÂU CHUYỆN CỦA MÌNH                 */}
        {/* ======================================================== */}
        {currentScreen === 'share_story' && (
          <ShareStoryScreen
            categories={categories}
            onBack={handleGoHome}
            onGoHome={handleGoHome}
          />
        )}
      </main>
    </div>
  );
}
