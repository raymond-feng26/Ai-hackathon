import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORAGE_KEYS,
  loadAppStorage,
  saveOpportunities
} from '../storage/appStorage.js';
import { OPPORTUNITY_SCHEMA_VERSION } from '../domain/opportunity.js';
import { normalizeResume } from '../domain/resume.js';
import {
  backfillResumeNameSnapshots,
  migrateOpportunities
} from './opportunityData.js';

const setWindow = (value) => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value
  });
};

test('storage load errors are recoverable and save errors are actionable', () => {
  const originalWindow = globalThis.window;

  try {
    const blockedWindow = {};
    Object.defineProperty(blockedWindow, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError');
      }
    });
    setWindow(blockedWindow);

    const blockedLoad = loadAppStorage();
    assert.deepEqual(blockedLoad.opportunities, []);
    assert.equal(blockedLoad.warnings.length, 1);
    assert.match(blockedLoad.warnings[0], /storage is unavailable/i);
    assert.throws(
      () => saveOpportunities([]),
      /could not save these changes/i
    );

    setWindow({
      localStorage: {
        getItem() {
          throw new Error('Read blocked');
        },
        setItem() {}
      }
    });
    const readFailure = loadAppStorage();
    assert.deepEqual(readFailure.opportunities, []);
    assert.deepEqual(readFailure.resumes, []);
    assert.equal(readFailure.warnings.length, 3);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      setWindow(originalWindow);
    }
  }
});

test('legacy records can be loaded, migrated, and persisted at the current version', () => {
  const originalWindow = globalThis.window;
  const values = new Map([
    [STORAGE_KEYS.opportunities, JSON.stringify([{
      id: 'legacy',
      company: 'Legacy Co',
      role: 'Engineer',
      status: 'read',
      appliedAt: 123,
      resumeId: 'resume-legacy',
      sessions: [{ id: 'session' }],
      analysis: { matchScore: 80 }
    }])],
    [STORAGE_KEYS.resumes, JSON.stringify([{
      id: 'resume-legacy',
      name: 'Legacy Backend Resume',
      text: 'resume text'
    }])]
  ]);
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };

  try {
    setWindow({ localStorage: storage });
    const loaded = loadAppStorage();
    const migrationOptions = {
      now: 1000,
      generateId: prefix => `${prefix}-test`
    };
    const normalizedResumes = loaded.resumes.map(resume => normalizeResume(resume, migrationOptions));
    const migrated = backfillResumeNameSnapshots(
      migrateOpportunities(loaded.opportunities, migrationOptions),
      normalizedResumes
    );
    saveOpportunities(migrated);

    const persisted = JSON.parse(values.get(STORAGE_KEYS.opportunities));
    assert.equal(persisted[0].stage, 'applied');
    assert.equal(persisted[0].appliedAt, 123);
    assert.deepEqual(persisted[0].sessions, [{ id: 'session' }]);
    assert.deepEqual(persisted[0].analysis, { matchScore: 80 });
    assert.equal(persisted[0].resumeNameSnapshot, 'Legacy Backend Resume');
    assert.equal(persisted[0].schemaVersion, OPPORTUNITY_SCHEMA_VERSION);
    assert.equal(Number(values.get(STORAGE_KEYS.schemaVersion)), OPPORTUNITY_SCHEMA_VERSION);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      setWindow(originalWindow);
    }
  }
});
