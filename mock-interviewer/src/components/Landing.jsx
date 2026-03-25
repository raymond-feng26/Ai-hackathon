import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from './ui/Button';
import {
  DocumentTextIcon,
  ChartBarIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  BriefcaseIcon,
  FolderIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
  PlayIcon,
  ClipboardDocumentListIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';

const GUIDE_TABS = [
  {
    id: 'simulation',
    label: 'Interview Simulation',
    steps: [
      { icon: DocumentTextIcon, title: 'Upload Your Resume', description: 'Upload a PDF or DOCX resume. You can also save up to 5 resumes in your library to reuse across sessions.' },
      { icon: MagnifyingGlassIcon, title: 'Paste a Job Description', description: "Copy the job posting you're applying to and paste it in. The AI will compare it against your resume." },
      { icon: ChartBarIcon, title: 'Review Your Analysis', description: 'See your match score, missing keywords, strengths, and suggested resume edits tailored to the role.' },
      { icon: AcademicCapIcon, title: 'Choose an Interview Round', description: 'Pick Round 1 (behavioral), Round 2 (technical), or Round 3 (culture fit) to get relevant practice questions.' },
      { icon: ChatBubbleLeftRightIcon, title: 'Practice & Get Graded', description: 'Answer questions one at a time by typing or using your microphone. Each answer gets instant AI feedback.' },
      { icon: LightBulbIcon, title: 'Review Your Summary', description: 'After the session, see your overall score, top strengths, weaknesses, and the 3 most important things to improve.' },
    ],
  },
  {
    id: 'tracking',
    label: 'Application Tracking',
    steps: [
      { icon: BriefcaseIcon, title: 'Track Your Applications', description: 'Create applications to track companies, roles, and statuses. Link your resume and job description to each one.' },
      { icon: PlayIcon, title: 'Practice from Applications', description: 'Start interview practice directly from an application. Your scores and feedback are automatically saved to that application.' },
    ],
  },
  {
    id: 'analysis',
    label: 'Interview Analysis',
    steps: [
      { icon: MicrophoneIcon, title: 'Upload Your Recording', description: 'Upload an audio recording (MP3, WAV, WebM, M4A) of a real interview — up to 15 minutes.' },
      { icon: ChartBarIcon, title: 'Get AI Analysis', description: 'The AI transcribes and evaluates your interview, scoring your performance and counting filler words.' },
      { icon: LightBulbIcon, title: 'Review Your Report', description: 'See your score, key topics discussed, strengths, weaknesses, and actionable suggestions for improvement.' },
    ],
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('simulation');

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setShowGuide(false); };
    if (showGuide) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showGuide]);

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
              onClick={() => { setActiveGuideTab('simulation'); setShowGuide(true); }}
              aria-label="How to use"
              className="flex items-center gap-2 px-3 py-2.5 text-gray-600 hover:text-primary transition-colors"
            >
              <QuestionMarkCircleIcon className="w-5 h-5" />
              <span className="hidden sm:inline">How to Use</span>
            </button>
            <Link
              to="/resumes"
              aria-label="Resumes"
              className="flex items-center gap-2 px-3 py-2.5 text-gray-600 hover:text-primary transition-colors"
            >
              <FolderIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Resumes</span>
            </Link>
            <Link
              to="/applications"
              aria-label="Applications"
              className="flex items-center gap-2 px-3 py-2.5 text-gray-600 hover:text-primary transition-colors"
            >
              <BriefcaseIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Applications</span>
            </Link>
            <Link
              to="/analyze-recording"
              aria-label="Analyze Recording"
              className="flex items-center gap-2 px-3 py-2.5 text-gray-600 hover:text-primary transition-colors"
            >
              <MicrophoneIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Analyze Recording</span>
            </Link>
            <Button to="/applications/new" className="hidden sm:inline-flex">
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
            <Button to="/upload">
              Start Interview Prep
            </Button>
            <Button variant="outline" to="/applications">
              Track Applications
            </Button>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 animate-bounce">
          <button onClick={scrollToFeatures} className="text-gray-400 hover:text-gray-600" aria-label="Scroll to features">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-center text-gray-500 mb-14 max-w-2xl mx-auto">
            Three powerful tools to help you land your next role — from resume optimization to live practice to real interview feedback.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Interview Simulation */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow flex flex-col">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <AcademicCapIcon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">Interview Simulation</h3>
              <p className="text-gray-600 text-sm mb-4 flex-1">
                Upload your resume and a job description. Get a match score with gap analysis, then practice with AI-generated questions tailored to the role. Every answer is graded instantly with strengths, weaknesses, and tips.
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Resume analysis</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">3 interview rounds</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">AI grading</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Voice input</span>
              </div>
              <Button to="/upload" className="w-full">Start Practicing</Button>
            </div>

            {/* Application Tracking */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow flex flex-col">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <BriefcaseIcon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">Application Tracking</h3>
              <p className="text-gray-600 text-sm mb-4 flex-1">
                Keep every job application in one place. Track status from sent to offer, link your resume and job description, and launch practice sessions directly from any application — scores save automatically.
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Status tracking</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Resume library</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Linked practice</span>
              </div>
              <Button variant="outline" to="/applications" className="w-full">Track Applications</Button>
            </div>

            {/* Recording Analysis */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow flex flex-col">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <MicrophoneIcon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">Recording Analysis</h3>
              <p className="text-gray-600 text-sm mb-4 flex-1">
                Upload a recording of a real interview and let AI evaluate your performance. Get a transcription summary, filler word count, key topics discussed, and specific feedback on what to improve.
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Audio analysis</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Filler detection</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">Performance score</span>
              </div>
              <Button variant="outline" to="/analyze-recording" className="w-full">Analyze Recording</Button>
            </div>
          </div>
        </div>
      </div>

      {/* How to Use Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">How to Use InterviewCoach</h2>
              <button
                onClick={() => setShowGuide(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close guide"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-5 pt-3 gap-1">
              {GUIDE_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGuideTab(tab.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeGuideTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto p-5 space-y-5">
              {GUIDE_TABS.find(t => t.id === activeGuideTab)?.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">Step {idx + 1}</span>
                    <h3 className="font-semibold text-gray-900 mb-0.5 mt-1">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-200">
              <Button className="w-full" onClick={() => setShowGuide(false)}>
                Got it!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
