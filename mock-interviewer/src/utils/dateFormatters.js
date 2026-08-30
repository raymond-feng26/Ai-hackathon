const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const NUMERIC_PATTERN = /^-?\d+(?:\.\d+)?$/;

const coerceDate = (value) => {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    const copy = new Date(value.getTime());
    return Number.isFinite(copy.getTime()) ? copy : null;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnlyMatch = trimmed.match(DATE_ONLY_PATTERN);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return (
      date.getFullYear() === Number(year)
      && date.getMonth() === Number(month) - 1
      && date.getDate() === Number(day)
    ) ? date : null;
  }

  if (NUMERIC_PATTERN.test(trimmed)) {
    const numericDate = new Date(Number(trimmed));
    return Number.isFinite(numericDate.getTime()) ? numericDate : null;
  }

  const date = new Date(trimmed);
  return Number.isFinite(date.getTime()) ? date : null;
};

const fallbackFromOptions = (options) => (
  typeof options === 'string' ? options : (options?.fallback ?? '')
);

export const isValidDateValue = (value) => coerceDate(value) !== null;

export const parseDateValue = (value, fallback = null) => {
  const date = coerceDate(value);
  return date ? date.getTime() : fallback;
};

export const formatDate = (value, options = {}) => {
  const date = coerceDate(value);
  if (!date) return fallbackFromOptions(options);
  const locale = typeof options === 'object' ? (options.locale || 'en-US') : 'en-US';
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatDateTime = (value, options = {}) => {
  const date = coerceDate(value);
  if (!date) return fallbackFromOptions(options);
  const locale = typeof options === 'object' ? (options.locale || 'en-US') : 'en-US';
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const pad = (value) => String(value).padStart(2, '0');

export const toDateInputValue = (value) => {
  const date = coerceDate(value);
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const toDateTimeInputValue = (value) => {
  const date = coerceDate(value);
  if (!date) return '';
  return `${toDateInputValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const toIsoString = (value) => {
  const date = coerceDate(value);
  return date ? date.toISOString() : '';
};
