import {
  APPLIED_STAGES,
  ELIGIBILITIES,
  OLD_STATUS_TO_STAGE,
  OPPORTUNITY_SCHEMA_VERSION,
  PRIORITIES,
  PRIORITY_CONFIG,
  REFERRAL_STATUSES,
  STAGES,
  TRACKS,
  generateId,
  isAppliedStage,
  normalizeEvent,
  normalizeOpportunity,
  normalizeTimestamp
} from '../domain/opportunity.js';
import { getResumeDisplayName } from '../domain/resume.js';

export const QUICK_VIEWS = Object.freeze({
  all: { label: 'All' },
  to_apply: { label: 'To Apply', stages: ['saved', 'ready'] },
  active: { label: 'Active', stages: ['applied', 'oa', 'interview'] },
  needs_visa_review: { label: 'Needs Visa Review', eligibility: 'needs_research' },
  watching: { label: 'Watching', stages: ['watching'] },
  archived: { label: 'Archived', archivedOnly: true }
});

export const TERMINAL_STAGES = Object.freeze(['offer', 'rejected', 'closed', 'withdrawn']);

const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const resolveNow = (now) => {
  const candidate = typeof now === 'function' ? now() : now;
  return normalizeTimestamp(candidate, Date.now());
};

const stringValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === '') return [];
  return [value];
};

const migrateVersion0To1 = (raw) => ({
  ...raw,
  schemaVersion: 1,
  stage: STAGES.includes(raw.stage)
    ? raw.stage
    : (OLD_STATUS_TO_STAGE[raw.status] || 'saved')
});

const migrateVersion1To2 = (raw) => ({
  ...raw,
  schemaVersion: 2,
  resumeNameSnapshot: raw.resumeNameSnapshot ?? raw.resumeDisplayName ?? raw.resumeName ?? ''
});

export function migrateOpportunity(rawOpportunity, options = {}) {
  if (!isPlainObject(rawOpportunity)) {
    return normalizeOpportunity({}, options);
  }

  let migrated = { ...rawOpportunity };
  let version = Number.isInteger(migrated.schemaVersion)
    ? migrated.schemaVersion
    : 0;

  if (version < 1) {
    migrated = migrateVersion0To1(migrated);
    version = 1;
  }

  if (version < 2) {
    migrated = migrateVersion1To2(migrated);
  }

  return normalizeOpportunity(migrated, options);
}

export function migrateOpportunities(input, options = {}) {
  let source = input;

  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      return [];
    }
  }

  if (isPlainObject(source)) {
    source = source.opportunities ?? source.applications ?? source.items ?? [];
  }

  if (!Array.isArray(source)) return [];

  return source
    .filter(isPlainObject)
    .map(item => migrateOpportunity(item, options));
}

export function appendStageChange(opportunity, nextStage, options = {}) {
  const now = resolveNow(options.now);
  const idFactory = options.generateId || generateId;
  const current = migrateOpportunity(opportunity, { ...options, now });

  if (!STAGES.includes(nextStage) || current.stage === nextStage) {
    return current;
  }

  const event = normalizeEvent({
    type: 'stage_changed',
    timestamp: now,
    fromStage: current.stage,
    toStage: nextStage,
    note: stringValue(options.note).trim()
  }, { now, generateId: idFactory });

  return {
    ...current,
    stage: nextStage,
    appliedAt: current.appliedAt ?? (isAppliedStage(nextStage) ? now : null),
    lastActivityAt: now,
    updatedAt: now,
    events: [...current.events, event],
    schemaVersion: OPPORTUNITY_SCHEMA_VERSION
  };
}

export function addTimelineNote(opportunity, note, options = {}) {
  const now = resolveNow(options.now);
  const idFactory = options.generateId || generateId;
  const current = migrateOpportunity(opportunity, { ...options, now });
  const trimmedNote = stringValue(note).trim();

  if (!trimmedNote) return current;

  const event = normalizeEvent({
    type: 'note',
    timestamp: normalizeTimestamp(options.timestamp, now),
    note: trimmedNote
  }, { now, generateId: idFactory });
  const savedAt = Math.max(
    now,
    normalizeTimestamp(current.updatedAt, now),
    normalizeTimestamp(current.lastActivityAt, now)
  );

  return {
    ...current,
    lastActivityAt: savedAt,
    updatedAt: savedAt,
    events: [...current.events, event]
  };
}

export function appendReferralRequest(opportunity, options = {}) {
  const now = resolveNow(options.now);
  const idFactory = options.generateId || generateId;
  const current = migrateOpportunity(opportunity, { ...options, now });
  const requestedAt = normalizeTimestamp(
    options.timestamp ?? options.referralRequestedAt,
    now
  );
  const referralContact = options.referralContact === undefined
    ? current.referralContact
    : stringValue(options.referralContact);
  const event = normalizeEvent({
    type: 'referral_requested',
    timestamp: requestedAt,
    note: referralContact.trim()
      ? `Referral requested from ${referralContact.trim()}`
      : 'Referral requested'
  }, { now: requestedAt, generateId: idFactory });

  return {
    ...current,
    referralStatus: 'requested',
    referralContact,
    referralRequestedAt: requestedAt,
    lastActivityAt: now,
    updatedAt: now,
    events: [...current.events, event]
  };
}

export function shouldRefreshResumeSnapshot(opportunity, patch = {}) {
  if (!isPlainObject(opportunity) || !isPlainObject(patch)) return false;
  const hasResumePatch = Object.prototype.hasOwnProperty.call(patch, 'resumeId');
  const nextResumeId = hasResumePatch ? patch.resumeId : opportunity.resumeId;
  if (!stringValue(nextResumeId).trim()) return false;

  const resumeChanged = hasResumePatch && nextResumeId !== opportunity.resumeId;
  const enteringAppliedStage = (
    Object.prototype.hasOwnProperty.call(patch, 'stage')
    && isAppliedStage(patch.stage)
    && !isAppliedStage(opportunity.stage)
  );
  return resumeChanged || enteringAppliedStage || !stringValue(opportunity.resumeNameSnapshot).trim();
}

export function backfillResumeNameSnapshots(opportunities, resumes) {
  const resumeNamesById = new Map(
    (Array.isArray(resumes) ? resumes : [])
      .filter(isPlainObject)
      .map(resume => [stringValue(resume.id).trim(), getResumeDisplayName(resume)])
      .filter(([id, displayName]) => id && displayName)
  );

  return (Array.isArray(opportunities) ? opportunities : []).map((opportunity) => {
    if (!isPlainObject(opportunity)) return opportunity;
    if (stringValue(opportunity.resumeNameSnapshot).trim()) return opportunity;

    const linkedResumeId = stringValue(opportunity.resumeId).trim();
    const displayName = linkedResumeId ? resumeNamesById.get(linkedResumeId) : '';
    return displayName
      ? { ...opportunity, resumeNameSnapshot: displayName }
      : opportunity;
  });
}

export function archiveOpportunity(opportunity, options = {}) {
  const now = resolveNow(options.now);
  const current = migrateOpportunity(opportunity, { ...options, now });
  return {
    ...current,
    archivedAt: current.archivedAt ?? now,
    lastActivityAt: now,
    updatedAt: now
  };
}

export function restoreOpportunity(opportunity, options = {}) {
  const now = resolveNow(options.now);
  const current = migrateOpportunity(opportunity, { ...options, now });
  return {
    ...current,
    archivedAt: null,
    lastActivityAt: now,
    updatedAt: now
  };
}

const TRACKING_QUERY_PARAMETERS = new Set([
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
  'ref',
  'source',
  'trk'
]);

export function toSafeHttpUrl(value) {
  const raw = stringValue(value).trim();
  if (!raw) return '';

  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

export function canonicalizeJobUrl(value) {
  const raw = stringValue(value).trim();
  if (!raw) return '';

  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    url.hash = '';
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');

    for (const key of [...url.searchParams.keys()]) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.startsWith('utm_') || TRACKING_QUERY_PARAMETERS.has(lowerKey)) {
        url.searchParams.delete(key);
      }
    }

    url.searchParams.sort();
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return url.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return raw
      .replace(/#.*$/, '')
      .replace(/\/+$/, '')
      .trim()
      .toLowerCase();
  }
}

const canonicalText = (value) => stringValue(value).trim().replace(/\s+/g, ' ').toLowerCase();

export function findOpportunityDuplicates(candidate, opportunities, options = {}) {
  const rawCandidate = isPlainObject(candidate) ? candidate : {};
  const candidateUrl = canonicalizeJobUrl(rawCandidate.jobUrl ?? rawCandidate.url);
  const candidateCompany = canonicalText(rawCandidate.company);
  const candidateReqId = canonicalText(rawCandidate.requisitionId ?? rawCandidate.reqId);
  const excludeId = stringValue(options.excludeId ?? rawCandidate.id).trim();
  const matches = [];

  for (const opportunity of Array.isArray(opportunities) ? opportunities : []) {
    if (!isPlainObject(opportunity) || (excludeId && opportunity.id === excludeId)) continue;

    const reasons = [];
    const existingUrl = canonicalizeJobUrl(opportunity.jobUrl ?? opportunity.url);
    if (candidateUrl && existingUrl && candidateUrl === existingUrl) {
      reasons.push('job_url');
    }

    const existingCompany = canonicalText(opportunity.company);
    const existingReqId = canonicalText(opportunity.requisitionId ?? opportunity.reqId);
    if (
      candidateCompany
      && candidateReqId
      && candidateCompany === existingCompany
      && candidateReqId === existingReqId
    ) {
      reasons.push('company_requisition_id');
    }

    if (reasons.length > 0) {
      matches.push({ opportunity, reasons });
    }
  }

  return matches;
}

const normalizeViewName = (value) => {
  const normalized = stringValue(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  const aliases = {
    toapply: 'to_apply',
    needsvisareview: 'needs_visa_review',
    visa_review: 'needs_visa_review'
  };
  return QUICK_VIEWS[normalized] ? normalized : (aliases[normalized] || 'all');
};

const matchesEnumFilter = (value, filterValue, allowed) => {
  const selections = asArray(filterValue)
    .map(item => stringValue(item).trim().toLowerCase())
    .filter(item => allowed.includes(item));
  return selections.length === 0 || selections.includes(value);
};

export function filterOpportunities(opportunities, filters = {}) {
  const source = Array.isArray(opportunities) ? opportunities : [];
  const viewName = normalizeViewName(filters.view ?? filters.quickView);
  const view = QUICK_VIEWS[viewName];
  const query = canonicalText(filters.search ?? filters.query);

  return source.filter((opportunity) => {
    if (!isPlainObject(opportunity)) return false;

    const isArchived = normalizeTimestamp(opportunity.archivedAt, null) !== null;
    if (view.archivedOnly) {
      if (!isArchived) return false;
    } else if (!filters.includeArchived && isArchived) {
      return false;
    }

    if (view.stages && !view.stages.includes(opportunity.stage)) return false;
    if (view.eligibility && opportunity.eligibility !== view.eligibility) return false;

    if (!matchesEnumFilter(opportunity.stage, filters.stages ?? filters.stage, STAGES)) return false;
    if (!matchesEnumFilter(opportunity.track, filters.tracks ?? filters.track, TRACKS)) return false;
    if (!matchesEnumFilter(opportunity.priority, filters.priorities ?? filters.priority, PRIORITIES)) return false;
    if (!matchesEnumFilter(
      opportunity.eligibility,
      filters.eligibilities ?? filters.eligibility,
      ELIGIBILITIES
    )) return false;
    if (!matchesEnumFilter(
      opportunity.referralStatus,
      filters.referralStatuses ?? filters.referralStatus,
      REFERRAL_STATUSES
    )) return false;

    if (query) {
      const haystack = [
        opportunity.company,
        opportunity.role,
        opportunity.requisitionId,
        opportunity.location,
        opportunity.notes
      ].map(canonicalText).join('\n');
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

export function getDeadlineState(deadlineAt, options = {}) {
  const now = resolveNow(options.now);
  const deadline = normalizeTimestamp(deadlineAt, null);
  if (deadline === null) return 'none';

  const calendarDay = (timestamp) => {
    const date = new Date(timestamp);
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  };
  const today = calendarDay(now);
  const deadlineDay = calendarDay(deadline);
  if (deadlineDay < today) return 'overdue';

  const soonWindowMs = Number.isFinite(options.soonWindowMs)
    ? options.soonWindowMs
    : 3 * 24 * 60 * 60 * 1000;
  return deadlineDay - today <= soonWindowMs ? 'soon' : 'upcoming';
}

export function getNextActionState(opportunity, options = {}) {
  if (!isPlainObject(opportunity)) return 'none';
  const now = resolveNow(options.now);
  const actionAt = normalizeTimestamp(opportunity.nextActionAt, null);
  if (actionAt === null) return 'none';
  if (actionAt < now) return 'overdue';

  const dueWindowMs = Number.isFinite(options.dueWindowMs)
    ? options.dueWindowMs
    : 24 * 60 * 60 * 1000;
  return actionAt - now <= dueWindowMs ? 'due_soon' : 'upcoming';
}

const priorityRank = (priority) => PRIORITY_CONFIG[priority]?.rank ?? 99;

const deadlineRank = (deadlineAt, now) => {
  const state = getDeadlineState(deadlineAt, { now });
  if (state === 'overdue') return 0;
  if (state === 'soon') return 1;
  if (state === 'upcoming') return 2;
  return 3;
};

export function sortOpportunities(opportunities, options = {}) {
  const now = resolveNow(options.now);
  const source = Array.isArray(opportunities)
    ? opportunities.filter(isPlainObject)
    : [];

  return [...source].sort((a, b) => {
    const aNextState = getNextActionState(a, { now });
    const bNextState = getNextActionState(b, { now });
    const aOverdue = aNextState === 'overdue' ? 0 : 1;
    const bOverdue = bNextState === 'overdue' ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;

    if (aOverdue === 0) {
      const nextActionDifference = normalizeTimestamp(a.nextActionAt, Infinity)
        - normalizeTimestamp(b.nextActionAt, Infinity);
      if (nextActionDifference !== 0) return nextActionDifference;
    }

    const aDeadlineRank = deadlineRank(a.deadlineAt, now);
    const bDeadlineRank = deadlineRank(b.deadlineAt, now);
    if (aDeadlineRank !== bDeadlineRank) return aDeadlineRank - bDeadlineRank;

    if (aDeadlineRank < 3) {
      const deadlineDifference = normalizeTimestamp(a.deadlineAt, Infinity)
        - normalizeTimestamp(b.deadlineAt, Infinity);
      if (deadlineDifference !== 0) return deadlineDifference;
    }

    const priorityDifference = priorityRank(a.priority) - priorityRank(b.priority);
    if (priorityDifference !== 0) return priorityDifference;

    const updatedDifference = normalizeTimestamp(b.updatedAt, 0)
      - normalizeTimestamp(a.updatedAt, 0);
    if (updatedDifference !== 0) return updatedDifference;

    const companyDifference = canonicalText(a.company).localeCompare(canonicalText(b.company));
    if (companyDifference !== 0) return companyDifference;
    return stringValue(a.id).localeCompare(stringValue(b.id));
  });
}

export function getStartOfWeek(value = Date.now(), weekStartsOn = 1) {
  const timestamp = normalizeTimestamp(value, Date.now());
  const date = new Date(timestamp);
  const startDay = Number.isInteger(weekStartsOn) && weekStartsOn >= 0 && weekStartsOn <= 6
    ? weekStartsOn
    : 1;
  const dayDifference = (date.getDay() - startDay + 7) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - dayDifference);
  return date.getTime();
}

export function getOpportunitySummary(opportunities, options = {}) {
  const now = resolveNow(options.now);
  const source = Array.isArray(opportunities) ? opportunities.filter(isPlainObject) : [];
  const activeRecords = source.filter(item => normalizeTimestamp(item.archivedAt, null) === null);
  const startOfWeek = getStartOfWeek(now, options.weekStartsOn ?? 1);
  const appliedRecords = activeRecords.filter(item => normalizeTimestamp(item.appliedAt, null) !== null);
  const appliedTrackCounts = {
    general_swe: 0,
    ai_systems_gpu: 0,
    robotics_hardware_research: 0,
    unclassified: 0
  };

  for (const opportunity of appliedRecords) {
    const track = TRACKS.includes(opportunity.track) ? opportunity.track : 'unclassified';
    appliedTrackCounts[track] += 1;
  }

  const classifiedAppliedTotal = appliedTrackCounts.general_swe
    + appliedTrackCounts.ai_systems_gpu
    + appliedTrackCounts.robotics_hardware_research;
  const appliedTrackRatios = {
    general_swe: classifiedAppliedTotal > 0
      ? appliedTrackCounts.general_swe / classifiedAppliedTotal
      : 0,
    ai_systems_gpu: classifiedAppliedTotal > 0
      ? appliedTrackCounts.ai_systems_gpu / classifiedAppliedTotal
      : 0,
    robotics_hardware_research: classifiedAppliedTotal > 0
      ? appliedTrackCounts.robotics_hardware_research / classifiedAppliedTotal
      : 0
  };

  return {
    total: activeRecords.length,
    archived: source.length - activeRecords.length,
    appliedThisWeek: appliedRecords.filter((item) => {
      const appliedAt = normalizeTimestamp(item.appliedAt, null);
      return appliedAt !== null && appliedAt >= startOfWeek && appliedAt <= now;
    }).length,
    toApply: activeRecords.filter(item => ['saved', 'ready'].includes(item.stage)).length,
    active: activeRecords.filter(item => ['applied', 'oa', 'interview'].includes(item.stage)).length,
    overdueNextActions: activeRecords.filter(item => (
      !TERMINAL_STAGES.includes(item.stage)
      && getNextActionState(item, { now }) === 'overdue'
    )).length,
    appliedTotal: appliedRecords.length,
    classifiedAppliedTotal,
    appliedTrackCounts,
    appliedTrackRatios
  };
}

export function prepareOpportunityImport(rawOpportunities, existingOpportunities = [], options = {}) {
  const now = resolveNow(options.now);
  const idFactory = options.generateId || generateId;
  const existingIds = new Set(
    (Array.isArray(existingOpportunities) ? existingOpportunities : [])
      .filter(isPlainObject)
      .map(item => stringValue(item.id).trim())
      .filter(Boolean)
  );
  const opportunities = [];
  let skipped = 0;
  let reassignedIds = 0;

  for (const rawOpportunity of Array.isArray(rawOpportunities) ? rawOpportunities : []) {
    if (!isPlainObject(rawOpportunity)) {
      skipped += 1;
      continue;
    }

    const normalized = migrateOpportunity(rawOpportunity, { now, generateId: idFactory });
    if (!normalized.company || !normalized.role) {
      skipped += 1;
      continue;
    }

    if (!normalized.id || existingIds.has(normalized.id)) {
      let attempt = 0;
      let nextId = '';
      do {
        nextId = idFactory('opp', now + opportunities.length + attempt);
        attempt += 1;
        if (attempt > 100 && (!nextId || existingIds.has(nextId))) {
          nextId = `opp-${now}-${opportunities.length}-${attempt}`;
        }
      } while (!nextId || existingIds.has(nextId));
      normalized.id = nextId;
      reassignedIds += 1;
    }

    existingIds.add(normalized.id);
    opportunities.push(normalized);
  }

  return { opportunities, skipped, reassignedIds };
}

export { APPLIED_STAGES };
