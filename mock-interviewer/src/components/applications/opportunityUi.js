export const humanize = (value) => {
  if (!value) return 'Unknown';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
};

export const DEFAULT_OPPORTUNITY_FILTERS = {
  view: 'all',
  search: '',
  stage: '',
  track: '',
  priority: '',
  eligibility: '',
  referralStatus: ''
};

export const getOptionValue = option => (
  typeof option === 'string' ? option : option?.value ?? option?.key ?? ''
);

export const getConfigLabel = (config, value) => (
  config?.[value]?.label ?? humanize(value)
);

const parseDateValue = (value) => {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return Number.isNaN(localDate.getTime()) ? null : localDate;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatOpportunityDate = value => {
  const date = parseDateValue(value);
  if (!date) return '';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const getDateUrgency = (value, warningDays = 3) => {
  const date = parseDateValue(value);
  if (!date) return { level: 'none', label: '', className: 'text-gray-500' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) {
    return {
      level: 'overdue',
      label: `${Math.abs(days)}d overdue`,
      className: 'font-semibold text-red-700'
    };
  }
  if (days === 0) {
    return { level: 'due', label: 'Due today', className: 'font-semibold text-amber-700' };
  }
  if (days <= warningDays) {
    return { level: 'soon', label: `In ${days}d`, className: 'font-medium text-amber-700' };
  }

  return { level: 'future', label: '', className: 'text-gray-600' };
};

export const selectClassName = (
  'w-full min-w-28 rounded-md border border-gray-200 bg-white px-2 py-1.5 '
  + 'text-xs text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
);
