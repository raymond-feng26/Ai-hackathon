import {
  OPPORTUNITY_SCHEMA_VERSION,
  generateId,
  normalizeTimestamp
} from '../domain/opportunity.js';
import {
  RESUME_SCHEMA_VERSION,
  normalizeResume
} from '../domain/resume.js';
import {
  backfillResumeNameSnapshots,
  migrateOpportunity,
  migrateOpportunities
} from './opportunityData.js';
import { toIsoString } from './dateFormatters.js';

export const BACKUP_FORMAT = 'mock-interviewer-full-backup';
export const BACKUP_SCHEMA_VERSION = 1;

const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const stringValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const resolveNow = (now) => {
  const candidate = typeof now === 'function' ? now() : now;
  return normalizeTimestamp(candidate, Date.now());
};

const getOpportunitySource = (value) => (
  Array.isArray(value?.opportunities)
    ? value.opportunities
    : (Array.isArray(value?.applications) ? value.applications : [])
);

export function createFullBackup(data = {}, options = {}) {
  const source = isPlainObject(data) ? data : {};
  const now = resolveNow(options.now);
  const idFactory = options.generateId || generateId;
  const resumes = (Array.isArray(source.resumes) ? source.resumes : [])
    .filter(isPlainObject)
    .map(resume => normalizeResume(resume, { now, generateId: idFactory }));
  const opportunities = backfillResumeNameSnapshots(migrateOpportunities(
    source.opportunities ?? source.applications ?? [],
    { now, generateId: idFactory }
  ), resumes);

  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    opportunitySchemaVersion: OPPORTUNITY_SCHEMA_VERSION,
    resumeSchemaVersion: RESUME_SCHEMA_VERSION,
    exportedAt: toIsoString(now),
    opportunities,
    resumes
  };
}

export function serializeFullBackup(data = {}, options = {}) {
  return JSON.stringify(createFullBackup(data, options), null, options.pretty === false ? 0 : 2);
}

export function validateFullBackup(input) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(input)) {
    return {
      valid: false,
      errors: ['Backup must be a JSON object.'],
      warnings
    };
  }

  if (input.format && input.format !== BACKUP_FORMAT) {
    errors.push('This file is not a Mock Interviewer full backup.');
  } else if (!input.format) {
    warnings.push('Legacy backup without a format marker was accepted.');
  }

  if (
    input.schemaVersion !== undefined
    && (!Number.isInteger(input.schemaVersion) || input.schemaVersion < 0)
  ) {
    errors.push('Backup schemaVersion must be a non-negative integer.');
  } else if (input.schemaVersion > BACKUP_SCHEMA_VERSION) {
    errors.push('This backup was created by a newer, unsupported app version.');
  }

  if (!Array.isArray(input.opportunities) && !Array.isArray(input.applications)) {
    errors.push('Backup must contain an opportunities array.');
  }

  if (input.resumes !== undefined && !Array.isArray(input.resumes)) {
    errors.push('Backup resumes must be an array.');
  } else if (input.resumes === undefined) {
    warnings.push('Backup has no resumes array; it will be restored as empty.');
  }

  const opportunitySource = getOpportunitySource(input);
  opportunitySource.forEach((opportunity, index) => {
    if (!isPlainObject(opportunity)) {
      warnings.push(`Opportunity ${index + 1} is invalid and will be skipped.`);
      return;
    }
    if (!stringValue(opportunity.company).trim() || !stringValue(opportunity.role ?? opportunity.position).trim()) {
      warnings.push(`Opportunity ${index + 1} has no company or role and will be skipped.`);
    }
  });

  if (Array.isArray(input.resumes)) {
    input.resumes.forEach((resume, index) => {
      if (!isPlainObject(resume)) {
        warnings.push(`Resume ${index + 1} is invalid and will be skipped.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

const ensureUniqueId = (candidate, usedIds, idFactory, prefix, now, offset) => {
  let id = stringValue(candidate).trim();
  let attempt = 0;
  while (!id || usedIds.has(id)) {
    id = idFactory(prefix, now + offset + attempt);
    attempt += 1;
    if (attempt > 100 && (!id || usedIds.has(id))) {
      id = `${prefix}-${now}-${offset}-${attempt}`;
    }
  }
  usedIds.add(id);
  return id;
};

export function restoreFullBackup(input, options = {}) {
  if (typeof input === 'string') return parseFullBackup(input, options);

  const validation = validateFullBackup(input);
  if (!validation.valid) {
    return {
      ok: false,
      opportunities: [],
      resumes: [],
      errors: validation.errors,
      warnings: validation.warnings,
      metadata: null
    };
  }

  const now = resolveNow(options.now);
  const idFactory = options.generateId || generateId;
  const warnings = [...validation.warnings];
  const opportunities = [];
  const resumes = [];
  const usedOpportunityIds = new Set();
  const usedResumeIds = new Set();

  getOpportunitySource(input).forEach((rawOpportunity, index) => {
    if (!isPlainObject(rawOpportunity)) return;
    if (!stringValue(rawOpportunity.company).trim() || !stringValue(rawOpportunity.role ?? rawOpportunity.position).trim()) return;

    try {
      const opportunity = migrateOpportunity(rawOpportunity, { now, generateId: idFactory });
      const uniqueId = ensureUniqueId(
        opportunity.id,
        usedOpportunityIds,
        idFactory,
        'opp',
        now,
        index
      );
      if (uniqueId !== opportunity.id) {
        warnings.push(`Opportunity ${index + 1} had a duplicate ID and received a new one.`);
      }
      opportunities.push({ ...opportunity, id: uniqueId });
    } catch (error) {
      warnings.push(
        `Opportunity ${index + 1} could not be restored: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

  const resumeSource = Array.isArray(input.resumes) ? input.resumes : [];
  resumeSource.forEach((rawResume, index) => {
    if (!isPlainObject(rawResume)) return;

    try {
      const resume = normalizeResume(rawResume, { now, generateId: idFactory });
      const uniqueId = ensureUniqueId(
        resume.id,
        usedResumeIds,
        idFactory,
        'resume',
        now,
        index
      );
      if (uniqueId !== resume.id) {
        warnings.push(`Resume ${index + 1} had a duplicate ID and received a new one.`);
      }
      resumes.push({ ...resume, id: uniqueId });
    } catch (error) {
      warnings.push(
        `Resume ${index + 1} could not be restored: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

  return {
    ok: true,
    opportunities: backfillResumeNameSnapshots(opportunities, resumes),
    resumes,
    errors: [],
    warnings,
    metadata: {
      format: input.format || 'legacy',
      schemaVersion: input.schemaVersion ?? 0,
      exportedAt: stringValue(input.exportedAt) || null
    }
  };
}

export function parseFullBackup(text, options = {}) {
  if (typeof text !== 'string' || !text.trim()) {
    return {
      ok: false,
      opportunities: [],
      resumes: [],
      errors: ['Backup file is empty.'],
      warnings: [],
      metadata: null
    };
  }

  try {
    return restoreFullBackup(JSON.parse(text.replace(/^\uFEFF/, '')), options);
  } catch (error) {
    return {
      ok: false,
      opportunities: [],
      resumes: [],
      errors: [`Backup is not valid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      metadata: null
    };
  }
}

export const getBackupFileName = (value = Date.now()) => {
  const date = new Date(normalizeTimestamp(value, Date.now()));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `mock-interviewer-backup-${year}-${month}-${day}.json`;
};
