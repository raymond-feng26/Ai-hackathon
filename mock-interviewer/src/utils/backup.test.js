import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
  createFullBackup,
  getBackupFileName,
  parseFullBackup,
  restoreFullBackup,
  serializeFullBackup,
  validateFullBackup
} from './backup.js';

const NOW = Date.UTC(2026, 7, 29, 12, 0, 0);

const createIdFactory = () => {
  let counter = 0;
  return (prefix) => `${prefix}-${counter += 1}`;
};

const fullData = {
  opportunities: [{
    id: 'opp-1',
    company: 'Example',
    role: 'Engineer',
    stage: 'interview',
    jobDescription: 'Full job description',
    notes: 'Private notes',
    resumeId: 'resume-1',
    resumeNameSnapshot: 'Backend Resume',
    events: [{ id: 'event-1', type: 'note', timestamp: NOW - 1000, note: 'Phone screen booked' }],
    sessions: [{ id: 'session-1', score: 8.5, grades: [{ score: 9 }] }],
    analysis: { matchScore: 88, missingKeywords: ['Kubernetes'] },
    appliedAt: NOW - 5000,
    createdAt: NOW - 10000,
    updatedAt: NOW
  }],
  resumes: [{
    id: 'resume-1',
    displayName: 'Backend Resume',
    targetTrack: 'general_swe',
    text: 'Full resume text',
    fileName: 'resume.pdf',
    uploadedAt: NOW - 10000,
    archivedAt: NOW - 100
  }]
};

test('full backup round-trip preserves rich opportunity and archived resume data', () => {
  const idFactory = createIdFactory();
  const backup = createFullBackup(fullData, { now: NOW, generateId: idFactory });
  assert.equal(backup.format, BACKUP_FORMAT);
  assert.equal(backup.schemaVersion, BACKUP_SCHEMA_VERSION);
  assert.equal(backup.opportunities[0].jobDescription, 'Full job description');
  assert.deepEqual(backup.opportunities[0].sessions, fullData.opportunities[0].sessions);
  assert.deepEqual(backup.opportunities[0].analysis, fullData.opportunities[0].analysis);
  assert.equal(backup.resumes[0].archivedAt, NOW - 100);

  const serialized = serializeFullBackup(fullData, { now: NOW, generateId: createIdFactory() });
  const restored = parseFullBackup(serialized, { now: NOW, generateId: createIdFactory() });
  assert.equal(restored.ok, true);
  assert.equal(restored.errors.length, 0);
  assert.equal(restored.opportunities[0].jobDescription, 'Full job description');
  assert.equal(
    restored.opportunities[0].events.find(event => event.type === 'note')?.note,
    'Phone screen booked'
  );
  assert.deepEqual(restored.opportunities[0].sessions, fullData.opportunities[0].sessions);
  assert.deepEqual(restored.opportunities[0].analysis, fullData.opportunities[0].analysis);
  assert.equal(restored.resumes[0].text, 'Full resume text');
  assert.equal(restored.resumes[0].archivedAt, NOW - 100);
});

test('backup validation rejects bad structure and future versions', () => {
  assert.equal(validateFullBackup(null).valid, false);
  assert.equal(validateFullBackup({ opportunities: 'bad', resumes: [] }).valid, false);

  const future = validateFullBackup({
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION + 1,
    opportunities: [],
    resumes: []
  });
  assert.equal(future.valid, false);
  assert.match(future.errors[0], /newer, unsupported/);

  const invalidJson = parseFullBackup('{broken');
  assert.equal(invalidJson.ok, false);
  assert.match(invalidJson.errors[0], /not valid JSON/);
});

test('restore skips individual bad records and accepts legacy applications key', () => {
  const restored = restoreFullBackup({
    applications: [
      'bad row',
      { company: '', role: 'Missing company' },
      { id: 'duplicate', company: 'Good', role: 'One', status: 'sent', sessions: [], analysis: null },
      { id: 'duplicate', company: 'Good', role: 'Two', status: 'interviewed', sessions: [], analysis: null }
    ],
    resumes: ['bad resume', { id: 'resume-1', name: 'Legacy Resume', text: 'text' }]
  }, { now: NOW, generateId: createIdFactory() });

  assert.equal(restored.ok, true);
  assert.equal(restored.opportunities.length, 2);
  assert.equal(restored.opportunities[0].stage, 'applied');
  assert.equal(restored.opportunities[1].stage, 'interview');
  assert.notEqual(restored.opportunities[0].id, restored.opportunities[1].id);
  assert.equal(restored.resumes.length, 1);
  assert.equal(restored.resumes[0].displayName, 'Legacy Resume');
  assert.equal(restored.warnings.length >= 3, true);
});

test('JSON restore backfills legacy linked resume names without replacing historical snapshots', () => {
  const restored = parseFullBackup(JSON.stringify({
    applications: [
      {
        id: 'legacy-missing-snapshot',
        company: 'Legacy Co',
        role: 'Engineer',
        status: 'sent',
        resumeId: 'resume-legacy'
      },
      {
        id: 'legacy-with-snapshot',
        company: 'Legacy Co',
        role: 'Researcher',
        status: 'interviewing',
        resumeId: 'resume-legacy',
        resumeNameSnapshot: 'Actually submitted v1'
      }
    ],
    resumes: [{
      id: 'resume-legacy',
      name: 'Current renamed resume',
      text: 'resume text'
    }]
  }), { now: NOW, generateId: createIdFactory() });

  assert.equal(restored.ok, true);
  assert.equal(restored.opportunities[0].resumeNameSnapshot, 'Current renamed resume');
  assert.equal(restored.opportunities[1].resumeNameSnapshot, 'Actually submitted v1');
});

test('backup filename contains the export date', () => {
  const localDate = new Date(2026, 7, 29, 9, 30, 0);
  assert.equal(getBackupFileName(localDate), 'mock-interviewer-backup-2026-08-29.json');
});
