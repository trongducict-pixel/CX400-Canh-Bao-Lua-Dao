import { ArrowRight, Eye, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Category, RiskLevel, Story } from '../types';

interface StoryCardProps {
  story: Story;
  category?: Category;
  onSelect: (story: Story) => void;
  featured?: boolean;
}

export function StoryCard({ story, category, onSelect, featured = false }: StoryCardProps) {
  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'RAT_CAO':
        return {
          label: 'Nguy cơ rất cao',
          color: 'text-red-700 bg-red-50 border-red-200',
          dot: 'bg-red-600',
          icon: ShieldAlert,
        };
      case 'CAO':
        return {
          label: 'Nguy cơ cao',
          color: 'text-orange-700 bg-orange-50 border-orange-200',
          dot: 'bg-orange-600',
          icon: AlertTriangle,
        };
      case 'TRUNG_BINH':
      default:
        return {
          label: 'Cảnh giác',
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          dot: 'bg-amber-600',
          icon: ShieldCheck,
        };
    }
  };

  const risk = getRiskBadge(story.risk_level);
  const RiskIcon = risk.icon;

  return (
    <article
      onClick={() => onSelect(story)}
      className={`group cursor-pointer rounded-2xl border transition-all duration-200 bg-white hover:border-blue-400 hover:shadow-md active:scale-[0.99] flex flex-col justify-between overflow-hidden ${
        featured ? 'border-blue-200 ring-1 ring-blue-100 shadow-xs' : 'border-slate-200'
      }`}
    >
      {/* Optional Card Image */}
      {story.image_url && (
        <div className="relative w-full h-40 overflow-hidden bg-slate-100">
          <img
            src={story.image_url}
            alt={story.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={e => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px] font-medium">
            <span className="flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-sm">
              <RiskIcon className="w-3.5 h-3.5 text-amber-300" />
              {risk.label}
            </span>
            <span className="bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-sm flex items-center gap-1 font-mono">
              <Eye className="w-3 h-3" />
              {(story.views_count || 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Metadata Row */}
          {!story.image_url && (
            <div className="flex items-center gap-2 text-xs font-semibold mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border font-bold ${risk.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                {risk.label}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 truncate">{category?.name || 'Chiêu trò lừa đảo'}</span>
            </div>
          )}

          {story.image_url && (
            <div className="text-[11px] font-semibold text-blue-700 tracking-wide uppercase mb-1">
              {category?.name || 'Thủ đoạn lừa đảo'}
            </div>
          )}

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
            {story.title}
          </h3>

          {/* Situation Preview */}
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {story.situation}
          </p>
        </div>

        {/* Action Link Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700 group-hover:text-blue-800">
          <span>Xem chi tiết & bài học</span>
          <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
