import React from 'react';

interface ProvenanceBadgeProps {
  type: 'MEASURED' | 'CALCULATED' | 'ESTIMATED' | 'DEMO DATA' | string;
  className?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ type, className = '' }) => {
  const norm = type.toUpperCase();

  if (norm.includes('DEMO') || norm.includes('SIMULAT')) {
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 ${className}`}
      >
        ⚡ SIMULATED (CALIBRATED)
      </span>
    );
  }

  if (norm.includes('MEASURED')) {
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${className}`}
      >
        ● MEASURED
      </span>
    );
  }

  if (norm.includes('CALCULATED')) {
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 ${className}`}
      >
        ◆ CALCULATED
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 ${className}`}
    >
      ▲ ESTIMATED
    </span>
  );
};
