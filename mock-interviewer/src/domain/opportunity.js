export const OPPORTUNITY_SCHEMA_VERSION = 2;

export const STAGES = Object.freeze([
  'watching',
  'saved',
  'ready',
  'applied',
  'oa',
  'interview',
  'offer',
  'rejected',
  'closed',
  'withdrawn'
]);

export const STAGE_CONFIG = Object.freeze({
  watching: { label: 'Watching', color: 'bg-slate-100 text-slate-700' },
  saved: { label: 'Saved', color: 'bg-gray-100 text-gray-700' },
  ready: { label: 'Ready', color: 'bg-blue-100 text-blue-700' },
  applied: { label: 'Applied', color: 'bg-indigo-100 text-indigo-700' },
  oa: { label: 'OA', color: 'bg-cyan-100 text-cyan-700' },
  interview: { label: 'Interview', color: 'bg-yellow-100 text-yellow-800' },
  offer: { label: 'Offer', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  closed: { label: 'Closed', color: 'bg-zinc-100 text-zinc-700' },
  withdrawn: { label: 'Withdrawn', color: 'bg-orange-100 text-orange-700' }
});

export const TRACKS = Object.freeze([
  'unclassified',
  'general_swe',
  'ai_systems_gpu',
  'robotics_hardware_research'
]);

export const TRACK_CONFIG = Object.freeze({
  unclassified: { label: 'Unclassified', shortLabel: 'Unclassified' },
  general_swe: { label: 'General SWE / Backend / Infra', shortLabel: 'General SWE' },
  ai_systems_gpu: { label: 'AI Systems / GPU / Architecture', shortLabel: 'AI / GPU' },
  robotics_hardware_research: { label: 'Robotics / Hardware / Research', shortLabel: 'Robotics / Research' }
});

export const PRIORITIES = Object.freeze(['p0', 'p1', 'p2']);

export const PRIORITY_CONFIG = Object.freeze({
  p0: { label: 'P0', rank: 0, color: 'bg-red-100 text-red-700' },
  p1: { label: 'P1', rank: 1, color: 'bg-yellow-100 text-yellow-800' },
  p2: { label: 'P2', rank: 2, color: 'bg-gray-100 text-gray-700' }
});

export const ELIGIBILITIES = Object.freeze(['eligible', 'needs_research', 'blocked']);

export const ELIGIBILITY_CONFIG = Object.freeze({
  eligible: { label: 'Eligible', color: 'bg-green-100 text-green-700' },
  needs_research: { label: 'Needs Research', color: 'bg-yellow-100 text-yellow-800' },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-700' }
});

export const ELIGIBILITY_REASONS = Object.freeze([
  'none',
  'no_sponsorship',
  'us_person',
  'citizenship',
  'class_year',
  'degree_level',
  'export_control',
  'other'
]);

export const ELIGIBILITY_REASON_CONFIG = Object.freeze({
  none: { label: 'None' },
  no_sponsorship: { label: 'No Sponsorship' },
  us_person: { label: 'U.S. Person Requirement' },
  citizenship: { label: 'Citizenship Requirement' },
  class_year: { label: 'Class Year' },
  degree_level: { label: 'Degree Level' },
  export_control: { label: 'Export Control' },
  other: { label: 'Other' }
});

export const DISCOVERY_SOURCES = Object.freeze([
  'company_site',
  'handshake',
  'linkedin',
  'simplify',
  'alumni',
  'referral',
  'other'
]);

export const DISCOVERY_SOURCE_CONFIG = Object.freeze({
  company_site: { label: 'Company Site' },
  handshake: { label: 'Handshake' },
  linkedin: { label: 'LinkedIn' },
  simplify: { label: 'Simplify' },
  alumni: { label: 'Alumni' },
  referral: { label: 'Referral' },
  other: { label: 'Other' }
});

export const APPLICATION_CHANNELS = Object.freeze([
  'not_applied',
  'company_site',
  'handshake',
  'linkedin',
  'referral',
  'other'
]);

export const APPLICATION_CHANNEL_CONFIG = Object.freeze({
  not_applied: { label: 'Not Applied' },
  company_site: { label: 'Company Site' },
  handshake: { label: 'Handshake' },
  linkedin: { label: 'LinkedIn' },
  referral: { label: 'Referral' },
  other: { label: 'Other' }
});

export const REFERRAL_STATUSES = Object.freeze([
  'none',
  'possible',
  'requested',
  'received',
  'used'
]);

export const REFERRAL_STATUS_CONFIG = Object.freeze({
  none: { label: 'None' },
  possible: { label: 'Possible' },
  requested: { label: 'Requested' },
  received: { label: 'Received' },
  used: { label: 'Used' }
});

export const EVENT_TYPES = Object.freeze([
  'created',
  'stage_changed',
  'applied',
  'referral_requested',
  'note'
]);

export const OLD_STATUS_TO_STAGE = Object.freeze({
  sent: 'applied',
  read: 'applied',
  interviewing: 'interview',
  interviewed: 'interview',
  offer: 'offer',
  rejected: 'rejected'
});

// Closed and withdrawn can happen before an application is submitted, so they
// deliberately do not imply an applied date on their own.
export const APPLIED_STAGES = Object.freeze([
  'applied',
  'oa',
  'interview',
  'offer'
]);

const PLAIN_OBJECT = '[object Object]';

const isPlainObject = (value) => Object.prototype.toString.call(value) === PLAIN_OBJECT;

const toStringValue = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const toNullableString = (value) => {
  const stringValue = toStringValue(value).trim();
  return stringValue || null;
};

const normalizeEnum = (value, allowed, fallback) => {
  const normalized = toStringValue(value).trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
};

export const normalizeTimestamp = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') return fallback;

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : fallback;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;

    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const localDate = new Date(Number(year), Number(month) - 1, Number(day));
      return (
        localDate.getFullYear() === Number(year)
        && localDate.getMonth() === Number(month) - 1
        && localDate.getDate() === Number(day)
      ) ? localDate.getTime() : fallback;
    }

    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? numeric : fallback;
    }

    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const resolveNow = (now) => {
  const candidate = typeof now === 'function' ? now() : now;
  return normalizeTimestamp(candidate, Date.now());
};

export function generateId(prefix = 'item', now = Date.now(), random = Math.random) {
  const safePrefix = toStringValue(prefix, 'item').replace(/[^a-z0-9_-]/gi, '') || 'item';
  const timestamp = normalizeTimestamp(now, Date.now());
  const randomValue = typeof random === 'function' ? random() : random;
  const randomPart = Math.floor(Math.abs(Number(randomValue) || 0) * 0x100000000)
    .toString(36)
    .padStart(7, '0')
    .slice(-7);
  return `${safePrefix}-${timestamp.toString(36)}-${randomPart}`;
}

export const isAppliedStage = (stage) => APPLIED_STAGES.includes(stage);

export function normalizeEvent(rawEvent, options = {}) {
  const now = resolveNow(options.now);
  const idFactory = options.generateId || generateId;
  const raw = typeof rawEvent === 'string'
    ? { type: 'note', note: rawEvent }
    : (isPlainObject(rawEvent) ? rawEvent : {});
  const timestamp = normalizeTimestamp(
    raw.timestamp ?? raw.occurredAt ?? raw.at ?? raw.createdAt,
    now
  );
  const type = normalizeEnum(raw.type, EVENT_TYPES, raw.note || raw.message ? 'note' : 'created');

  return {
    id: toNullableString(raw.id) || idFactory('event', timestamp),
    type,
    timestamp,
    fromStage: raw.fromStage && STAGES.includes(raw.fromStage) ? raw.fromStage : null,
    toStage: raw.toStage && STAGES.includes(raw.toStage) ? raw.toStage : null,
    note: toStringValue(raw.note ?? raw.message).trim()
  };
}

const normalizeObjectArray = (value) => (
  Array.isArray(value) ? value.filter(isPlainObject).map(item => ({ ...item })) : []
);

export function normalizeOpportunity(rawOpportunity = {}, options = {}) {
  const now = resolveNow(options.now);
  const idFactory = options.generateId || generateId;
  const raw = isPlainObject(rawOpportunity) ? rawOpportunity : {};
  const legacyStatus = normalizeEnum(raw.status, Object.keys(OLD_STATUS_TO_STAGE), '');
  const inferredStage = OLD_STATUS_TO_STAGE[legacyStatus] || 'saved';
  const stage = normalizeEnum(raw.stage, STAGES, inferredStage);
  const createdAt = normalizeTimestamp(
    raw.createdAt ?? raw.discoveredAt ?? raw.appliedAt ?? raw.updatedAt,
    now
  );
  const discoveredAt = normalizeTimestamp(raw.discoveredAt, createdAt);
  const updatedAt = normalizeTimestamp(raw.updatedAt, createdAt);
  const suppliedAppliedAt = normalizeTimestamp(raw.appliedAt, null);
  const appliedAt = suppliedAppliedAt ?? (isAppliedStage(stage) ? now : null);
  const referralStatus = normalizeEnum(raw.referralStatus, REFERRAL_STATUSES, 'none');
  const referralRequestedAt = normalizeTimestamp(raw.referralRequestedAt, null)
    ?? (referralStatus === 'requested' ? now : null);
  const id = toNullableString(raw.id) || idFactory('opp', now);
  const rawEvents = Array.isArray(raw.events) ? raw.events : [];
  const events = rawEvents
    .filter(event => typeof event === 'string' || isPlainObject(event))
    .map(event => normalizeEvent(event, { now, generateId: idFactory }));

  if (!events.some(event => event.type === 'created')) {
    events.unshift(normalizeEvent({
      id: idFactory('event', createdAt),
      type: 'created',
      timestamp: createdAt,
      note: 'Opportunity created'
    }, { now: createdAt, generateId: idFactory }));
  }

  if (
    referralStatus === 'requested'
    && !events.some(event => event.type === 'referral_requested')
  ) {
    events.push(normalizeEvent({
      type: 'referral_requested',
      timestamp: referralRequestedAt,
      note: toStringValue(raw.referralContact).trim()
        ? `Referral requested from ${toStringValue(raw.referralContact).trim()}`
        : 'Referral requested'
    }, { now: referralRequestedAt, generateId: idFactory }));
  }

  return {
    schemaVersion: OPPORTUNITY_SCHEMA_VERSION,
    id,
    company: toStringValue(raw.company).trim(),
    role: toStringValue(raw.role ?? raw.position).trim(),
    jobUrl: toStringValue(raw.jobUrl ?? raw.url).trim(),
    requisitionId: toStringValue(raw.requisitionId ?? raw.reqId).trim(),
    location: toStringValue(raw.location).trim(),
    jobDescription: toStringValue(raw.jobDescription ?? raw.jd),

    track: normalizeEnum(raw.track, TRACKS, 'unclassified'),
    priority: normalizeEnum(raw.priority, PRIORITIES, 'p1'),
    eligibility: normalizeEnum(raw.eligibility, ELIGIBILITIES, 'needs_research'),
    eligibilityReason: normalizeEnum(raw.eligibilityReason, ELIGIBILITY_REASONS, 'none'),
    eligibilityNotes: toStringValue(raw.eligibilityNotes),

    stage,
    discoverySource: normalizeEnum(raw.discoverySource, DISCOVERY_SOURCES, 'other'),
    applicationChannel: normalizeEnum(raw.applicationChannel, APPLICATION_CHANNELS, 'not_applied'),

    referralStatus,
    referralContact: toStringValue(raw.referralContact),
    referralRequestedAt,

    postedAt: normalizeTimestamp(raw.postedAt, null),
    discoveredAt,
    deadlineAt: normalizeTimestamp(raw.deadlineAt, null),
    appliedAt,
    lastActivityAt: normalizeTimestamp(raw.lastActivityAt, updatedAt),
    nextAction: toStringValue(raw.nextAction),
    nextActionAt: normalizeTimestamp(raw.nextActionAt, null),

    resumeId: toNullableString(raw.resumeId),
    resumeNameSnapshot: toStringValue(
      raw.resumeNameSnapshot ?? raw.resumeDisplayName ?? raw.resumeName
    ).trim(),
    notes: toStringValue(raw.notes),

    events,
    sessions: normalizeObjectArray(raw.sessions),
    analysis: isPlainObject(raw.analysis) ? { ...raw.analysis } : null,

    archivedAt: normalizeTimestamp(raw.archivedAt, null),
    createdAt,
    updatedAt,

    // Kept during the transition so existing details views do not lose a
    // scheduled interview before the UI moves fully to nextActionAt/events.
    interviewDate: normalizeTimestamp(raw.interviewDate, null)
  };
}

export function createOpportunity(input = {}, options = {}) {
  const now = resolveNow(options.now);
  const raw = isPlainObject(input) ? input : {};
  return normalizeOpportunity({
    ...raw,
    stage: raw.stage || 'saved',
    discoveredAt: raw.discoveredAt ?? now,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
    lastActivityAt: raw.lastActivityAt ?? now,
    appliedAt: raw.appliedAt ?? null
  }, {
    ...options,
    now
  });
}
