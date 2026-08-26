import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Zap,
  HardDrive,
  Cpu,
  Target,
  Award,
} from 'lucide-react';
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

  // TailAdmin Icon mapping based on metric title
  const getIcon = () => {
    const t = title.toLowerCase();
    if (t.includes('accuracy')) return <Target className="w-4 h-4 text-[var(--success)]" />;
    if (t.includes('latency')) return <Zap className="w-4 h-4 text-[var(--accent)]" />;
    if (t.includes('size') || t.includes('model')) return <HardDrive className="w-4 h-4 text-[var(--warning)]" />;
    if (t.includes('energy')) return <Activity className="w-4 h-4 text-purple-400" />;
    return <Award className="w-4 h-4 text-[var(--accent)]" />;
  };

  const getIconBg = () => {
    const t = title.toLowerCase();
    if (t.includes('accuracy')) return 'bg-[var(--success)]/10 border-[var(--success)]/25';
    if (t.includes('latency')) return 'bg-[var(--accent)]/10 border-[var(--accent)]/25';
    if (t.includes('size') || t.includes('model')) return 'bg-[var(--warning)]/10 border-[var(--warning)]/25';
    if (t.includes('energy')) return 'bg-purple-500/10 border-purple-500/25';
    return 'bg-[var(--accent)]/10 border-[var(--accent)]/25';
  };

  return (
    <div
      className={`ws-panel p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
        highlight ? 'border-[var(--accent)] bg-[var(--surface-elevated)]' : ''
      }`}
    >
      {/* Card Top: TailAdmin Icon Container + Title & Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--text-secondary)] block">
              {title}
            </span>
            {badgeLabel && (
              <span className="text-[10px] font-mono font-bold text-[var(--accent)]">
                {badgeLabel}
              </span>
            )}
          </div>
        </div>

        <ProvenanceBadge type={provenance} />
      </div>

      {/* Metric Main Value */}
      <div className="flex items-baseline gap-2 my-3">
        <span className="text-2xl font-bold font-mono text-[var(--text-primary)] tracking-tight">
          {value}
        </span>
        <span className="text-xs font-mono text-[var(--text-muted)] font-medium">
          {unit}
        </span>
      </div>

      {/* Card Footer: Baseline & TailAdmin Percentage Delta Pill */}
      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
        {baselineValue !== undefined ? (
          <span className="text-[var(--text-muted)] text-[11px] font-mono">
            Baseline: <strong className="text-[var(--text-secondary)]">{baselineValue} {unit}</strong>
          </span>
        ) : (
          <span className="text-[var(--text-muted)] text-[11px]">{subtext || ''}</span>
        )}

        {deltaPct !== undefined && (
          <span
            className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              isGood
                ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30'
                : isNeutral
                ? 'bg-[var(--surface-secondary)] text-[var(--text-muted)] border-[var(--border)]'
                : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30'
            }`}
          >
            {deltaPct > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : deltaPct < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>
              {deltaPct > 0 ? '+' : ''}
              {deltaPct.toFixed(1)}%
            </span>
          </span>
        )}
      </div>
    </div>
  );
};
