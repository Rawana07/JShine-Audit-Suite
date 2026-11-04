import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
  onClick?: () => void;
  badge?: {
    text: string;
    variant?: 'neutral' | 'amber' | 'emerald' | 'blue' | 'rose';
  };
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  highlight = false,
  onClick,
  badge,
}) => {
  const badgeClasses = {
    neutral: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-100 text-amber-800 border border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    blue: 'bg-blue-100 text-blue-800 border border-blue-200',
    rose: 'bg-rose-100 text-rose-800 border border-rose-200',
  }[badge?.variant || 'neutral'];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={`rounded-xl border p-5 transition-all text-left ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 active:scale-[0.99]' : ''
      } ${
        highlight
          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
          : 'bg-white text-slate-900 border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-[11px] sm:text-xs font-semibold uppercase tracking-wider leading-snug ${
            highlight ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full whitespace-nowrap ${badgeClasses}`}>
              {badge.text}
            </span>
          )}
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${
              highlight ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2 flex-wrap">
        <div className="text-xl sm:text-2xl font-bold tracking-tight">{value}</div>
        {trend && (
          <span
            className={`text-xs font-semibold whitespace-nowrap ${
              trend.isPositive
                ? highlight ? 'text-emerald-400' : 'text-emerald-600'
                : highlight ? 'text-rose-400' : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <div
          className={`mt-1.5 text-xs leading-tight ${
            highlight ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};
