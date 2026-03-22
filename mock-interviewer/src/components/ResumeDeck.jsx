import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { extractTextFromResume } from '../services/resumeParser';
import Button from './ui/Button';
import Card from './ui/Card';
import { DocumentTextIcon, TrashIcon, ArrowUpTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ResumeDeck() {
  const navigate = useNavigate();
  const { resumes, addResume, deleteResume, maxResumes } = useApp();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

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
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || resumes.length >= maxResumes}
            >
              <ArrowUpTrayIcon className="w-5 h-5 mr-2 inline" />
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

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
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <ArrowUpTrayIcon className="w-5 h-5 mr-2 inline" />
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes
              .sort((a, b) => b.uploadedAt - a.uploadedAt)
              .map(resume => (
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
                    <button
                      onClick={(e) => handleDelete(e, resume.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </Card>
              ))}
          </div>
        )}

      </div>
    </div>
  );
}
