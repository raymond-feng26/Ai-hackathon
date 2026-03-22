import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const STORAGE_KEYS = {
  resumes: 'mock_interviewer_resumes',
  applications: 'mock_interviewer_applications'
};

const MAX_RESUMES = 5;

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Load from localStorage
const loadFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Save to localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export function AppProvider({ children }) {
  const [resumes, setResumes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    setResumes(loadFromStorage(STORAGE_KEYS.resumes));
    setApplications(loadFromStorage(STORAGE_KEYS.applications));
    setIsLoaded(true);
  }, []);

  // Save resumes when changed
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.resumes, resumes);
    }
  }, [resumes, isLoaded]);

  // Save applications when changed
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(STORAGE_KEYS.applications, applications);
    }
  }, [applications, isLoaded]);

  // Resume operations
  const addResume = (text, fileName) => {
    const newResume = {
      id: generateId(),
      name: fileName.replace(/\.(pdf|docx)$/i, ''),
      text,
      fileName,
      uploadedAt: Date.now()
    };

    setResumes(prev => {
      // If at max capacity, remove oldest
      const updated = [...prev];
      if (updated.length >= MAX_RESUMES) {
        updated.sort((a, b) => a.uploadedAt - b.uploadedAt);
        updated.shift(); // Remove oldest
      }
      return [...updated, newResume];
    });

    return newResume.id;
  };

  const deleteResume = (id) => {
    setResumes(prev => prev.filter(r => r.id !== id));
    // Also remove from any applications that reference it
    setApplications(prev => prev.map(app =>
      app.resumeId === id ? { ...app, resumeId: null } : app
    ));
  };

  const getResume = (id) => resumes.find(r => r.id === id);

  // Application operations
  const addApplication = (data) => {
    const newApp = {
      id: generateId(),
      company: data.company,
      role: data.role,
      jobDescription: data.jobDescription,
      resumeId: data.resumeId || null,
      status: data.status || 'sent',
      appliedAt: data.appliedAt || Date.now(),
      updatedAt: Date.now(),
      interviewDate: data.interviewDate || null,
      sessions: [],
      notes: data.notes || ''
    };

    setApplications(prev => [...prev, newApp]);
    return newApp.id;
  };

  const updateApplication = (id, data) => {
    setApplications(prev => prev.map(app => {
      if (app.id === id) {
        return {
          ...app,
          ...data,
          updatedAt: Date.now()
        };
      }
      return app;
    }));
  };

  const deleteApplication = (id) => {
    setApplications(prev => prev.filter(app => app.id !== id));
  };

  const getApplication = (id) => applications.find(app => app.id === id);

  const addSessionToApplication = (appId, sessionData) => {
    const session = {
      id: generateId(),
      ...sessionData,
      completedAt: Date.now()
    };

    setApplications(prev => prev.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          sessions: [...app.sessions, session],
          updatedAt: Date.now()
        };
      }
      return app;
    }));

    return session.id;
  };

  const value = {
    // Resumes
    resumes,
    addResume,
    deleteResume,
    getResume,
    maxResumes: MAX_RESUMES,

    // Applications
    applications,
    addApplication,
    updateApplication,
    deleteApplication,
    getApplication,
    addSessionToApplication,

    // State
    isLoaded
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
