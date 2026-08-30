import {
  APPLICATION_CHANNELS,
  DISCOVERY_SOURCES,
  ELIGIBILITIES,
  ELIGIBILITY_REASONS,
  PRIORITIES,
  REFERRAL_STATUSES,
  STAGES,
  TRACKS,
  createOpportunity,
  generateId,
  normalizeTimestamp
} from '../domain/opportunity.js';
import { migrateOpportunity } from './opportunityData.js';
import { toIsoString } from './dateFormatters.js';

export const UTF8_BOM = '\uFEFF';

export const OPPORTUNITY_CSV_COLUMNS = Object.freeze([
  { key: 'id', header: 'ID', aliases: ['opportunity_id'] },
  { key: 'company', header: 'Company', required: true },
  { key: 'role', header: 'Role', required: true, aliases: ['position', 'title'] },
  { key: 'jobUrl', header: 'Job URL', aliases: ['url', 'job_link'] },
  { key: 'requisitionId', header: 'Requisition ID', aliases: ['req_id', 'requisition'] },
  { key: 'location', header: 'Location' },
  { key: 'track', header: 'Track' },
  { key: 'priority', header: 'Priority' },
  { key: 'eligibility', header: 'Eligibility' },
  { key: 'eligibilityReason', header: 'Eligibility Reason' },
  { key: 'eligibilityNotes', header: 'Eligibility Notes' },
  { key: 'stage', header: 'Stage', aliases: ['status'] },
  { key: 'discoverySource', header: 'Discovery Source', aliases: ['source'] },
  { key: 'applicationChannel', header: 'Application Channel', aliases: ['channel'] },
  { key: 'referralStatus', header: 'Referral Status' },
  { key: 'referralContact', header: 'Referral Contact' },
  { key: 'referralRequestedAt', header: 'Referral Requested At', type: 'date' },
  { key: 'postedAt', header: 'Posted At', type: 'date' },
  { key: 'discoveredAt', header: 'Discovered At', type: 'date' },
  { key: 'deadlineAt', header: 'Deadline At', type: 'date', aliases: ['deadline'] },
  { key: 'appliedAt', header: 'Applied At', type: 'date', aliases: ['applied_date'] },
  { key: 'lastActivityAt', header: 'Last Activity At', type: 'date' },
  { key: 'nextAction', header: 'Next Action' },
  { key: 'nextActionAt', header: 'Next Action At', type: 'date', aliases: ['next_action_date'] },
  { key: 'resumeId', header: 'Resume ID' },
  { key: 'resumeNameSnapshot', header: 'Resume Name', aliases: ['resume', 'resume_name_snapshot'] },
  { key: 'notes', header: 'Notes' },
  { key: 'createdAt', header: 'Created At', type: 'date' },
  { key: 'updatedAt', header: 'Updated At', type: 'date' }
]);

const ENUM_COLUMNS = Object.freeze({
  track: TRACKS,
  priority: PRIORITIES,
  eligibility: ELIGIBILITIES,
  eligibilityReason: ELIGIBILITY_REASONS,
  stage: STAGES,
  discoverySource: DISCOVERY_SOURCES,
  applicationChannel: APPLICATION_CHANNELS,
  referralStatus: REFERRAL_STATUSES
});

const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const stringValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const FORMULA_PREFIX = /^[\t\r\n ]*[=+\-@]/;

export function protectSpreadsheetFormula(value) {
  const text = stringValue(value);
  return FORMULA_PREFIX.test(text) ? `'${text}` : text;
}

export function unprotectSpreadsheetFormula(value) {
  const text = stringValue(value);
  return text.startsWith("'") && FORMULA_PREFIX.test(text.slice(1))
    ? text.slice(1)
    : text;
}

const quoteCsvField = (value, protectFormulas) => {
  const text = protectFormulas
    ? protectSpreadsheetFormula(value)
    : stringValue(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export function serializeCsv(rows, options = {}) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const headers = Array.isArray(options.headers) ? options.headers : null;
  const protectFormulas = options.protectFormulas !== false;
  const includeBom = options.includeBom !== false;
  const outputRows = headers ? [headers, ...sourceRows] : sourceRows;
  const csv = outputRows
    .map((row) => {
      const cells = Array.isArray(row) ? row : [];
      return cells.map(cell => quoteCsvField(cell, protectFormulas)).join(',');
    })
    .join('\r\n');
  return `${includeBom ? UTF8_BOM : ''}${csv}`;
}

export function parseCsv(input) {
  const source = stringValue(input).replace(/^\uFEFF/, '');
  const rows = [];
  const errors = [];
  const warnings = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let justClosedQuote = false;
  let rowNumber = 1;

  const finishField = () => {
    row.push(unprotectSpreadsheetFormula(field));
    field = '';
    justClosedQuote = false;
  };

  const finishRow = () => {
    finishField();
    rows.push(row);
    row = [];
    rowNumber += 1;
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          justClosedQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      if (field.length === 0 && !justClosedQuote) {
        inQuotes = true;
      } else {
        field += character;
        warnings.push({ row: rowNumber, message: 'Unexpected quote was treated as text.' });
      }
    } else if (character === ',') {
      finishField();
    } else if (character === '\r' || character === '\n') {
      finishRow();
      if (character === '\r' && source[index + 1] === '\n') index += 1;
    } else {
      if (justClosedQuote && !/\s/.test(character)) {
        warnings.push({ row: rowNumber, message: 'Unexpected text after a closing quote was preserved.' });
      }
      field += character;
    }
  }

  if (inQuotes) {
    errors.push({ row: rowNumber, message: 'Unclosed quoted field.' });
  }

  const endedWithLineBreak = /(?:\r\n|\r|\n)$/.test(source);
  if (field.length > 0 || row.length > 0 || (source.length > 0 && !endedWithLineBreak)) {
    finishField();
    rows.push(row);
  }

  return { rows, errors, warnings };
}

const formatExportValue = (opportunity, column) => {
  const value = opportunity[column.key];
  if (column.type === 'date') return toIsoString(value);
  return stringValue(value);
};

export function exportOpportunitiesCsv(opportunities, options = {}) {
  const source = Array.isArray(opportunities) ? opportunities : [];
  const rows = source
    .filter(isPlainObject)
    .map(item => migrateOpportunity(item, options))
    .filter(item => item.archivedAt === null)
    .map(item => OPPORTUNITY_CSV_COLUMNS.map(column => formatExportValue(item, column)));

  return serializeCsv(rows, {
    headers: OPPORTUNITY_CSV_COLUMNS.map(column => column.header),
    includeBom: options.includeBom !== false,
    protectFormulas: options.protectFormulas !== false
  });
}

const normalizeHeader = (value) => stringValue(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '');

const HEADER_TO_COLUMN = (() => {
  const result = new Map();
  for (const column of OPPORTUNITY_CSV_COLUMNS) {
    const aliases = [column.key, column.header, ...(column.aliases || [])];
    for (const alias of aliases) result.set(normalizeHeader(alias), column);
  }
  return result;
})();

const parseDateCell = (value, rowNumber, header, warnings) => {
  const text = stringValue(value).trim();
  if (!text) return null;
  const timestamp = normalizeTimestamp(text, null);
  if (timestamp === null) {
    warnings.push({ row: rowNumber, column: header, message: `Invalid date "${text}" was left empty.` });
  }
  return timestamp;
};

const normalizeEnumCell = (key, value, rowNumber, warnings) => {
  const text = stringValue(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!text) return undefined;
  const allowed = ENUM_COLUMNS[key];
  if (allowed.includes(text)) return text;
  warnings.push({
    row: rowNumber,
    column: key,
    message: `Unknown ${key} value "${value}" was replaced with its default.`
  });
  return undefined;
};

const createUniqueId = (idFactory, prefix, seed, usedIds) => {
  let attempt = 0;
  let candidate = '';
  do {
    candidate = idFactory(prefix, seed + attempt);
    attempt += 1;
    if (attempt > 100 && (!candidate || usedIds.has(candidate))) {
      candidate = `${prefix}-${seed}-${attempt}`;
    }
  } while (!candidate || usedIds.has(candidate));
  return candidate;
};

export function importOpportunitiesCsv(csvText, existingOpportunities = [], options = {}) {
  const parsed = parseCsv(csvText);
  const errors = [...parsed.errors];
  const warnings = [...parsed.warnings];
  const opportunities = [];

  if (parsed.rows.length === 0) {
    errors.push({ row: 1, message: 'The CSV file is empty.' });
    return { opportunities, errors, warnings, rowsImported: 0, rowsSkipped: 0 };
  }

  const headerRow = parsed.rows[0];
  const columnsByIndex = headerRow.map(header => HEADER_TO_COLUMN.get(normalizeHeader(header)) || null);
  const availableKeys = new Set(columnsByIndex.filter(Boolean).map(column => column.key));
  const missingRequired = OPPORTUNITY_CSV_COLUMNS
    .filter(column => column.required && !availableKeys.has(column.key));

  for (const column of missingRequired) {
    errors.push({ row: 1, column: column.header, message: `Missing required column: ${column.header}.` });
  }

  if (missingRequired.length > 0) {
    return {
      opportunities,
      errors,
      warnings,
      rowsImported: 0,
      rowsSkipped: Math.max(parsed.rows.length - 1, 0)
    };
  }

  const idFactory = options.generateId || generateId;
  const nowCandidate = typeof options.now === 'function' ? options.now() : options.now;
  const now = normalizeTimestamp(nowCandidate, Date.now());
  const existingIds = new Set(
    (Array.isArray(existingOpportunities) ? existingOpportunities : [])
      .filter(isPlainObject)
      .map(item => stringValue(item.id).trim())
      .filter(Boolean)
  );
  let rowsSkipped = 0;

  for (let rowIndex = 1; rowIndex < parsed.rows.length; rowIndex += 1) {
    const csvRow = parsed.rows[rowIndex];
    const rowNumber = rowIndex + 1;

    if (csvRow.every(cell => !stringValue(cell).trim())) continue;

    try {
      const raw = {};
      for (let columnIndex = 0; columnIndex < columnsByIndex.length; columnIndex += 1) {
        const column = columnsByIndex[columnIndex];
        if (!column) continue;
        const cell = unprotectSpreadsheetFormula(csvRow[columnIndex] ?? '');

        if (column.type === 'date') {
          raw[column.key] = parseDateCell(cell, rowNumber, column.header, warnings);
        } else if (ENUM_COLUMNS[column.key]) {
          const normalizedEnum = normalizeEnumCell(column.key, cell, rowNumber, warnings);
          if (normalizedEnum !== undefined) raw[column.key] = normalizedEnum;
        } else {
          raw[column.key] = cell;
        }
      }

      raw.company = stringValue(raw.company).trim();
      raw.role = stringValue(raw.role).trim();
      if (!raw.company || !raw.role) {
        errors.push({ row: rowNumber, message: 'Company and Role are required; this row was skipped.' });
        rowsSkipped += 1;
        continue;
      }

      const importedId = stringValue(raw.id).trim();
      if (!importedId || existingIds.has(importedId)) {
        if (importedId && existingIds.has(importedId)) {
          warnings.push({ row: rowNumber, column: 'ID', message: 'Duplicate ID was replaced with a new ID.' });
        }
        raw.id = createUniqueId(idFactory, 'opp', now + rowIndex, existingIds);
      }
      existingIds.add(raw.id);

      const opportunity = createOpportunity(raw, {
        now,
        generateId: idFactory
      });
      opportunities.push(opportunity);
    } catch (error) {
      errors.push({
        row: rowNumber,
        message: `This row could not be imported: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      rowsSkipped += 1;
    }
  }

  return {
    opportunities,
    errors,
    warnings,
    rowsImported: opportunities.length,
    rowsSkipped
  };
}

export const getOpportunityCsvFileName = (value = Date.now()) => {
  const date = new Date(normalizeTimestamp(value, Date.now()));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `opportunities-${year}-${month}-${day}.csv`;
};
