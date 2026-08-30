import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  createOpportunity,
  generateId,
  normalizeOpportunity
} from '../domain/opportunity.js';
import {
  createResume,
  createResumeSnapshot,
  normalizeResume
} from '../domain/resume.js';
import {
  addTimelineNote as appendTimelineNote,
  appendReferralRequest,
  appendStageChange,
  archiveOpportunity,
  backfillResumeNameSnapshots,
  migrateOpportunities,
  prepareOpportunityImport,
  shouldRefreshResumeSnapshot,
  restoreOpportunity
} from '../utils/opportunityData.js';
import {
  loadAppStorage,
  saveOpportunities,
  saveResumes
} from '../storage/appStorage.js';

const AppContext = createContext(null);

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const loadInitialState = () => {
  const stored = loadAppStorage();
  const now = Date.now();
  const resumes = stored.resumes.map(resume => normalizeResume(resume, { now }));
  const applications = backfillResumeNameSnapshots(
    migrateOpportunities(stored.opportunities, { now }),
    resumes
  );
  return {
    resumes,
    applications,
    warnings: stored.warnings
  };
};

export function AppProvider({ children }) {
  const [initialState] = useState(loadInitialState);
  const [resumes, setResumes] = useState(initialState.resumes);
  const [applications, setApplications] = useState(initialState.applications);
  const [storageError, setStorageError] = useState('');
  const [storageWarnings, setStorageWarnings] = useState(initialState.warnings);
  const isLoaded = true;

  useEffect(() => {
    try {
      saveResumes(resumes);
    } catch (error) {
      queueMicrotask(() => setStorageError(error.message));
    }
  }, [resumes]);

  useEffect(() => {
    try {
      saveOpportunities(applications);
    } catch (error) {
      queueMicrotask(() => setStorageError(error.message));
    }
  }, [applications]);

  const clearStorageMessages = useCallback(() => {
    setStorageError('');
    setStorageWarnings([]);
  }, []);

  const addResume = useCallback((text, fileName, options = {}) => {
    const resume = createResume({
      text,
      fileName,
      displayName: options.displayName,
      targetTrack: options.targetTrack
    });
    setStorageError('');
    setResumes(previous => [...previous, resume]);
    return resume.id;
  }, []);

  const updateResume = useCallback((id, patch) => {
    const now = Date.now();
    setStorageError('');
    setResumes(previous => previous.map((resume) => {
      if (resume.id !== id) return resume;
      return normalizeResume({
        ...resume,
        ...patch,
        name: patch.displayName ?? patch.name ?? resume.displayName,
        updatedAt: now
      }, { now });
    }));
  }, []);

  const archiveResume = useCallback((id) => {
    updateResume(id, { archivedAt: Date.now() });
  }, [updateResume]);

  const restoreResume = useCallback((id) => {
    updateResume(id, { archivedAt: null });
  }, [updateResume]);

  const getResume = useCallback(
    id => resumes.find(resume => resume.id === id),
    [resumes]
  );

  const activeResumes = useMemo(
    () => resumes.filter(resume => !resume.archivedAt),
    [resumes]
  );

  const addApplication = useCallback((data) => {
    const now = Date.now();
    const linkedResume = data.resumeId
      ? resumes.find(resume => resume.id === data.resumeId)
      : null;
    const snapshot = linkedResume ? createResumeSnapshot(linkedResume) : {};
    const opportunity = createOpportunity({ ...data, ...snapshot }, { now });

    setStorageError('');
    setApplications(previous => [...previous, opportunity]);
    return opportunity.id;
  }, [resumes]);

  const updateApplication = useCallback((id, data) => {
    const now = Date.now();
    setStorageError('');
    setApplications(previous => previous.map((opportunity) => {
      if (opportunity.id !== id) return opportunity;

      let next = opportunity;
      const stageChanged = hasOwn(data, 'stage') && data.stage !== opportunity.stage;
      if (stageChanged) {
        next = appendStageChange(next, data.stage, { now });
      }

      const patch = { ...data };
      if (stageChanged) delete patch.stage;

      if (shouldRefreshResumeSnapshot(opportunity, data)) {
        const nextResumeId = hasOwn(data, 'resumeId') ? data.resumeId : opportunity.resumeId;
        const linkedResume = resumes.find(resume => resume.id === nextResumeId);
        if (linkedResume) Object.assign(patch, createResumeSnapshot(linkedResume));
      }

      const referralWasRequested = data.referralStatus === 'requested'
        && opportunity.referralStatus !== 'requested';
      if (referralWasRequested) {
        next = appendReferralRequest(next, {
          now,
          timestamp: data.referralRequestedAt ?? now,
          referralContact: data.referralContact ?? next.referralContact
        });
        patch.referralRequestedAt = next.referralRequestedAt;
        patch.events = next.events;
      } else if (stageChanged) {
        patch.events = next.events;
      }

      return normalizeOpportunity({
        ...next,
        ...patch,
        updatedAt: now,
        lastActivityAt: stageChanged || referralWasRequested
          ? now
          : (data.lastActivityAt ?? now)
      }, { now });
    }));
  }, [resumes]);

  const archiveApplication = useCallback((id) => {
    const now = Date.now();
    setStorageError('');
    setApplications(previous => previous.map(opportunity => (
      opportunity.id === id ? archiveOpportunity(opportunity, { now }) : opportunity
    )));
  }, []);

  const restoreApplication = useCallback((id) => {
    const now = Date.now();
    setStorageError('');
    setApplications(previous => previous.map(opportunity => (
      opportunity.id === id ? restoreOpportunity(opportunity, { now }) : opportunity
    )));
  }, []);

  const getApplication = useCallback(
    id => applications.find(opportunity => opportunity.id === id),
    [applications]
  );

  const addTimelineNote = useCallback((applicationId, note, timestamp) => {
    const now = Date.now();
    setStorageError('');
    setApplications(previous => previous.map(opportunity => (
      opportunity.id === applicationId
        ? appendTimelineNote(opportunity, note, {
          now,
          timestamp: timestamp ?? now
        })
        : opportunity
    )));
  }, []);

  const addSessionToApplication = useCallback((applicationId, sessionData) => {
    const now = Date.now();
    const session = {
      id: generateId('session', now),
      ...sessionData,
      completedAt: sessionData.completedAt ?? now
    };

    setStorageError('');
    setApplications(previous => previous.map((opportunity) => {
      if (opportunity.id !== applicationId) return opportunity;
      return normalizeOpportunity({
        ...opportunity,
        sessions: [...opportunity.sessions, session],
        lastActivityAt: now,
        updatedAt: now
      }, { now });
    }));

    return session.id;
  }, []);

  const deleteSessionFromApplication = useCallback((applicationId, sessionId) => {
    const now = Date.now();
    setStorageError('');
    setApplications(previous => previous.map((opportunity) => {
      if (opportunity.id !== applicationId) return opportunity;
      return normalizeOpportunity({
        ...opportunity,
        sessions: opportunity.sessions.filter(session => session.id !== sessionId),
        updatedAt: now
      }, { now });
    }));
  }, []);

  const importApplications = useCallback((rawOpportunities) => {
    const now = Date.now();
    const prepared = prepareOpportunityImport(rawOpportunities, applications, { now });
    const importedOpportunities = backfillResumeNameSnapshots(
      prepared.opportunities,
      resumes
    );

    if (importedOpportunities.length > 0) {
      setStorageError('');
      setApplications(previous => [...previous, ...importedOpportunities]);
    }
    return {
      imported: importedOpportunities.length,
      skipped: prepared.skipped,
      reassignedIds: prepared.reassignedIds
    };
  }, [applications, resumes]);

  const restoreAllData = useCallback((data) => {
    const now = Date.now();
    const restoredResumes = (Array.isArray(data?.resumes) ? data.resumes : [])
      .map(resume => normalizeResume(resume, { now }));
    const restoredApplications = backfillResumeNameSnapshots(
      migrateOpportunities(data?.opportunities, { now }),
      restoredResumes
    ).filter(opportunity => opportunity.company && opportunity.role);

    setStorageError('');
    setApplications(restoredApplications);
    setResumes(restoredResumes);
    return {
      opportunities: restoredApplications.length,
      resumes: restoredResumes.length
    };
  }, []);

  const value = useMemo(() => ({
    resumes,
    activeResumes,
    addResume,
    updateResume,
    archiveResume,
    restoreResume,
    deleteResume: archiveResume,
    getResume,

    opportunities: applications,
    applications,
    addApplication,
    updateApplication,
    archiveApplication,
    restoreApplication,
    deleteApplication: archiveApplication,
    getApplication,
    addTimelineNote,
    addSessionToApplication,
    deleteSessionFromApplication,
    importApplications,
    restoreAllData,

    isLoaded,
    storageError,
    storageWarnings,
    clearStorageMessages
  }), [
    resumes,
    activeResumes,
    addResume,
    updateResume,
    archiveResume,
    restoreResume,
    getResume,
    applications,
    addApplication,
    updateApplication,
    archiveApplication,
    restoreApplication,
    getApplication,
    addTimelineNote,
    addSessionToApplication,
    deleteSessionFromApplication,
    importApplications,
    restoreAllData,
    isLoaded,
    storageError,
    storageWarnings,
    clearStorageMessages
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
