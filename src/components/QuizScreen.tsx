import { useState, useEffect, useRef } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  ArrowLeft,
  Smartphone,
  Link as LinkIcon,
  PhoneCall,
  Clock,
  BookOpen,
} from 'lucide-react';
import { QuizQuestion } from '../types';
import { store } from '../services/store';

interface QuizScreenProps {
  questions: QuizQuestion[];
  targetStoryId?: string;
  targetCategoryId?: string;
  onBack: () => void;
  onGoToScamTypes: () => void;
  onCompleteQuiz?: () => void;
}

export function QuizScreen({
  questions,
  targetStoryId,
  targetCategoryId,
  onBack,
  onGoToScamTypes,
  onCompleteQuiz,
}: QuizScreenProps) {
  const [activeQuizSet, setActiveQuizSet] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, boolean>>({});

  // Session Tracking & Prevention of Double Submissions
  const [quizSessionId, setQuizSessionId] = useState<string>(() =>
    `quiz_session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  );
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [hasSavedResult, setHasSavedResult] = useState(false);

  // Initialize quiz session
  const initQuiz = () => {
    let pool = [...questions].filter(q => q.status === 'active');
    if (pool.length === 0) return;

    if (targetStoryId) {
      const matchStory = pool.find(q => q.story_id === targetStoryId);
      if (matchStory) {
        pool = [matchStory, ...pool.filter(q => q.id !== matchStory.id)];
      }
    } else if (targetCategoryId) {
      const matchCategory = pool.find(q => q.category_id === targetCategoryId);
      if (matchCategory) {
        pool = [matchCategory, ...pool.filter(q => q.id !== matchCategory.id)];
      }
    }

    const shuffled = pool.slice(0, 5);
    setActiveQuizSet(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setUserAnswers({});
    setIsFinished(false);
    setHasSavedResult(false);
    setStartedAt(Date.now());
    setFinishedAt(null);
  };

  // Only re-init when target props change or on initial load
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedRef.current || targetStoryId || targetCategoryId) {
      hasInitializedRef.current = true;
      initQuiz();
    }
  }, [targetStoryId, targetCategoryId]);

  // Restart Quiz explicitly creating a new session
  const handleRestartQuiz = () => {
    const newSessionId = `quiz_session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    setQuizSessionId(newSessionId);
    initQuiz();
  };

  if (activeQuizSet.length === 0) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 py-2 px-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 active:scale-95 transition-all shadow-xs min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Trang chủ</span>
          </button>
        </div>
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold text-sm">Chưa có câu hỏi trắc nghiệm nào.</p>
        </div>
      </div>
    );
  }

  const currentQ = activeQuizSet[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correct_answer;
    if (isCorrect) {
      setScore(s => s + 1);
    }
    setUserAnswers(prev => ({ ...prev, [currentIndex]: isCorrect }));
  };

  // Finish quiz strictly, log results once and stop
  const finishQuiz = () => {
    if (hasSavedResult) return;

    // Calculate final score accurately from userAnswers map
    const answerEntries = Object.entries(userAnswers);
    const finalScore = answerEntries.filter(([, correct]) => correct).length;

    // Log result to store (local storage + sync queue + audit log)
    store.logQuizResult({
      quiz_id: activeQuizSet[0]?.id,
      story_id: targetStoryId,
      total_questions: activeQuizSet.length,
      correct_count: finalScore,
      score_ratio: activeQuizSet.length > 0 ? finalScore / activeQuizSet.length : 0,
      session_id: quizSessionId,
    });

    setScore(finalScore);
    setHasSavedResult(true);
    setFinishedAt(Date.now());
    setIsFinished(true);

    if (onCompleteQuiz) {
      onCompleteQuiz();
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < activeQuizSet.length) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const durationSeconds = finishedAt && startedAt ? Math.max(1, Math.round((finishedAt - startedAt) / 1000)) : 0;
  const accuracyPercent = Math.round((score / (activeQuizSet.length || 1)) * 100);
  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 py-2 px-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 active:scale-95 transition-all shadow-xs min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Trang chủ</span>
        </button>

        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {isFinished ? 'KẾT QUẢ' : `CÂU ${currentIndex + 1} / ${activeQuizSet.length}`}
        </span>
      </div>

      {/* Main Quiz Flow */}
      {!isFinished ? (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-[#003B70] via-[#004B87] to-[#005A9C] text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <BrainCircuit className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-wider text-amber-300">
                    Phản xạ tình huống
                  </div>
                  <h2 className="text-lg sm:text-xl font-black">TRẮC NGHIỆM AN TOÀN SỐ</h2>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md font-mono text-xs font-bold border border-white/20">
                {currentIndex + 1}/{activeQuizSet.length}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/20 h-2 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + (isAnswered ? 1 : 0)) / activeQuizSet.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Body */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 sm:p-6 space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-black text-[#004B87] uppercase tracking-wider">
                TÌNH HUỐNG {currentIndex + 1}
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {currentQ.question}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                let btnStyle =
                  'border-slate-200 bg-white hover:border-[#004B87] hover:bg-slate-50 text-slate-800 shadow-xs';
                let icon = null;

                if (isAnswered) {
                  if (idx === currentQ.correct_answer) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm';
                    icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
                  } else if (idx === selectedOption) {
                    btnStyle = 'border-rose-500 bg-rose-50 text-rose-950 shadow-sm';
                    icon = <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
                  } else {
                    btnStyle = 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-4 rounded-2xl border-2 text-left font-medium text-xs sm:text-sm flex items-start gap-3 transition-all ${btnStyle} min-h-[52px]`}
                  >
                    <span
                      className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isAnswered && idx === currentQ.correct_answer
                          ? 'bg-emerald-600 text-white'
                          : isAnswered && idx === selectedOption
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {optionLabels[idx]}
                    </span>
                    <span className="flex-1 pt-0.5 leading-relaxed font-bold">{opt}</span>
                    {icon}
                  </button>
                );
              })}
            </div>

            {/* Explanation box after answer */}
            {isAnswered && (
              <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                <div
                  className={`p-4 rounded-2xl border ${
                    selectedOption === currentQ.correct_answer
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/80 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-xs sm:text-sm mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {selectedOption === currentQ.correct_answer
                        ? 'Chính xác! Bạn rất cảnh giác.'
                        : 'Chưa chính xác! Hãy lưu ý kinh nghiệm này:'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700 font-medium">
                    {currentQ.explanation}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#004B87] hover:bg-[#003B70] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all min-h-[48px]"
                >
                  <span>
                    {currentIndex + 1 < activeQuizSet.length ? 'CÂU TIẾP THEO →' : 'XEM KẾT QUẢ →'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* QUIZ RESULT VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-center space-y-6 shadow-xs animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-[#004B87]/10 text-[#004B87] flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8 text-[#004B87]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-[#004B87] tracking-wider">
              KẾT QUẢ TRẮC NGHIỆM – VIETINBANK
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              🎉 BẠN ĐÃ HOÀN THÀNH!
            </h2>
            <p className="text-sm font-bold text-slate-700 pt-1">
              Bạn trả lời đúng <span className="text-[#004B87] text-xl font-black">{score}</span> /{' '}
              {activeQuizSet.length} câu
            </p>

            {/* Score & Timing Metrics */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm font-bold">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Tỷ lệ chính xác: {accuracyPercent}%
              </span>
              {durationSeconds > 0 && (
                <span className="px-3 py-1 rounded-full bg-sky-50 text-[#004B87] border border-sky-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Thời gian: {durationSeconds} giây</span>
                </span>
              )}
            </div>
          </div>

          {/* Recommendations based on Section XV */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-left space-y-3">
            <h3 className="text-xs sm:text-sm font-black text-slate-900">
              💡 BẠN NÊN TÌM HIỂU THÊM VỀ CÁC CHIÊU TRÒ NÀY:
            </h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-800">
                <Smartphone className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Cài đặt ứng dụng giả mạo (.apk chiếm quyền)</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-800">
                <LinkIcon className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Đường link giả mạo đánh cắp mã OTP</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-800">
                <PhoneCall className="w-4 h-4 text-[#004B87] shrink-0" />
                <span>Mạo danh cơ quan Công an yêu cầu chuyển tiền</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onGoToScamTypes}
              className="w-full py-3 px-4 rounded-2xl bg-[#004B87] hover:bg-[#003B70] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all mt-2 min-h-[46px]"
            >
              <BookOpen className="w-4 h-4" />
              <span>XEM CÁC CHIÊU TRÒ NÀY →</span>
            </button>
          </div>

          {/* 3 Main Action Buttons: LÀM LẠI QUIZ, XEM CÂU CHUYỆN, VỀ TRANG CHỦ */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={handleRestartQuiz}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#004B87] hover:bg-[#003B70] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors min-h-[46px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại Quiz</span>
            </button>

            <button
              type="button"
              onClick={onGoToScamTypes}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors min-h-[46px]"
            >
              <BookOpen className="w-4 h-4" />
              <span>Xem câu chuyện</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 px-4 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors min-h-[46px]"
            >
              <span>← Trang chủ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
