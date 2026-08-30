import { getOpportunitySummary } from '../../utils/opportunityData';
import { TRACK_CONFIG } from '../../domain/opportunity';
import { getConfigLabel } from './opportunityUi';

const TRACK_KEYS = [
  'general_swe',
  'ai_systems_gpu',
  'robotics_hardware_research'
];

const metricValue = (summary, keys, fallback = 0) => {
  for (const key of keys) {
    if (Number.isFinite(summary?.[key])) return summary[key];
  }
  return fallback;
};

const calculateTrackCounts = opportunities => {
  const counts = Object.fromEntries(TRACK_KEYS.map(track => [track, 0]));
  for (const opportunity of opportunities) {
    if (!opportunity?.appliedAt && !['applied', 'oa', 'interview', 'offer', 'rejected'].includes(opportunity?.stage)) {
      continue;
    }
    if (Object.hasOwn(counts, opportunity.track)) counts[opportunity.track] += 1;
  }
  return counts;
};

export default function OpportunitySummary({ opportunities = [], summary: suppliedSummary }) {
  const summary = suppliedSummary ?? getOpportunitySummary(opportunities);
  const trackCounts = summary?.appliedTrackCounts
    ?? summary?.appliedByTrack
    ?? summary?.trackCounts
    ?? calculateTrackCounts(opportunities);
  const classifiedApplied = TRACK_KEYS.reduce((total, track) => total + (trackCounts?.[track] ?? 0), 0);

  const metrics = [
    {
      label: 'Total records',
      value: metricValue(summary, ['total', 'totalCount'], opportunities.length)
    },
    {
      label: 'Applied this week',
      value: metricValue(summary, ['appliedThisWeek', 'weeklyApplied'])
    },
    {
      label: 'To apply',
      value: metricValue(summary, ['toApply', 'toApplyCount'])
    },
    {
      label: 'Active',
      value: metricValue(summary, ['active', 'activeCount'])
    },
    {
      label: 'Overdue actions',
      value: metricValue(summary, ['overdueNextActions', 'overdueActions', 'overdueCount'])
    }
  ];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm" aria-label="Opportunity summary">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map(metric => (
          <div key={metric.label} className="rounded-md bg-gray-50 px-3 py-2.5">
            <dt className="text-xs font-medium text-gray-500">{metric.label}</dt>
            <dd className="mt-0.5 text-xl font-semibold text-gray-900">{metric.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
          <span className="font-medium text-gray-600">Applied mix:</span>
          {TRACK_KEYS.map(track => {
            const count = trackCounts?.[track] ?? 0;
            const percentage = classifiedApplied > 0 ? Math.round((count / classifiedApplied) * 100) : 0;
            return (
              <span key={track} className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">
                {TRACK_CONFIG[track]?.shortLabel ?? getConfigLabel(TRACK_CONFIG, track)}: {count} ({percentage}%)
              </span>
            );
          })}
          {classifiedApplied === 0 && (
            <span className="text-gray-400">No classified applications yet.</span>
          )}
        </div>
      </div>
    </section>
  );
}
