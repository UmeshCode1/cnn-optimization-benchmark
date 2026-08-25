import React from 'react';

interface ProvenanceBadgeProps {
  type: 'MEASURED' | 'CALCULATED' | 'ESTIMATED' | 'DEMO DATA' | string;
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ type, className = '' }) => {
  const norm = type.toUpperCase();

  if (norm.includes('DEMO')) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-700/60 ${className}`}>
        DEMO DATA — NOT EXPERIMENTAL RESULTS
      </span>
    );
  }

  if (norm.includes('MEASURED')) {
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 ${className}`}>
        ● MEASURED
      </span>
    );
  }

  if (norm.includes('CALCULATED')) {
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-950/70 text-blue-300 border border-blue-700/50 ${className}`}>
        ◆ CALCULATED
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/70 text-amber-300 border border-amber-700/50 ${className}`}>
      ▲ ESTIMATED
    </span>
  );
};
