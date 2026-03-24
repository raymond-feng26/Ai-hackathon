import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useInterview } from '../context/InterviewContext';
import Button from './ui/Button';
import Card from './ui/Card';
import { formatDate, formatDateTime } from '../utils/dateFormatters';
import { getRoundLabel } from '../utils/interviewRounds';
import { STATUS_CONFIG } from '../utils/applicationStatus';
import { getScoreColor, getOverallColor } from '../utils/scoring';
import { aggregateFeedback } from '../utils/feedbackAggregator';
import BackButton from './ui/BackButton';
import {
  BriefcaseIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  PlayIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  ChevronRightIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getApplication, updateApplication, getResume, resumes, isLoaded, deleteSessionFromApplication } = useApp();
  const { setResumeText, setJobDescription, setLinkedApplicationId } = useInterview();
  const [app, setApp] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSessionIdx, setSelectedSessionIdx] = useState(null);
  const [editForm, setEditForm] = useState({
    company: '',
    role: '',
    interviewDate: '',
    jobDescription: '',
    resumeId: '',
    notes: '',
    appliedAt: ''
  });

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setSelectedSessionIdx(null); };
    if (selectedSessionIdx !== null) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [selectedSessionIdx]);

  const selectedSession = selectedSessionIdx !== null && app
    ? app.sessions[selectedSessionIdx]
    : null;

  const sessionFeedback = useMemo(() => {
    if (!selectedSession) return { strengths: [], weaknesses: [], suggestions: [] };
    return aggregateFeedback(selectedSession.grades);
  }, [selectedSession]);

  useEffect(() => {
    if (!isLoaded) return;
    const application = getApplication(id);
    if (!application) {
      navigate('/applications');
    } else {
      setApp(application);
    }
  }, [id, isLoaded, getApplication, navigate]);

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading application...</p>
        </div>
      </div>
    );
  }


  const handleStatusChange = (newStatus) => {
    updateApplication(id, { status: newStatus });
    setApp(prev => ({ ...prev, status: newStatus }));
  };

  const handleEditClick = () => {
    setEditForm({
      company: app.company,
      role: app.role,
      interviewDate: app.interviewDate
        ? new Date(app.interviewDate).toISOString().slice(0, 16)
        : '',
      jobDescription: app.jobDescription || '',
      resumeId: app.resumeId || '',
      notes: app.notes || '',
      appliedAt: app.appliedAt
        ? new Date(app.appliedAt).toISOString().slice(0, 16)
        : ''
    });
    setIsEditing(true);
  };

  const handleEditSave = () => {
    const updates = {
      company: editForm.company,
      role: editForm.role,
      interviewDate: editForm.interviewDate ? new Date(editForm.interviewDate).getTime() : null,
      jobDescription: editForm.jobDescription,
      resumeId: editForm.resumeId || null,
      notes: editForm.notes,
      appliedAt: editForm.appliedAt ? new Date(editForm.appliedAt).getTime() : app.appliedAt
    };
    updateApplication(id, updates);
    setApp(prev => ({ ...prev, ...updates }));
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleStartPractice = () => {
    // If there's a linked resume, load it
    if (app.resumeId) {
      const resume = getResume(app.resumeId);
      if (resume) {
        setResumeText(resume.text);
      }
    }
    // Load job description
    if (app.jobDescription) {
      setJobDescription(app.jobDescription);
    }
    // Link this interview to the application
    setLinkedApplicationId(id);
    // Navigate to round selection
    navigate('/setup');
  };

  const linkedResume = app.resumeId ? getResume(app.resumeId) : null;
  const canPractice = app.jobDescription && app.resumeId && linkedResume;
  const missingItems = [];
  if (!app.jobDescription) missingItems.push('a job description');
  if (!linkedResume) missingItems.push('a linked resume');

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <BackButton to="/applications" label="Back to Applications" />

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Company name"
                  className="text-2xl font-bold text-gray-900 border-2 border-gray-300 rounded-lg px-3 py-2 w-full focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Role"
                  className="text-lg text-gray-600 border-2 border-gray-300 rounded-lg px-3 py-2 w-full focus:border-primary focus:outline-none"
                />
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Interview Date/Time</label>
                  <input
                    type="datetime-local"
                    value={editForm.interviewDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, interviewDate: e.target.value }))}
                    className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Linked Resume</label>
                  {resumes.length > 0 ? (
                    <select
                      value={editForm.resumeId}
                      onChange={(e) => setEditForm(prev => ({ ...prev, resumeId: e.target.value }))}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                    >
                      <option value="">No resume linked</option>
                      {resumes.map(resume => (
                        <option key={resume.id} value={resume.id}>
                          {resume.name} ({resume.fileName})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm">No resumes uploaded yet</span>
                      <button
                        type="button"
                        onClick={() => navigate('/resumes')}
                        className="text-primary text-sm hover:underline"
                      >
                        Upload one
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Job Description</label>
                  <textarea
                    value={editForm.jobDescription}
                    onChange={(e) => setEditForm(prev => ({ ...prev, jobDescription: e.target.value }))}
                    placeholder="Paste the job description here..."
                    rows={6}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Applied Date</label>
                  <input
                    type="datetime-local"
                    value={editForm.appliedAt}
                    onChange={(e) => setEditForm(prev => ({ ...prev, appliedAt: e.target.value }))}
                    className="border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    rows={3}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-primary focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleEditSave}>
                    <CheckIcon className="w-5 h-5 mr-2 inline" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleEditCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BriefcaseIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">{app.company}</h1>
                  <p className="text-lg text-gray-600">{app.role}</p>
                </div>
                <button
                  onClick={handleEditClick}
                  className="p-2.5 text-gray-400 hover:text-primary transition-colors self-start -mt-0.5 -mr-2"
                  title="Edit application"
                  aria-label="Edit application"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          {!isEditing && (
            <select
              value={app.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`px-4 py-2 rounded-lg font-medium border-0 cursor-pointer ${STATUS_CONFIG[app.status].color}`}
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="flex items-center">
            <CalendarIcon className="w-8 h-8 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Applied</p>
              <p className="font-semibold">{formatDate(app.appliedAt)}</p>
            </div>
          </Card>

          {app.interviewDate && (
            <Card className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Interview</p>
                <p className="font-semibold">{formatDateTime(app.interviewDate)}</p>
              </div>
            </Card>
          )}

          {linkedResume && (
            <Card className="flex items-center min-w-0">
              <DocumentTextIcon className="w-8 h-8 text-blue-500 mr-3 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-500">Resume</p>
                <p className="font-semibold truncate">{linkedResume.name}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Start Practice Button */}
        <Card className="mb-8 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Interview Practice</h3>
              <p className="text-sm text-gray-600">
                {canPractice
                  ? 'Practice with questions tailored to this job description'
                  : `Add ${missingItems.join(' and ')} to get started`}
              </p>
            </div>
            <Button onClick={handleStartPractice} disabled={!canPractice}>
              <PlayIcon className="w-5 h-5 mr-2 inline" />
              Start Practice
            </Button>
          </div>
        </Card>

        {/* Job Description */}
        {app.jobDescription && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Job Description</h2>
            <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-wrap text-sm">
                {app.jobDescription}
              </p>
            </div>
          </Card>
        )}

        {/* Practice Sessions */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Practice Sessions</h2>
          {app.sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No practice sessions yet
            </p>
          ) : (
            <div className="space-y-3">
              {app.sessions.map((session, idx) => (
                <div
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View session ${idx + 1}: ${getRoundLabel(session.round)}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setSelectedSessionIdx(idx)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedSessionIdx(idx); } }}
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Session {idx + 1}: {getRoundLabel(session.round)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(session.completedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${getScoreColor(session.score)}`}>
                      {session.score.toFixed(1)}/10
                    </span>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    <button
                      aria-label="Delete session"
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      onClick={(e) => { e.stopPropagation(); if (confirm('Are you sure you want to delete this practice session?')) { deleteSessionFromApplication(id, session.id); } }}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notes */}
        {app.notes && (
          <Card className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{app.notes}</p>
          </Card>
        )}

      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSessionIdx(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Session {selectedSessionIdx + 1}: {getRoundLabel(selectedSession.round)}
                </h2>
                <p className="text-sm text-gray-500">{formatDateTime(selectedSession.completedAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${getScoreColor(selectedSession.score)}`}>
                  {selectedSession.score.toFixed(1)}/10
                </span>
                <button
                  onClick={() => setSelectedSessionIdx(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close session details"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-5 space-y-6">
              {/* Overall Score */}
              <Card className={`border-2 ${getOverallColor(selectedSession.score)}`}>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(selectedSession.score)} mb-1`}>
                    {selectedSession.score.toFixed(1)}/10
                  </div>
                  <p className="text-gray-600 text-sm">
                    {selectedSession.score >= 8 && "Excellent performance!"}
                    {selectedSession.score >= 6 && selectedSession.score < 8 && "Good job! Focus on the improvement areas below."}
                    {selectedSession.score < 6 && "Keep practicing! Review the feedback carefully."}
                  </p>
                </div>
              </Card>

              {/* Aggregated Feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessionFeedback.strengths.length > 0 && (
                  <Card className="bg-green-50 border border-green-200">
                    <div className="flex items-center mb-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="font-semibold text-green-800">What You Did Well</h3>
                    </div>
                    <ul className="space-y-1">
                      {sessionFeedback.strengths.map((s, i) => (
                        <li key={i} className="text-green-900 text-sm flex items-start">
                          <span className="text-green-600 mr-2">-</span>{s}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
                {sessionFeedback.weaknesses.length > 0 && (
                  <Card className="bg-orange-50 border border-orange-200">
                    <div className="flex items-center mb-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 mr-2" />
                      <h3 className="font-semibold text-orange-800">Areas to Improve</h3>
                    </div>
                    <ul className="space-y-1">
                      {sessionFeedback.weaknesses.map((w, i) => (
                        <li key={i} className="text-orange-900 text-sm flex items-start">
                          <span className="text-orange-600 mr-2">-</span>{w}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
              {sessionFeedback.suggestions.length > 0 && (
                <Card className="bg-blue-50 border border-blue-200">
                  <div className="flex items-center mb-3">
                    <LightBulbIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-blue-800">Try These Tips Next Time</h3>
                  </div>
                  <div className="space-y-2">
                    {sessionFeedback.suggestions.map((s, i) => (
                      <div key={i} className="flex items-start bg-white rounded-lg p-2 border border-blue-100">
                        <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 flex-shrink-0">{i + 1}</span>
                        <p className="text-gray-700 text-sm italic">{s}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Detailed Q&A */}
              <h3 className="text-lg font-semibold text-gray-900">Detailed Question Review</h3>
              {selectedSession.questions.map((question, idx) => (
                <Card key={idx} className="border-l-4 border-primary">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 flex-1">
                      Q{idx + 1}: {question}
                    </h3>
                    <span className={`text-xl font-bold ${getScoreColor(selectedSession.grades[idx].score)} ml-4`}>
                      {selectedSession.grades[idx].score}/10
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <ChatBubbleLeftIcon className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Your Response</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-700 text-sm">{selectedSession.answers[idx]}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{selectedSession.grades[idx].feedback}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedSession.grades[idx].strengths && selectedSession.grades[idx].strengths.length > 0 && (
                      <div className="bg-green-50 rounded p-2">
                        <p className="text-xs font-medium text-green-700 mb-1">Strengths</p>
                        <ul className="text-xs text-green-900 space-y-1">
                          {selectedSession.grades[idx].strengths.slice(0, 2).map((s, i) => (
                            <li key={i}>- {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedSession.grades[idx].weaknesses && selectedSession.grades[idx].weaknesses.length > 0 && (
                      <div className="bg-orange-50 rounded p-2">
                        <p className="text-xs font-medium text-orange-700 mb-1">To Improve</p>
                        <ul className="text-xs text-orange-900 space-y-1">
                          {selectedSession.grades[idx].weaknesses.slice(0, 2).map((w, i) => (
                            <li key={i}>- {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
