import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ProvenanceBadge } from './ProvenanceBadge';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  baselineValue?: string | number;
  deltaPct?: number;
  isHigherBetter?: boolean;
  provenance?: string;
  subtext?: string;
  highlight?: boolean;
  badgeLabel?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  baselineValue,
  deltaPct,
  isHigherBetter = true,
  provenance = 'MEASURED',
  subtext,
  highlight = false,
  badgeLabel,
}) => {
  const isPositive = deltaPct !== undefined && deltaPct > 0;
  const isNeutral = deltaPct === undefined || deltaPct === 0;
  const isGood = isHigherBetter ? isPositive : (deltaPct !== undefined && deltaPct < 0);

  return (
    <div
      className={`lab-card p-4 flex flex-col justify-between ${
        highlight ? 'border-blue-500/80 bg-blue-500/5' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs uppercase font-semibold tracking-wider text-[var(--text-muted)]">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {badgeLabel && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/30">
              {badgeLabel}
            </span>
          )}
          <ProvenanceBadge type={provenance} />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{value}</span>
        <span className="text-xs font-mono text-[var(--text-muted)]">{unit}</span>
      </div>

      <div className="mt-2 pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
        {baselineValue !== undefined ? (
          <span className="text-[var(--text-muted)] text-[11px]">
            Base:{' '}
            <span className="font-mono font-medium text-[var(--text-secondary)]">
              {baselineValue} {unit}
            </span>
          </span>
        ) : (
          <span className="text-[var(--text-muted)] text-[11px]">{subtext || ''}</span>
        )}

        {deltaPct !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold ${
              isGood
                ? 'text-emerald-500'
                : isNeutral
                ? 'text-[var(--text-muted)]'
                : 'text-rose-500'
            }`}
          >
            {deltaPct > 0 ? '+' : ''}
            {deltaPct.toFixed(1)}%
            {deltaPct > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : deltaPct < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
          </span>
        )}
      </div>
    </div>
  );
};
