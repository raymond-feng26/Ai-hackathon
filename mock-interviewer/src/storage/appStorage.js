import { OPPORTUNITY_SCHEMA_VERSION } from '../domain/opportunity.js';
import { RESUME_SCHEMA_VERSION } from '../domain/resume.js';

export const STORAGE_KEYS = Object.freeze({
  resumes: 'mock_interviewer_resumes',
  opportunities: 'mock_interviewer_applications',
  schemaVersion: 'mock_interviewer_schema_version'
});

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage || null;
};

const readJsonArray = (storage, key, warnings) => {
  try {
    const serialized = storage.getItem(key);
    if (!serialized) return [];
    const parsed = JSON.parse(serialized);
    if (Array.isArray(parsed)) return parsed;
    warnings.push(`${key} did not contain a list and was ignored.`);
  } catch {
    warnings.push(`${key} could not be read and was ignored.`);
  }

  return [];
};

export function loadAppStorage() {
  const warnings = [];
  let storage;

  try {
    storage = getStorage();
  } catch {
    warnings.push('Browser storage is unavailable. Changes may not persist until storage access is restored.');
    return { opportunities: [], resumes: [], schemaVersion: 0, warnings };
  }

  if (!storage) {
    return { opportunities: [], resumes: [], schemaVersion: 0, warnings };
  }

  let rawVersion = 0;
  try {
    const storedVersion = Number(storage.getItem(STORAGE_KEYS.schemaVersion));
    rawVersion = Number.isFinite(storedVersion) ? storedVersion : 0;
  } catch {
    warnings.push('The saved schema version could not be read; records will be migrated defensively.');
  }

  return {
    opportunities: readJsonArray(storage, STORAGE_KEYS.opportunities, warnings),
    resumes: readJsonArray(storage, STORAGE_KEYS.resumes, warnings),
    schemaVersion: rawVersion,
    warnings
  };
}

export function saveAppCollection(key, value) {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
    storage.setItem(
      STORAGE_KEYS.schemaVersion,
      String(Math.max(OPPORTUNITY_SCHEMA_VERSION, RESUME_SCHEMA_VERSION))
    );
  } catch (error) {
    const storageError = new Error(
      'Your browser could not save these changes. Export a JSON backup, then free some site storage and try again.'
    );
    storageError.cause = error;
    throw storageError;
  }
}

export function saveOpportunities(opportunities) {
  saveAppCollection(STORAGE_KEYS.opportunities, opportunities);
}

export function saveResumes(resumes) {
  saveAppCollection(STORAGE_KEYS.resumes, resumes);
}
