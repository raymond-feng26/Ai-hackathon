import { useState, useEffect, useRef } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function ScoreGuidePopover({ tiers, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const positionClass = align === 'center'
    ? 'left-1/2 -translate-x-1/2'
    : 'right-0';

  // Auto-detect range column width from longest range string
  const maxRangeLen = Math.max(...tiers.map(t => t.range.length));
  const rangeWidth = maxRangeLen > 4 ? 'w-14' : 'w-10';

  return (
    <div className="relative inline-flex items-center" ref={ref}>
      <button onClick={() => setOpen(v => !v)} aria-label="Scoring guide" className="text-gray-400 hover:text-gray-600 transition-colors">
        <QuestionMarkCircleIcon className="w-5 h-5" />
      </button>
      {open && (
        <div className={`absolute ${positionClass} top-7 z-20 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-4`}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Scoring Guide</p>
          <div className="space-y-2">
            {tiers.map(t => (
              <div key={t.range} className="flex items-start gap-2">
                <span className={`text-sm font-bold ${rangeWidth} flex-shrink-0 ${t.color}`}>{t.range}</span>
                <div>
                  <span className="text-sm font-semibold text-gray-800">{t.label} — </span>
                  <span className="text-sm text-gray-500">{t.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
