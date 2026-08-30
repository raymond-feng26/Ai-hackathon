import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RESUME_TARGET_TRACKS,
  createResume,
  createResumeSnapshot,
  getResumeDisplayName,
  normalizeResume
} from '../domain/resume.js';

const NOW = Date.UTC(2026, 7, 29, 12, 0, 0);
const idFactory = (prefix) => `${prefix}-test`;

test('legacy resumes gain display names, target tracks, and archive-safe snapshots', () => {
  const resume = normalizeResume({
    id: 'resume-1',
    name: 'Legacy GPU Resume',
    fileName: 'legacy.pdf',
    text: 'resume text',
    uploadedAt: NOW - 1000,
    archivedAt: NOW
  }, { now: NOW, generateId: idFactory });

  assert.equal(resume.displayName, 'Legacy GPU Resume');
  assert.equal(resume.name, 'Legacy GPU Resume');
  assert.equal(resume.targetTrack, 'general');
  assert.equal(resume.archivedAt, NOW);
  assert.deepEqual(createResumeSnapshot(resume), {
    resumeId: 'resume-1',
    resumeNameSnapshot: 'Legacy GPU Resume'
  });
});

test('new resumes support each requested target track and safe fallbacks', () => {
  assert.deepEqual(RESUME_TARGET_TRACKS, [
    'general_swe',
    'ai_systems_gpu',
    'robotics_research',
    'general'
  ]);

  const resume = createResume({
    fileName: 'robotics-resume.docx',
    targetTrack: 'robotics_research',
    text: 'text'
  }, { now: NOW, generateId: idFactory });
  assert.equal(resume.displayName, 'robotics-resume');
  assert.equal(resume.targetTrack, 'robotics_research');
  assert.equal(resume.archivedAt, null);
  assert.equal(getResumeDisplayName(null), '');
});
