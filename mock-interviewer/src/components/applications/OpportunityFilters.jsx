import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  STAGES,
  STAGE_CONFIG,
  TRACKS,
  TRACK_CONFIG,
  PRIORITIES,
  PRIORITY_CONFIG,
  ELIGIBILITIES,
  ELIGIBILITY_CONFIG,
  REFERRAL_STATUSES
} from '../../domain/opportunity';
import { QUICK_VIEWS as QUICK_VIEW_CONFIG } from '../../utils/opportunityData';
import {
  DEFAULT_OPPORTUNITY_FILTERS,
  getConfigLabel,
  getOptionValue,
  humanize
} from './opportunityUi';

const QUICK_VIEW_ORDER = [
  'all',
  'to_apply',
  'active',
  'needs_visa_review',
  'watching',
  'archived'
];

function FilterSelect({ label, name, value, options, config, onChange }) {
  return (
    <label className="block min-w-36 text-xs font-medium text-gray-600">
      {label}
      <select
        name={name}
        value={value || ''}
        onChange={event => onChange(name, event.target.value)}
        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">All</option>
        {options.map(option => {
          const optionValue = getOptionValue(option);
          return (
            <option key={optionValue} value={optionValue}>
              {config ? getConfigLabel(config, optionValue) : humanize(optionValue)}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export default function OpportunityFilters({
  filters = DEFAULT_OPPORTUNITY_FILTERS,
  onChange,
  onClear,
  viewCounts = {}
}) {
  const current = { ...DEFAULT_OPPORTUNITY_FILTERS, ...filters };

  const update = (field, value) => {
    onChange?.({ ...current, [field]: value });
  };

  const clearFilters = () => {
    if (onClear) onClear();
    else onChange?.({ ...DEFAULT_OPPORTUNITY_FILTERS });
  };

  const hasFilters = Object.entries(current).some(([key, value]) => (
    key === 'view' ? value !== 'all' : Boolean(value)
  ));

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm" aria-label="Opportunity filters">
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Quick views">
        {QUICK_VIEW_ORDER.map(viewKey => {
          const selected = current.view === viewKey;
          const count = viewCounts[viewKey];
          return (
            <button
              key={viewKey}
              type="button"
              aria-pressed={selected}
              onClick={() => update('view', viewKey)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {QUICK_VIEW_CONFIG[viewKey]?.label ?? humanize(viewKey)}
              {Number.isFinite(count) ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.5fr)_repeat(5,minmax(120px,1fr))_auto] lg:items-end">
        <label className="block text-xs font-medium text-gray-600">
          Search
          <span className="relative mt-1 block">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={current.search}
              onChange={event => update('search', event.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Company, role, req ID, location, notes"
            />
          </span>
        </label>

        <FilterSelect label="Stage" name="stage" value={current.stage} options={STAGES} config={STAGE_CONFIG} onChange={update} />
        <FilterSelect label="Track" name="track" value={current.track} options={TRACKS} config={TRACK_CONFIG} onChange={update} />
        <FilterSelect label="Priority" name="priority" value={current.priority} options={PRIORITIES} config={PRIORITY_CONFIG} onChange={update} />
        <FilterSelect label="Eligibility" name="eligibility" value={current.eligibility} options={ELIGIBILITIES} config={ELIGIBILITY_CONFIG} onChange={update} />
        <FilterSelect label="Referral" name="referralStatus" value={current.referralStatus} options={REFERRAL_STATUSES} onChange={update} />

        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasFilters}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <XMarkIcon className="mr-1 h-4 w-4" />
          Clear
        </button>
      </div>
    </section>
  );
}
