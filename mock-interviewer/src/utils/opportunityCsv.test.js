import test from 'node:test';
import assert from 'node:assert/strict';

import {
  UTF8_BOM,
  exportOpportunitiesCsv,
  getOpportunityCsvFileName,
  importOpportunitiesCsv,
  parseCsv,
  serializeCsv
} from './opportunityCsv.js';
import { backfillResumeNameSnapshots } from './opportunityData.js';

const NOW = Date.UTC(2026, 7, 29, 12, 0, 0);

const createIdFactory = () => {
  let counter = 0;
  return (prefix) => `${prefix}-${counter += 1}`;
};

test('RFC4180 serialization round-trips commas, quotes, newlines, and formulas', () => {
  const csv = serializeCsv([
    ['Acme, Inc.', 'He said "hello"', 'line one\nline two', '=HYPERLINK("https://bad")']
  ], {
    headers: ['Company', 'Quote', 'Notes', 'Formula']
  });

  assert.equal(csv.startsWith(UTF8_BOM), true);
  assert.match(csv, /"Acme, Inc\."/);
  assert.match(csv, /"He said ""hello"""/);
  assert.match(csv, /"'=HYPERLINK/);

  const parsed = parseCsv(csv);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.rows, [
    ['Company', 'Quote', 'Notes', 'Formula'],
    ['Acme, Inc.', 'He said "hello"', 'line one\nline two', '=HYPERLINK("https://bad")']
  ]);
});

test('opportunity export excludes archived rows and safely round-trips core fields', () => {
  const idFactory = createIdFactory();
  const source = [{
    id: 'opp-1',
    company: '=Malicious Company',
    role: 'GPU, Systems Engineer',
    jobUrl: 'https://example.com/jobs/1',
    requisitionId: 'REQ-1',
    location: 'St. Louis, MO',
    track: 'ai_systems_gpu',
    priority: 'p0',
    eligibility: 'needs_research',
    eligibilityReason: 'export_control',
    eligibilityNotes: 'Ask recruiter',
    stage: 'applied',
    discoverySource: 'linkedin',
    applicationChannel: 'company_site',
    referralStatus: 'requested',
    referralContact: 'Alum "A"',
    referralRequestedAt: NOW - 2000,
    discoveredAt: NOW - 5000,
    appliedAt: NOW - 1000,
    nextAction: '@follow up',
    nextActionAt: NOW + 1000,
    resumeId: 'resume-1',
    resumeNameSnapshot: 'AI Resume v3',
    notes: 'First line\nSecond line',
    createdAt: NOW - 5000,
    updatedAt: NOW,
    archivedAt: null,
    sessions: [{ id: 'not-in-csv' }]
  }, {
    id: 'archived',
    company: 'Archived',
    role: 'Role',
    stage: 'saved',
    archivedAt: NOW
  }];

  const csv = exportOpportunitiesCsv(source, { now: NOW, generateId: idFactory });
  assert.match(csv, /"'=Malicious Company"/);
  assert.doesNotMatch(csv, /"Archived"/);

  const imported = importOpportunitiesCsv(csv, [], { now: NOW, generateId: idFactory });
  assert.equal(imported.errors.length, 0);
  assert.equal(imported.rowsImported, 1);
  assert.equal(imported.opportunities[0].company, '=Malicious Company');
  assert.equal(imported.opportunities[0].role, 'GPU, Systems Engineer');
  assert.equal(imported.opportunities[0].notes, 'First line\nSecond line');
  assert.equal(imported.opportunities[0].stage, 'applied');
  assert.equal(imported.opportunities[0].appliedAt, NOW - 1000);
  assert.equal(imported.opportunities[0].resumeNameSnapshot, 'AI Resume v3');
});

test('CSV import skips bad rows without losing good rows and defaults missing fields', () => {
  const csv = serializeCsv([
    ['Good Co', 'Engineer', 'not-a-stage', 'bad-date'],
    ['Missing Role', '', 'saved', ''],
    ['Another Co', 'Researcher', '', '']
  ], {
    headers: ['Company', 'Role', 'Stage', 'Deadline At']
  });

  const result = importOpportunitiesCsv(csv, [], {
    now: NOW,
    generateId: createIdFactory()
  });

  assert.equal(result.rowsImported, 2);
  assert.equal(result.rowsSkipped, 1);
  assert.equal(result.errors.length, 1);
  assert.equal(result.warnings.length >= 2, true);
  assert.equal(result.opportunities[0].stage, 'saved');
  assert.equal(result.opportunities[0].deadlineAt, null);
  assert.equal(result.opportunities[1].stage, 'saved');
});

test('CSV import can backfill a linked legacy resume while preserving supplied snapshots', () => {
  const csv = serializeCsv([
    ['Legacy Co', 'Engineer', 'resume-legacy', ''],
    ['Historical Co', 'Researcher', 'resume-legacy', 'Actually submitted v1']
  ], {
    headers: ['Company', 'Role', 'Resume ID', 'Resume Name']
  });
  const imported = importOpportunitiesCsv(csv, [], {
    now: NOW,
    generateId: createIdFactory()
  });
  const backfilled = backfillResumeNameSnapshots(imported.opportunities, [{
    id: 'resume-legacy',
    displayName: 'Current renamed resume'
  }]);

  assert.equal(imported.errors.length, 0);
  assert.equal(backfilled[0].resumeNameSnapshot, 'Current renamed resume');
  assert.equal(backfilled[1].resumeNameSnapshot, 'Actually submitted v1');
});

test('CSV import reports missing headers, malformed quotes, and duplicate IDs', () => {
  const missingHeaders = importOpportunitiesCsv('Company\r\nAcme');
  assert.equal(missingHeaders.rowsImported, 0);
  assert.match(missingHeaders.errors[0].message, /Missing required column: Role/);

  const malformed = parseCsv('"Company","Role"\r\n"Acme","Engineer');
  assert.equal(malformed.errors.length, 1);
  assert.match(malformed.errors[0].message, /Unclosed quoted field/);

  const duplicateCsv = serializeCsv([
    ['same-id', 'Acme', 'Engineer']
  ], { headers: ['ID', 'Company', 'Role'] });
  const duplicateResult = importOpportunitiesCsv(duplicateCsv, [{ id: 'same-id' }], {
    now: NOW,
    generateId: () => 'same-id'
  });
  assert.equal(duplicateResult.rowsImported, 1);
  assert.notEqual(duplicateResult.opportunities[0].id, 'same-id');
  assert.match(duplicateResult.warnings[0].message, /Duplicate ID/);
});

test('CSV filename contains the local export date', () => {
  const localDate = new Date(2026, 7, 29, 9, 30, 0);
  assert.equal(getOpportunityCsvFileName(localDate), 'opportunities-2026-08-29.csv');
});
