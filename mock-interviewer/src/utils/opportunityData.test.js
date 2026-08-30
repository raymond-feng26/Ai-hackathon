import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APPLIED_STAGES,
  createOpportunity,
  normalizeOpportunity,
  normalizeTimestamp
} from '../domain/opportunity.js';
import {
  addTimelineNote,
  appendReferralRequest,
  appendStageChange,
  backfillResumeNameSnapshots,
  canonicalizeJobUrl,
  filterOpportunities,
  findOpportunityDuplicates,
  getDeadlineState,
  getOpportunitySummary,
  migrateOpportunity,
  migrateOpportunities,
  prepareOpportunityImport,
  shouldRefreshResumeSnapshot,
  sortOpportunities,
  toSafeHttpUrl
} from './opportunityData.js';

const NOW = new Date(2026, 7, 26, 12, 0, 0).getTime();

const createIdFactory = () => {
  let counter = 0;
  return (prefix) => `${prefix}-${counter += 1}`;
};

test('legacy statuses migrate without losing interview data', () => {
  const migrated = migrateOpportunity({
    id: 'legacy-1',
    company: 'Example',
    role: 'Engineer',
    status: 'read',
    appliedAt: NOW - 1000,
    jobDescription: 'A detailed JD',
    notes: 'Keep me',
    resumeId: 'resume-1',
    sessions: [{ id: 'session-1', score: 8 }],
    analysis: { matchScore: 91 }
  }, { now: NOW, generateId: createIdFactory() });

  assert.equal(migrated.stage, 'applied');
  assert.equal(migrated.appliedAt, NOW - 1000);
  assert.equal(migrated.jobDescription, 'A detailed JD');
  assert.equal(migrated.notes, 'Keep me');
  assert.equal(migrated.resumeId, 'resume-1');
  assert.deepEqual(migrated.sessions, [{ id: 'session-1', score: 8 }]);
  assert.deepEqual(migrated.analysis, { matchScore: 91 });
  assert.equal('status' in migrated, false);
});

test('rejected, closed, and withdrawn stages do not invent appliedAt', () => {
  assert.deepEqual(APPLIED_STAGES, ['applied', 'oa', 'interview', 'offer']);

  for (const stage of ['rejected', 'closed', 'withdrawn']) {
    const opportunity = normalizeOpportunity({
      company: 'Example',
      role: stage,
      stage,
      appliedAt: null
    }, { now: NOW, generateId: createIdFactory() });
    assert.equal(opportunity.appliedAt, null);
  }

  const oldRejected = migrateOpportunity({
    company: 'Example',
    role: 'Old rejection',
    status: 'rejected',
    appliedAt: NOW - 5000
  }, { now: NOW, generateId: createIdFactory() });
  assert.equal(oldRejected.appliedAt, NOW - 5000);
});

test('new and malformed records receive safe defaults', () => {
  const created = createOpportunity({ company: 'A', role: 'B' }, {
    now: NOW,
    generateId: createIdFactory()
  });
  assert.equal(created.stage, 'saved');
  assert.equal(created.appliedAt, null);
  assert.equal(created.discoveredAt, NOW);
  assert.equal(created.createdAt, NOW);
  assert.equal(created.events[0].type, 'created');

  const malformed = normalizeOpportunity({
    sessions: 'not-an-array',
    events: { bad: true },
    analysis: 'bad',
    track: 'not-real',
    deadlineAt: 'not-a-date'
  }, { now: NOW, generateId: createIdFactory() });
  assert.deepEqual(malformed.sessions, []);
  assert.equal(malformed.analysis, null);
  assert.equal(malformed.track, 'unclassified');
  assert.equal(malformed.deadlineAt, null);
  assert.equal(Array.isArray(malformed.events), true);

  assert.deepEqual(migrateOpportunities('{bad json'), []);
  assert.equal(migrateOpportunities([null, 'bad', { company: 'A', role: 'B' }]).length, 1);

  const localDate = new Date(normalizeTimestamp('2026-08-29'));
  assert.deepEqual(
    [localDate.getFullYear(), localDate.getMonth() + 1, localDate.getDate()],
    [2026, 8, 29]
  );
});

test('stage and note helpers are immutable and append normalized events', () => {
  const idFactory = createIdFactory();
  const original = createOpportunity({ company: 'A', role: 'B' }, { now: NOW - 1000, generateId: idFactory });
  const ready = appendStageChange(original, 'ready', { now: NOW, generateId: idFactory });

  assert.equal(original.stage, 'saved');
  assert.equal(ready.stage, 'ready');
  assert.equal(ready.appliedAt, null);
  assert.equal(ready.events.at(-1).type, 'stage_changed');
  assert.equal(ready.events.at(-1).fromStage, 'saved');
  assert.equal(ready.events.at(-1).toStage, 'ready');

  const applied = appendStageChange(ready, 'applied', { now: NOW + 1000, generateId: idFactory });
  assert.equal(applied.appliedAt, NOW + 1000);
  const unchanged = appendStageChange(applied, 'applied', { now: NOW + 2000, generateId: idFactory });
  assert.equal(unchanged.events.length, applied.events.length);

  const historicalEventAt = NOW - 24 * 60 * 60 * 1000;
  const withNote = addTimelineNote(applied, 'Recruiter replied', {
    now: NOW + 3000,
    timestamp: historicalEventAt,
    generateId: idFactory
  });
  assert.equal(withNote.events.at(-1).type, 'note');
  assert.equal(withNote.events.at(-1).note, 'Recruiter replied');
  assert.equal(withNote.events.at(-1).timestamp, historicalEventAt);
  assert.equal(withNote.lastActivityAt, NOW + 3000);
  assert.equal(withNote.updatedAt, NOW + 3000);

  const futureStampedRecord = {
    ...applied,
    updatedAt: NOW + 5000,
    lastActivityAt: NOW + 6000
  };
  const nonRegressing = addTimelineNote(futureStampedRecord, 'Historical note', {
    now: NOW + 4000,
    timestamp: historicalEventAt,
    generateId: idFactory
  });
  assert.equal(nonRegressing.events.at(-1).timestamp, historicalEventAt);
  assert.equal(nonRegressing.updatedAt, NOW + 6000);
  assert.equal(nonRegressing.lastActivityAt, NOW + 6000);
});

test('referral requests use their supplied time and normalization never duplicates the event', () => {
  const idFactory = createIdFactory();
  const requestedAt = NOW - 5000;
  const normalized = normalizeOpportunity({
    company: 'Referral Co',
    role: 'Engineer',
    referralStatus: 'requested',
    referralContact: 'Grace Hopper',
    referralRequestedAt: requestedAt
  }, { now: NOW, generateId: idFactory });

  const referralEvents = normalized.events.filter(event => event.type === 'referral_requested');
  assert.equal(referralEvents.length, 1);
  assert.equal(referralEvents[0].timestamp, requestedAt);
  assert.match(referralEvents[0].note, /Grace Hopper/);

  const normalizedAgain = normalizeOpportunity(normalized, { now: NOW, generateId: idFactory });
  assert.equal(
    normalizedAgain.events.filter(event => event.type === 'referral_requested').length,
    1
  );

  const possible = createOpportunity({
    company: 'Referral Co',
    role: 'Engineer',
    referralStatus: 'possible'
  }, { now: NOW - 10000, generateId: idFactory });
  const requested = appendReferralRequest(possible, {
    now: NOW,
    timestamp: requestedAt,
    referralContact: 'Ada Lovelace',
    generateId: idFactory
  });
  assert.equal(requested.referralStatus, 'requested');
  assert.equal(requested.referralRequestedAt, requestedAt);
  assert.equal(requested.lastActivityAt, NOW);
  assert.equal(requested.events.at(-1).timestamp, requestedAt);
});

test('resume snapshots refresh only when linkage or application submission changes', () => {
  const opportunity = {
    resumeId: 'resume-1',
    resumeNameSnapshot: 'Submitted v1',
    stage: 'applied'
  };
  assert.equal(shouldRefreshResumeSnapshot(opportunity, { notes: 'ordinary edit' }), false);
  assert.equal(shouldRefreshResumeSnapshot(opportunity, { resumeId: 'resume-1' }), false);
  assert.equal(shouldRefreshResumeSnapshot(opportunity, { resumeId: 'resume-2' }), true);
  assert.equal(shouldRefreshResumeSnapshot({
    ...opportunity,
    stage: 'ready'
  }, { stage: 'applied' }), true);
  assert.equal(shouldRefreshResumeSnapshot({
    ...opportunity,
    resumeNameSnapshot: ''
  }, {}), true);
});

test('legacy resume links backfill only missing display-name snapshots', () => {
  const opportunities = [
    { id: 'missing', resumeId: 'resume-1', resumeNameSnapshot: '' },
    { id: 'historical', resumeId: 'resume-1', resumeNameSnapshot: 'Submitted v1' },
    { id: 'unavailable', resumeId: 'missing-resume', resumeNameSnapshot: '' },
    { id: 'unlinked', resumeId: null, resumeNameSnapshot: '' }
  ];
  const resumes = [{
    id: 'resume-1',
    displayName: 'Current renamed resume',
    archivedAt: NOW
  }];
  const backfilled = backfillResumeNameSnapshots(opportunities, resumes);

  assert.equal(backfilled[0].resumeNameSnapshot, 'Current renamed resume');
  assert.equal(backfilled[1].resumeNameSnapshot, 'Submitted v1');
  assert.equal(backfilled[2].resumeNameSnapshot, '');
  assert.equal(backfilled[3].resumeNameSnapshot, '');
  assert.equal(opportunities[0].resumeNameSnapshot, '');
});

test('filter, sort, and summary functions implement tracker priorities', () => {
  const opportunities = [
    {
      id: 'overdue-action', company: 'Alpha', role: 'SWE', stage: 'saved', track: 'general_swe',
      priority: 'p2', eligibility: 'eligible', referralStatus: 'none', nextActionAt: NOW - 1000,
      deadlineAt: null, updatedAt: NOW - 5000, appliedAt: null, archivedAt: null, notes: 'backend role'
    },
    {
      id: 'soon-deadline', company: 'Beta', role: 'GPU', stage: 'applied', track: 'ai_systems_gpu',
      priority: 'p0', eligibility: 'needs_research', referralStatus: 'possible', nextActionAt: null,
      deadlineAt: NOW + 1000, updatedAt: NOW, appliedAt: NOW - 24 * 60 * 60 * 1000,
      archivedAt: null, notes: ''
    },
    {
      id: 'ordinary', company: 'Gamma', role: 'Robotics', stage: 'interview',
      track: 'robotics_hardware_research', priority: 'p0', eligibility: 'eligible', referralStatus: 'used',
      nextActionAt: null, deadlineAt: null, updatedAt: NOW + 1000,
      appliedAt: NOW - 10 * 24 * 60 * 60 * 1000, archivedAt: null, notes: ''
    },
    {
      id: 'archived', company: 'Archive', role: 'Old', stage: 'rejected', track: 'general_swe',
      priority: 'p1', eligibility: 'blocked', referralStatus: 'none', updatedAt: NOW,
      appliedAt: NOW, archivedAt: NOW, notes: ''
    }
  ];

  assert.deepEqual(
    sortOpportunities(opportunities, { now: NOW }).map(item => item.id),
    ['overdue-action', 'soon-deadline', 'ordinary', 'archived']
  );
  assert.deepEqual(
    filterOpportunities(opportunities, { view: 'active' }).map(item => item.id),
    ['soon-deadline', 'ordinary']
  );
  assert.deepEqual(
    filterOpportunities(opportunities, { view: 'needs visa review' }).map(item => item.id),
    ['soon-deadline']
  );
  assert.deepEqual(
    filterOpportunities(opportunities, { search: 'BACKEND' }).map(item => item.id),
    ['overdue-action']
  );
  assert.deepEqual(
    filterOpportunities(opportunities, { view: 'archived' }).map(item => item.id),
    ['archived']
  );
  assert.equal(getDeadlineState(NOW + 3 * 24 * 60 * 60 * 1000, { now: NOW }), 'soon');

  const startOfToday = new Date(NOW);
  startOfToday.setHours(0, 0, 0, 0);
  assert.equal(getDeadlineState(startOfToday.getTime(), { now: NOW }), 'soon');
  assert.equal(
    getDeadlineState(startOfToday.getTime() - 1, { now: NOW }),
    'overdue'
  );

  const summary = getOpportunitySummary(opportunities, { now: NOW });
  assert.equal(summary.total, 3);
  assert.equal(summary.archived, 1);
  assert.equal(summary.appliedThisWeek, 1);
  assert.equal(summary.toApply, 1);
  assert.equal(summary.active, 2);
  assert.equal(summary.overdueNextActions, 1);
  assert.deepEqual(summary.appliedTrackCounts, {
    general_swe: 0,
    ai_systems_gpu: 1,
    robotics_hardware_research: 1,
    unclassified: 0
  });
});

test('duplicate detection canonicalizes tracking URLs and requisition IDs', () => {
  const existing = [{
    id: '1',
    company: 'Example Corp',
    requisitionId: 'REQ-42',
    jobUrl: 'https://www.example.com/jobs/42?utm_source=linkedin'
  }];
  const candidate = {
    company: ' example  corp ',
    requisitionId: 'req-42',
    jobUrl: 'example.com/jobs/42'
  };

  assert.equal(canonicalizeJobUrl(existing[0].jobUrl), 'https://example.com/jobs/42');
  assert.deepEqual(findOpportunityDuplicates(candidate, existing)[0].reasons, [
    'job_url',
    'company_requisition_id'
  ]);
});

test('safe HTTP URLs support bare domains and reject unsupported protocols', () => {
  assert.equal(toSafeHttpUrl('example.com/jobs/42'), 'https://example.com/jobs/42');
  assert.equal(toSafeHttpUrl('https://example.com/jobs/42?source=test'), 'https://example.com/jobs/42?source=test');
  assert.equal(toSafeHttpUrl('javascript:alert(1)'), '');
  assert.equal(toSafeHttpUrl('not a valid URL'), '');
});

test('import preparation resolves collisions and skips malformed records', () => {
  const idFactory = createIdFactory();
  const prepared = prepareOpportunityImport([
    { id: 'existing', company: 'One', role: 'Engineer', stage: 'saved' },
    { id: 'existing', company: 'Two', role: 'Engineer', stage: 'saved' },
    { id: 'bad', company: '', role: 'Missing company' },
    'not an object'
  ], [{ id: 'existing' }], { now: NOW, generateId: idFactory });

  assert.equal(prepared.opportunities.length, 2);
  assert.equal(prepared.skipped, 2);
  assert.equal(prepared.reassignedIds, 2);
  assert.equal(new Set(prepared.opportunities.map(item => item.id)).size, 2);
  assert.equal(prepared.opportunities.some(item => item.id === 'existing'), false);

  const constantFactoryResult = prepareOpportunityImport([
    { id: 'taken', company: 'Fallback', role: 'Engineer' }
  ], [{ id: 'taken' }], { now: NOW, generateId: () => 'taken' });
  assert.equal(constantFactoryResult.opportunities.length, 1);
  assert.notEqual(constantFactoryResult.opportunities[0].id, 'taken');
});
