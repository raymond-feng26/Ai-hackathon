import { generateId, normalizeTimestamp } from './opportunity.js';

export const RESUME_SCHEMA_VERSION = 2;

export const RESUME_TARGET_TRACKS = Object.freeze([
  'general_swe',
  'ai_systems_gpu',
  'robotics_research',
  'general'
]);

export const RESUME_TARGET_TRACK_CONFIG = Object.freeze({
  general_swe: { label: 'General SWE / Infra' },
  ai_systems_gpu: { label: 'AI Systems / GPU' },
  robotics_research: { label: 'Robotics / Research' },
  general: { label: 'General' }
});

const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const resolveNow = (now) => {
  const candidate = typeof now === 'function' ? now() : now;
  return normalizeTimestamp(candidate, Date.now());
};

const stringValue = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const stripResumeExtension = (fileName) => (
  stringValue(fileName).replace(/\.(pdf|docx?)$/i, '').trim()
);

export function getResumeDisplayName(resume) {
  if (!isPlainObject(resume)) return '';
  return stringValue(
    resume.displayName
      ?? resume.name
      ?? stripResumeExtension(resume.fileName)
  ).trim();
}

export function normalizeResume(rawResume = {}, options = {}) {
  const now = resolveNow(options.now);
  const idFactory = options.generateId || generateId;
  const raw = isPlainObject(rawResume) ? rawResume : {};
  const uploadedAt = normalizeTimestamp(
    raw.uploadedAt ?? raw.createdAt ?? raw.updatedAt,
    now
  );
  const createdAt = normalizeTimestamp(raw.createdAt, uploadedAt);
  const targetTrackCandidate = stringValue(raw.targetTrack).trim().toLowerCase();
  const targetTrack = RESUME_TARGET_TRACKS.includes(targetTrackCandidate)
    ? targetTrackCandidate
    : 'general';
  const displayName = getResumeDisplayName(raw)
    || stripResumeExtension(raw.fileName)
    || 'Untitled Resume';

  return {
    schemaVersion: RESUME_SCHEMA_VERSION,
    id: stringValue(raw.id).trim() || idFactory('resume', now),
    displayName,
    // Keep name synchronized while legacy views still read resume.name.
    name: displayName,
    targetTrack,
    text: stringValue(raw.text),
    fileName: stringValue(raw.fileName).trim(),
    uploadedAt,
    createdAt,
    updatedAt: normalizeTimestamp(raw.updatedAt, uploadedAt),
    archivedAt: normalizeTimestamp(raw.archivedAt, null)
  };
}

export function createResume(input = {}, options = {}) {
  const now = resolveNow(options.now);
  const raw = isPlainObject(input) ? input : {};
  return normalizeResume({
    ...raw,
    uploadedAt: raw.uploadedAt ?? now,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
    archivedAt: raw.archivedAt ?? null
  }, {
    ...options,
    now
  });
}

export function createResumeSnapshot(resume) {
  const normalizedId = isPlainObject(resume) ? stringValue(resume.id).trim() : '';
  return {
    resumeId: normalizedId || null,
    resumeNameSnapshot: getResumeDisplayName(resume)
  };
}
