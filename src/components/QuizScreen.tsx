import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  ChevronRight,
  Smartphone,
  Link as LinkIcon,
  PhoneCall,
} from 'lucide-react';
import { QuizQuestion } from '../types';

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

  // Initialize quiz session (take 5 questions, prioritizing target story/category if present)
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
    setIsFinished(false);
  };

  useEffect(() => {
    initQuiz();
  }, [questions, targetStoryId, targetCategoryId]);

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

    if (idx === currentQ.correct_answer) {
      setScore(s => s + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < activeQuizSet.length) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      if (onCompleteQuiz) onCompleteQuiz();
    }
  };

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
        <span className="text-[11px] font-black uppercase text-[#004B87] tracking-wider">
          TRẮC NGHIỆM NHẬN DIỆN – VIETINBANK
        </span>
      </div>

      {!isFinished ? (
        /* QUESTION VIEW: 1 QUESTION PER SCREEN */
        <div className="space-y-4">
          {/* Progress Indicator */}
          <div className="bg-[#004B87]/5 border border-[#004B87]/20 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-[#004B87]" />
              <span className="text-xs sm:text-sm font-black text-[#003B70] uppercase tracking-wide">
                CÂU HỎI {currentIndex + 1} / {activeQuizSet.length}
              </span>
            </div>
            <div className="flex gap-1.5">
              {activeQuizSet.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i === currentIndex
                      ? 'w-6 bg-[#004B87]'
                      : i < currentIndex
                      ? 'w-2 bg-[#00A3E0]'
                      : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {currentQ.question}
            </h2>

            {/* Answer Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                let btnStyle = 'bg-slate-50 border-slate-200 hover:border-[#004B87] hover:bg-[#004B87]/5 text-slate-800';

                if (isAnswered) {
                  if (idx === currentQ.correct_answer) {
                    btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                  } else if (selectedOption === idx) {
                    btnStyle = 'bg-red-50 border-red-500 text-red-950 font-bold';
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 active:scale-98 min-h-[56px] ${btnStyle}`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isAnswered && idx === currentQ.correct_answer
                          ? 'bg-emerald-600 text-white'
                          : isAnswered && selectedOption === idx
                          ? 'bg-red-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700'
                      }`}
                    >
                      {optionLabels[idx]}
                    </span>
                    <span className="text-xs sm:text-sm leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Instant Feedback */}
            {isAnswered && (
              <div className="space-y-4 pt-3 border-t border-slate-100 animate-in fade-in duration-150">
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    selectedOption === currentQ.correct_answer
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-red-50 border-red-300 text-red-950'
                  }`}
                >
                  {selectedOption === currentQ.correct_answer ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-black text-xs sm:text-sm">
                      {selectedOption === currentQ.correct_answer
                        ? '✅ CHÍNH XÁC!'
                        : '❌ CHƯA CHÍNH XÁC!'}
                    </div>
                    <div className="text-xs sm:text-sm font-normal leading-relaxed">
                      {currentQ.explanation}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#004B87] hover:bg-[#003B70] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#004B87]/20 active:scale-98 transition-all min-h-[48px]"
                >
                  <span>
                    {currentIndex + 1 < activeQuizSet.length
                      ? 'CÂU TIẾP THEO →'
                      : 'XEM KẾT QUẢ →'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* QUIZ RESULT VIEW ACCORDING TO SECTION XV */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-center space-y-6 shadow-xs animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-[#004B87]/10 text-[#004B87] flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8 text-[#004B87]" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-[#004B87] tracking-wider">
              KẾT QUẢ TRẮC NGHIỆM – VIETINBANK
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              🎉 BẠN ĐÃ HOÀN THÀNH!
            </h2>
            <p className="text-sm font-bold text-slate-600 pt-1">
              Bạn trả lời đúng <span className="text-[#004B87] text-lg font-black">{score}</span> /{' '}
              {activeQuizSet.length} câu
            </p>
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
              onClick={onGoToScamTypes}
              className="w-full py-3 px-4 rounded-2xl bg-[#004B87] hover:bg-[#003B70] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all mt-2 min-h-[46px]"
            >
              <span>XEM CÁC CHIÊU TRÒ NÀY →</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={initQuiz}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors min-h-[46px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại Quiz</span>
            </button>

            <button
              onClick={onBack}
              className="flex-1 py-3 px-4 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors min-h-[46px]"
            >
              <span>Về Trang chủ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
