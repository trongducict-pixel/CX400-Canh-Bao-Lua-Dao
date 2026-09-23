import { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Shield,
  Search,
  Flame,
  BrainCircuit,
  Lock,
} from 'lucide-react';
import { SuspiciousScamScreen } from './components/SuspiciousScamScreen';
import { ScamTypesScreen } from './components/ScamTypesScreen';
import { AlertsNewsScreen } from './components/AlertsNewsScreen';
import { QuizScreen } from './components/QuizScreen';
import { AdminPortal } from './components/AdminPortal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { store, useStore } from './services/store';
import { Story } from './types';

export type PublicScreen = 'home' | 'suspicious' | 'scam_types' | 'alerts' | 'quiz';

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* MAIN CONTAINER: Mobile-first 390px, responsive up to max-w-md / max-w-lg */}
      <main className="flex-1 w-full max-w-md sm:max-w-lg mx-auto px-4 pt-5 pb-10">
        {/* ======================================================== */}
        {/* SCREEN 0: TRANG CHỦ (TỐI GIẢN - 4 LỰA CHỌN DUY NHẤT)    */}
        {/* ======================================================== */}
        {currentScreen === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header: 🛡️ CX400 CẢNH GIÁC LỪA ĐẢO */}
            <header className="text-center pt-2 pb-1 space-y-1.5 select-none">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-700 via-sky-600 to-blue-800 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-700/20">
                <Shield className="w-7 h-7" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  CX400
                </h1>
                <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-blue-800">
                  CẢNH GIÁC LỪA ĐẢO
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Nhận biết sớm – Chủ động bảo vệ mình
              </p>
            </header>

            {/* 4 CORE BIG NAVIGATION CARDS */}
            <div className="space-y-3.5 pt-1">
              {/* CARD 1: 🆘 NGHI NGỜ BỊ LỪA? (Ưu tiên số 1) */}
              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('suspicious');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-600/20 border border-red-500 hover:border-red-400 active:scale-[0.98] transition-all flex flex-col justify-between group min-h-[145px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <ShieldAlert className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white font-black text-[10px] uppercase tracking-wider">
                    Ưu tiên xử lý
                  </span>
                </div>

                <div className="pt-3">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-1.5">
                    <span>🆘 NGHI NGỜ BỊ LỪA?</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-red-100 font-medium mt-1 leading-relaxed">
                    Bạn đang gặp tình huống đáng ngờ? Xem ngay cách xử lý an toàn.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end text-xs sm:text-sm font-black text-white/95">
                  <span className="group-hover:underline flex items-center gap-1">
                    XEM NGAY <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* CARD 2: 🔎 NHẬN DIỆN CHIÊU TRÒ */}
              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('scam_types');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-lg text-slate-900 shadow-xs active:scale-[0.98] transition-all flex flex-col justify-between group min-h-[135px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition-colors">
                    <Search className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-black text-[10px] uppercase tracking-wider">
                    11 Nhóm thủ đoạn
                  </span>
                </div>

                <div className="pt-3">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                    <span>🔎 NHẬN DIỆN CHIÊU TRÒ</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    Tìm hiểu các thủ đoạn lừa đảo thường gặp và dấu hiệu cảnh báo.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end text-xs sm:text-sm font-black text-blue-700">
                  <span className="group-hover:underline flex items-center gap-1">
                    XEM CHIÊU TRÒ <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* CARD 3: 🚨 BẢN TIN CẢNH BÁO */}
              <button
                type="button"
                onClick={() => {
                  setSelectedStoryForDetail(null);
                  setCurrentScreen('alerts');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-lg text-slate-900 shadow-xs active:scale-[0.98] transition-all flex flex-col justify-between group min-h-[135px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Flame className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-black text-[10px] uppercase tracking-wider">
                    Thực tế đã xảy ra
                  </span>
                </div>

                <div className="pt-3">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                    <span>🚨 BẢN TIN CẢNH BÁO</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    Những câu chuyện và tình huống lừa đảo thực tế đã được kiểm chứng.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end text-xs sm:text-sm font-black text-amber-700">
                  <span className="group-hover:underline flex items-center gap-1">
                    XEM BẢN TIN <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>

              {/* CARD 4: 🧠 QUIZ TRẮC NGHIỆM NHẬN DIỆN */}
              <button
                type="button"
                onClick={() => {
                  setTargetQuizStoryId(undefined);
                  setTargetQuizCategoryId(undefined);
                  setCurrentScreen('quiz');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-lg text-slate-900 shadow-xs active:scale-[0.98] transition-all flex flex-col justify-between group min-h-[135px]"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-black text-[10px] uppercase tracking-wider">
                    Thử thách phản xạ
                  </span>
                </div>

                <div className="pt-3">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                    <span>🧠 QUIZ – TRẮC NGHIỆM</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    Bạn có nhận ra chiêu trò? Kiểm tra phản xạ an toàn tài chính.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end text-xs sm:text-sm font-black text-indigo-700">
                  <span className="group-hover:underline flex items-center gap-1">
                    BẮT ĐẦU → <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </button>
            </div>

            {/* SECTION XVIII: DÀNH CHO CÁN BỘ (Kín đáo, màu xám nhẹ, font 11-12px) */}
            <div className="pt-8 pb-4 text-center select-none border-t border-slate-200/60 mt-8">
              <button
                type="button"
                onClick={() => setIsAdminOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 font-medium transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>🔐 Dành cho cán bộ</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SCREEN 1: 🆘 NGHI NGỜ BỊ LỪA?                            */}
        {/* ======================================================== */}
        {currentScreen === 'suspicious' && (
          <SuspiciousScamScreen
            settings={settings}
            onBack={() => {
              setCurrentScreen('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
            onBack={() => {
              setCurrentScreen('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
            onBack={() => {
              setSelectedStoryForDetail(null);
              setCurrentScreen('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
            onBack={() => {
              setTargetQuizStoryId(undefined);
              setTargetQuizCategoryId(undefined);
              setCurrentScreen('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGoToScamTypes={() => {
              setCurrentScreen('scam_types');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCompleteQuiz={() => store.trackEvent('quiz')}
          />
        )}
      </main>
    </div>
  );
}
