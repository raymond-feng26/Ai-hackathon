import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { STATUS_CONFIG } from '../utils/applicationStatus';
import Button from './ui/Button';
import Card from './ui/Card';
import TextArea from './ui/TextArea';
import ErrorAlert from './ui/ErrorAlert';
import BackButton from './ui/BackButton';

export default function AddApplication() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addApplication, addSessionToApplication, resumes } = useApp();
  const prefill = location.state || {};

  const [formData, setFormData] = useState({
    company: '',
    role: '',
    jobDescription: prefill.jobDescription || '',
    resumeId: prefill.resumeId || '',
    status: 'sent',
    interviewDate: '',
    notes: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.company.trim()) {
      setError('Company name is required');
      return;
    }
    if (!formData.role.trim()) {
      setError('Role/Position is required');
      return;
    }

    const appId = addApplication({
      company: formData.company.trim(),
      role: formData.role.trim(),
      jobDescription: formData.jobDescription.trim(),
      resumeId: formData.resumeId || null,
      status: formData.status,
      interviewDate: formData.interviewDate ? new Date(formData.interviewDate).getTime() : null,
      notes: formData.notes.trim()
    });

    if (prefill.pendingSession) {
      addSessionToApplication(appId, prefill.pendingSession);
    }

    navigate(`/applications/${appId}`);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <BackButton to="/applications" label="Back to Applications" />

        <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">
          New Application
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Track a new job application
        </p>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g., Google"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Role / Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="e.g., Software Engineer"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Interview Date (if scheduled)
                </label>
                <input
                  type="datetime-local"
                  name="interviewDate"
                  value={formData.interviewDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Link Resume (optional)
                </label>
                {resumes.length > 0 ? (
                  <select
                    name="resumeId"
                    value={formData.resumeId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors"
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
                    <span className="text-gray-500">No resumes uploaded yet</span>
                    <button
                      type="button"
                      onClick={() => navigate('/resumes')}
                      className="text-primary hover:underline"
                    >
                      Upload one
                    </button>
                  </div>
                )}
              </div>

              <TextArea
                label="Job Description"
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                placeholder="Paste the job description here for interview prep..."
                rows={6}
              />

              <TextArea
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </Card>

          <ErrorAlert message={error} />

          <div className="flex gap-4 justify-center">
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
