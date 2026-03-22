import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import {
  DocumentTextIcon,
  ChartBarIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  BriefcaseIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

export default function Landing() {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-bold text-xl text-gray-900">InterviewCoach</div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/resumes')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-primary transition-colors"
            >
              <FolderIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Resumes</span>
            </button>
            <button
              onClick={() => navigate('/applications')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-primary transition-colors"
            >
              <BriefcaseIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Applications</span>
            </button>
            <Button onClick={() => navigate('/applications/new')} className="hidden sm:inline-flex">
              New Application
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full viewport height */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-16">
        <div className="max-w-3xl text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Ace Your Next Interview
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered interview preparation and job application tracking.
            Practice with realistic questions and get instant feedback.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button onClick={() => navigate('/upload')}>
              Start Interview Prep
            </Button>
            <Button variant="outline" onClick={() => navigate('/applications')}>
              Track Applications
            </Button>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 animate-bounce">
          <button onClick={scrollToFeatures} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-xl mb-3">1. Upload Resume</h3>
              <p className="text-gray-600">
                Upload your resume (PDF or DOCX) and paste the job description you're targeting
              </p>
            </div>
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <ChartBarIcon className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-xl mb-3">2. Get Analysis</h3>
              <p className="text-gray-600">
                See your match score, identify skill gaps, and get personalized improvement tips
              </p>
            </div>
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <AcademicCapIcon className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold text-xl mb-3">3. Practice Interview</h3>
              <p className="text-gray-600">
                Answer tailored questions and receive instant AI feedback on your responses
              </p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <MagnifyingGlassIcon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Smart Analysis</h3>
              <p className="text-gray-600 text-sm">
                Get a detailed match score and identify gaps between your resume and the job description
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Tailored Questions</h3>
              <p className="text-gray-600 text-sm">
                Practice with questions customized to your experience and the role you're applying for
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <LightBulbIcon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Instant Feedback</h3>
              <p className="text-gray-600 text-sm">
                Receive real-time grading and actionable tips to improve your answers
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button onClick={() => navigate('/upload')}>
              Start Practicing Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
