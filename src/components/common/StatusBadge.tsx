import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = (status || '').toLowerCase();

  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let dot = 'bg-slate-400';

  if (s.includes('active') || s.includes('approved') || s.includes('completed') || s.includes('paid')) {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dot = 'bg-emerald-500';
  } else if (s.includes('progress') || s.includes('scheduled') || s.includes('review') || s.includes('issued')) {
    bg = 'bg-blue-50 text-blue-700 border-blue-200';
    dot = 'bg-blue-500';
  } else if (s.includes('pending') || s.includes('allocated') || s.includes('partially') || s.includes('revisit')) {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    dot = 'bg-amber-500';
  } else if (s.includes('overdue') || s.includes('rejected') || s.includes('cancelled') || s.includes('inactive')) {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    dot = 'bg-rose-500';
  } else if (s.includes('hold') || s.includes('draft') || s.includes('unallocated')) {
    bg = 'bg-slate-100 text-slate-600 border-slate-200';
    dot = 'bg-slate-400';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      <span className="capitalize">{status}</span>
    </span>
  );
};
