import { useState, useEffect } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { QuizQuestion } from '../types';
import { store } from '../services/store';

interface QuizSectionProps {
  questions: QuizQuestion[];
  onCompleteQuiz: () => void;
  onExploreStories: () => void;
  targetStoryId?: string;
}

export function QuizSection({
  questions,
  onCompleteQuiz,
  onExploreStories,
  targetStoryId,
}: QuizSectionProps) {
  // Select up to 5 randomized questions, prioritizing targetStoryId if provided
  const [activeQuizSet, setActiveQuizSet] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<boolean[]>([]);

  // Initialize quiz session
  const initQuiz = () => {
    let pool = [...questions];
    if (pool.length === 0) return;

    // Put target story question first if matched
    if (targetStoryId) {
      const targetQ = pool.find(q => q.story_id === targetStoryId);
      if (targetQ) {
        pool = [targetQ, ...pool.filter(q => q.id !== targetQ.id)];
      }
    }

    // Shuffle slightly and slice 5
    const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, 5);
    setActiveQuizSet(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    setUserAnswers([]);
  };

  useEffect(() => {
    initQuiz();
  }, [questions, targetStoryId]);

  if (activeQuizSet.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
        <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-semibold text-sm">Chưa có câu hỏi trắc nghiệm nào.</p>
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
    setUserAnswers(prev => [...prev, isCorrect]);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < activeQuizSet.length) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      store.logQuizResult({
        quiz_id: activeQuizSet[0]?.id,
        story_id: targetStoryId,
        total_questions: activeQuizSet.length,
        correct_count: score,
        score_ratio: activeQuizSet.length > 0 ? score / activeQuizSet.length : 0,
        session_id: `quiz_session_${Date.now()}`,
      });
      setIsFinished(true);
      onCompleteQuiz();
    }
  };

  const accuracyPercent = Math.round((score / activeQuizSet.length) * 100);

  return (
    <div className="space-y-4">
      {/* Quiz Header Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <BrainCircuit className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="text-xs uppercase font-extrabold tracking-wider text-amber-300">
                Luyện tập phản xạ
              </div>
              <h2 className="text-lg sm:text-xl font-black">THỬ THÁCH 60 GIÂY</h2>
            </div>
          </div>
          {!isFinished && (
            <div className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md font-mono text-xs font-bold border border-white/20">
              Câu {currentIndex + 1}/{activeQuizSet.length}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!isFinished && (
          <div className="w-full bg-white/20 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + (isAnswered ? 1 : 0)) / activeQuizSet.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Main Quiz Body */}
      {!isFinished ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 sm:p-6 space-y-5">
          {/* Question Text */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              TÌNH HUỐNG {currentIndex + 1}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Options List */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === currentQ.correct_answer;

              let optionStyle =
                'border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-slate-50';

              if (isAnswered) {
                if (isCorrectAnswer) {
                  optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400 font-bold';
                } else if (isSelected && !isCorrectAnswer) {
                  optionStyle = 'border-red-400 bg-red-50 text-red-950 font-bold';
                } else {
                  optionStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 min-h-[52px] select-none ${optionStyle} ${
                    !isAnswered ? 'active:scale-[0.99]' : ''
                  }`}
                >
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm sm:text-base leading-snug flex-1 font-medium">
                    {opt}
                  </span>
                  {isAnswered && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {isAnswered && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Answer Explanation Feedback */}
          {isAnswered && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div
                className={`p-4 rounded-2xl border ${
                  selectedOption === currentQ.correct_answer
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm mb-1.5">
                  {selectedOption === currentQ.correct_answer ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>✅ CHÍNH XÁC!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span>❌ CHƯA CHÍNH XÁC!</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium leading-relaxed pl-7">
                  {currentQ.explanation}
                </p>
              </div>

              {/* Next Question CTA Button */}
              <button
                onClick={handleNextQuestion}
                className="w-full py-4 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-700/25 active:scale-98 transition-all"
              >
                <span>
                  {currentIndex + 1 < activeQuizSet.length ? 'Câu tiếp theo' : 'Xem kết quả'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Results Completion Card */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-400/30">
            <Award className="w-10 h-10 text-amber-950" />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-blue-700 uppercase tracking-widest">
              Hoàn thành bài tập
            </div>
            <h3 className="text-2xl font-black text-slate-900">🎉 BẠN ĐÃ HOÀN THÀNH</h3>
            <p className="text-xs text-slate-500 font-medium">
              Đánh giá mức độ cảnh giác trước các thủ đoạn công nghệ cao
            </p>
          </div>

          {/* Metric Stats */}
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-2xl font-black text-blue-900 font-mono">
                {score}/{activeQuizSet.length}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-0.5">Số câu trả lời đúng</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {accuracyPercent}%
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-0.5">Tỷ lệ chính xác</div>
            </div>
          </div>

          {/* Advice / Learning Focus */}
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-left space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 uppercase">
              <Sparkles className="w-4 h-4 text-sky-600" />
              Lời khuyên từ VietinBank Ninh Bình:
            </div>
            <p className="text-xs sm:text-sm text-sky-950 leading-relaxed font-medium">
              {accuracyPercent >= 80
                ? 'Tuyệt vời! Bạn có mức độ cảnh giác rất cao. Hãy tiếp tục chia sẻ các bài học này cho người thân và bạn bè để cùng nhau an toàn!'
                : 'Bạn cần chú ý hơn đối với các thủ đoạn giả mạo OTP và cuộc gọi xưng danh Công an/Ngân hàng. Hãy đọc thêm các câu chuyện thực tế bên dưới.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={initQuiz}
              className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại lượt khác</span>
            </button>
            <button
              onClick={onExploreStories}
              className="flex-1 py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-700/20 transition-all active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>Đọc câu chuyện thực tế</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
