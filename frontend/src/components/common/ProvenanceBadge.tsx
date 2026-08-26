import React from 'react';

interface ProvenanceBadgeProps {
  type: 'MEASURED' | 'CALCULATED' | 'ESTIMATED' | 'DEMO DATA' | string;
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ type, className = '' }) => {
  const norm = type.toUpperCase();

  if (norm.includes('DEMO')) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/30 ${className}`}
      >
        DEMO DATA — NOT EXPERIMENTAL RESULTS
      </span>
    );
  }

  if (norm.includes('MEASURED')) {
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 ${className}`}
      >
        ● MEASURED
      </span>
    );
  }

  if (norm.includes('CALCULATED')) {
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-500 border border-blue-500/30 ${className}`}
      >
        ◆ CALCULATED
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30 ${className}`}
    >
      ▲ ESTIMATED
    </span>
  );
};
