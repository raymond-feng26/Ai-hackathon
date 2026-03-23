import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { useApp } from '../context/AppContext';
import { extractTextFromResume } from '../services/resumeParser';
import { analyzeResumeVsJD } from '../services/ai';
import FileUpload from './ui/FileUpload';
import TextArea from './ui/TextArea';
import Button from './ui/Button';
import Card from './ui/Card';
import ErrorAlert from './ui/ErrorAlert';
import { DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ResumeUpload() {
  const navigate = useNavigate();
  const { setResumeText, setJobDescription, setAnalysis, setResumeId, setLinkedApplicationId } = useInterview();
  const { resumes, addResume, maxResumes } = useApp();

  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [saveToLibrary, setSaveToLibrary] = useState(true);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setSelectedResumeId(null); // Clear saved resume selection
    setError('');
  };

  const handleSelectSavedResume = (resumeId) => {
    setSelectedResumeId(resumeId);
    setFile(null); // Clear file upload
    setError('');
  };

  const handleAnalyze = async () => {
    if (!file && !selectedResumeId) {
      setError('Please upload a resume or select a saved one');
      return;
    }
    if (!jd.trim()) {
      setError('Please paste the job description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let resumeText;

      let currentResumeId = null;

      if (selectedResumeId) {
        // Use saved resume
        const savedResume = resumes.find(r => r.id === selectedResumeId);
        if (!savedResume) {
          throw new Error('Selected resume not found');
        }
        resumeText = savedResume.text;
        currentResumeId = selectedResumeId;
      } else {
        // Extract text from uploaded file
        resumeText = await extractTextFromResume(file);

        // Save to library if checkbox is checked and space available
        if (saveToLibrary && resumes.length < maxResumes) {
          currentResumeId = addResume(resumeText, file.name);
        }
      }

      setResumeText(resumeText);
      setJobDescription(jd);
      setResumeId(currentResumeId);
      // Clear any previous application link (this is a standalone practice)
      setLinkedApplicationId(null);

      // Analyze resume vs job description
      const analysisResult = await analyzeResumeVsJD(resumeText, jd);
      setAnalysis(analysisResult);

      // Navigate to results
      navigate('/analysis');
    } catch (err) {
      setError(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">
          Upload Your Resume
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Let's analyze how well your resume matches the job description
        </p>

        {/* Saved Resumes */}
        {resumes.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Saved Resumes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resumes.map(resume => (
                <button
                  key={resume.id}
                  onClick={() => handleSelectSavedResume(resume.id)}
                  className={`flex items-center p-3 rounded-lg border-2 transition-all text-left ${
                    selectedResumeId === resume.id
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <DocumentTextIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{resume.name}</p>
                    <p className="text-xs text-gray-500 truncate">{resume.fileName}</p>
                  </div>
                  {selectedResumeId === resume.id && (
                    <CheckCircleIcon className="w-6 h-6 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            {selectedResumeId && (
              <p className="text-sm text-green-600 mt-3">
                Using saved resume - or upload a new one below
              </p>
            )}
          </Card>
        )}

        {/* Upload New Resume */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {resumes.length > 0 ? 'Or Upload New Resume' : 'Resume (PDF or DOCX)'}
          </h2>
          <FileUpload onFileSelect={handleFileSelect} />
          {file && resumes.length < maxResumes && (
            <label className="flex items-center mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={saveToLibrary}
                onChange={(e) => setSaveToLibrary(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-600">
                Save to my resume library ({resumes.length}/{maxResumes} used)
              </span>
            </label>
          )}
        </Card>

        <Card className="mb-6">
          <TextArea
            label="Job Description"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description here..."
            rows={10}
          />
        </Card>

        <ErrorAlert message={error} />

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Match'}
          </Button>
        </div>
      </div>
    </div>
  );
}
