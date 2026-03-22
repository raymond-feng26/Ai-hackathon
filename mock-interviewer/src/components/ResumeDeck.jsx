import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { extractTextFromResume } from '../services/resumeParser';
import Card from './ui/Card';
import { formatDate } from '../utils/dateFormatters';
import BackButton from './ui/BackButton';
import ErrorAlert from './ui/ErrorAlert';
import { DocumentTextIcon, TrashIcon, ArrowUpTrayIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ResumeDeck() {
  const navigate = useNavigate();
  const { resumes, addResume, deleteResume, maxResumes } = useApp();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [viewingResume, setViewingResume] = useState(null);
  const sortedResumes = useMemo(
    () => [...resumes].sort((a, b) => b.uploadedAt - a.uploadedAt),
    [resumes]
  );


  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this resume?')) {
      deleteResume(id);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (resumes.length >= maxResumes) {
      setError(`Maximum ${maxResumes} resumes allowed. Delete one to upload a new one.`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const text = await extractTextFromResume(file);
      addResume(text, file.name);
    } catch (err) {
      setError(err.message || 'Failed to process resume');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <BackButton to="/" label="Back to Home" />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              My Resumes
            </h1>
            <p className="text-gray-600">
              {resumes.length} of {maxResumes} resumes saved
            </p>
          </div>
          <div>
            <input
              id="resume-deck-upload"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              disabled={uploading || resumes.length >= maxResumes}
              className="hidden"
            />
            <label
              htmlFor="resume-deck-upload"
              className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-primary text-white hover:bg-blue-700 shadow-md hover:shadow-lg cursor-pointer ${uploading || resumes.length >= maxResumes ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </label>
          </div>
        </div>

        <ErrorAlert message={error} />

        {resumes.length === 0 ? (
          <Card className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <DocumentTextIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No resumes yet</h3>
            <p className="text-gray-600 mb-4">
              Upload your first resume to get started
            </p>
            <label
              htmlFor="resume-deck-upload"
              className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-primary text-white hover:bg-blue-700 shadow-md hover:shadow-lg cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </label>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedResumes.map(resume => (
                <Card
                  key={resume.id}
                  className="relative hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <DocumentTextIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {resume.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {resume.fileName}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Uploaded {formatDate(resume.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); setViewingResume(resume); }}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                        title="View resume text"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, resume.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}

      </div>

      {/* Resume Text Viewer Modal */}
      {viewingResume && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingResume(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="font-semibold text-gray-900">{viewingResume.name}</h2>
                <p className="text-sm text-gray-500">{viewingResume.fileName}</p>
              </div>
              <button
                onClick={() => setViewingResume(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <pre className="p-4 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {viewingResume.text}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
