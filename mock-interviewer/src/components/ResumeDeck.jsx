import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { RESUME_TARGET_TRACK_CONFIG } from '../domain/resume';
import { extractTextFromResume } from '../services/resumeParser';
import Card from './ui/Card';
import { formatDate } from '../utils/dateFormatters';
import BackButton from './ui/BackButton';
import ErrorAlert from './ui/ErrorAlert';
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const targetTrackOptions = Object.entries(RESUME_TARGET_TRACK_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

const getDisplayName = (resume) => resume.displayName || resume.name || resume.fileName || 'Untitled resume';

const getResumeTime = (resume) => {
  const timestamp = new Date(resume.updatedAt || resume.uploadedAt || 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export default function ResumeDeck() {
  const {
    resumes = [],
    activeResumes,
    addResume,
    updateResume,
    archiveResume,
    restoreResume,
  } = useApp();
  const [view, setView] = useState('active');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [viewingResumeId, setViewingResumeId] = useState(null);
  const [nameDrafts, setNameDrafts] = useState({});

  const currentActiveResumes = useMemo(
    () => (Array.isArray(activeResumes) ? activeResumes : resumes.filter((resume) => !resume.archivedAt)),
    [activeResumes, resumes]
  );
  const archivedResumes = useMemo(
    () => resumes.filter((resume) => Boolean(resume.archivedAt)),
    [resumes]
  );
  const visibleResumes = useMemo(() => {
    const source = view === 'archived' ? archivedResumes : currentActiveResumes;
    return [...source].sort((a, b) => getResumeTime(b) - getResumeTime(a));
  }, [archivedResumes, currentActiveResumes, view]);
  const viewingResume = viewingResumeId
    ? resumes.find((resume) => resume.id === viewingResumeId) || null
    : null;

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') setViewingResumeId(null);
    };
    if (viewingResume) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [viewingResume]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const text = await extractTextFromResume(file);
      addResume(text, file.name);
      setView('active');
    } catch (err) {
      setError(err.message || 'Failed to process resume');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleNameChange = (resumeId, value) => {
    setNameDrafts((current) => ({ ...current, [resumeId]: value }));
  };

  const commitDisplayName = (resume) => {
    if (!Object.hasOwn(nameDrafts, resume.id)) return;

    const displayName = nameDrafts[resume.id].trim();
    setNameDrafts((current) => {
      const next = { ...current };
      delete next[resume.id];
      return next;
    });

    if (!displayName) {
      setError('Resume display name cannot be empty.');
      return;
    }

    if (displayName !== getDisplayName(resume)) {
      updateResume(resume.id, { displayName });
    }
  };

  const handleArchive = (resume) => {
    const displayName = getDisplayName(resume);
    if (confirm(`Archive "${displayName}"? Existing opportunity history will keep its resume snapshot.`)) {
      archiveResume(resume.id);
      if (viewingResumeId === resume.id) setViewingResumeId(null);
    }
  };

  const handleRestore = (resume) => {
    restoreResume(resume.id);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <BackButton to="/" label="Back to Home" />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Resumes</h1>
            <p className="text-gray-600">
              {currentActiveResumes.length} active · {archivedResumes.length} archived
            </p>
          </div>
          <div>
            <input
              id="resume-deck-upload"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <label
              htmlFor="resume-deck-upload"
              className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-primary text-white hover:bg-blue-700 shadow-md hover:shadow-lg cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </label>
          </div>
        </div>

        <ErrorAlert message={error} />

        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 mb-6" role="tablist" aria-label="Resume views">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'active'}
            onClick={() => setView('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'active' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active ({currentActiveResumes.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'archived'}
            onClick={() => setView('archived')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === 'archived' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Archived ({archivedResumes.length})
          </button>
        </div>

        {visibleResumes.length === 0 ? (
          <Card className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <DocumentTextIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {view === 'archived' ? 'No archived resumes' : 'No active resumes yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {view === 'archived'
                ? 'Archived resumes will appear here and can be restored at any time.'
                : 'Upload your first resume to get started.'}
            </p>
            {view === 'active' && (
              <label
                htmlFor="resume-deck-upload"
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-primary text-white hover:bg-blue-700 shadow-md hover:shadow-lg cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </label>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleResumes.map((resume) => {
              const displayName = getDisplayName(resume);
              return (
                <Card key={resume.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor={`resume-name-${resume.id}`}>
                        Display name
                      </label>
                      <input
                        id={`resume-name-${resume.id}`}
                        type="text"
                        value={nameDrafts[resume.id] ?? displayName}
                        onChange={(event) => handleNameChange(resume.id, event.target.value)}
                        onBlur={() => commitDisplayName(resume)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.currentTarget.blur();
                        }}
                        className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 font-semibold text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <p className="text-sm text-gray-500 truncate mt-1" title={resume.fileName}>
                        {resume.fileName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingResumeId(resume.id)}
                      className="p-2.5 text-gray-400 hover:text-primary transition-colors"
                      title="View resume text"
                      aria-label={`View ${displayName} text`}
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor={`resume-track-${resume.id}`}>
                      Target track
                    </label>
                    <select
                      id={`resume-track-${resume.id}`}
                      value={resume.targetTrack || 'general'}
                      onChange={(event) => updateResume(resume.id, { targetTrack: event.target.value })}
                      className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      {targetTrackOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400">
                      Uploaded {formatDate(resume.uploadedAt || resume.createdAt)}
                    </p>
                    {view === 'archived' ? (
                      <button
                        type="button"
                        onClick={() => handleRestore(resume)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-blue-700"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                        Restore
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleArchive(resume)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600"
                      >
                        <ArchiveBoxIcon className="w-4 h-4" />
                        Archive
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {viewingResume && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingResumeId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">{getDisplayName(viewingResume)}</h2>
                <p className="text-sm text-gray-500 truncate">{viewingResume.fileName}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingResumeId(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close viewer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <pre className="p-4 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {viewingResume.text || 'No extracted text is available for this resume.'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
