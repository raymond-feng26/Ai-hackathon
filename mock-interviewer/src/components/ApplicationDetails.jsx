import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useInterview } from '../context/InterviewContext';
import Button from './ui/Button';
import Card from './ui/Card';
import { formatDate, formatDateTime } from '../utils/dateFormatters';
import { getRoundLabel } from '../utils/interviewRounds';
import { STATUS_CONFIG } from '../utils/applicationStatus';
import BackButton from './ui/BackButton';
import {
  BriefcaseIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  PlayIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getApplication, updateApplication, getResume, resumes } = useApp();
  const { setResumeText, setJobDescription, setLinkedApplicationId } = useInterview();
  const [app, setApp] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    company: '',
    role: '',
    interviewDate: '',
    jobDescription: '',
    resumeId: ''
  });

  useEffect(() => {
    const application = getApplication(id);
    if (!application) {
      navigate('/applications');
    } else {
      setApp(application);
    }
  }, [id, getApplication, navigate]);

  if (!app) {
    return null;
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
      resumeId: app.resumeId || ''
    });
    setIsEditing(true);
  };

  const handleEditSave = () => {
    const updates = {
      company: editForm.company,
      role: editForm.role,
      interviewDate: editForm.interviewDate ? new Date(editForm.interviewDate).getTime() : null,
      jobDescription: editForm.jobDescription,
      resumeId: editForm.resumeId || null
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
                  className="p-2 text-gray-400 hover:text-primary transition-colors"
                  title="Edit application"
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
            <Card className="flex items-center">
              <DocumentTextIcon className="w-8 h-8 text-blue-500 mr-3" />
              <div>
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
                {app.jobDescription
                  ? 'Practice with questions tailored to this job description'
                  : 'Add a job description to get tailored questions'}
              </p>
            </div>
            <Button onClick={handleStartPractice} disabled={!app.jobDescription}>
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
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      Session {idx + 1}: {getRoundLabel(session.round)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(session.completedAt)}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {session.score.toFixed(1)}/10
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
    </div>
  );
}
