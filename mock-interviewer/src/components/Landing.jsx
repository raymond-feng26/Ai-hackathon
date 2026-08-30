import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  FolderIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Button from './ui/Button';

const GUIDE_TABS = [
  {
    id: 'tracking',
    label: 'Application Tracking',
    steps: [
      { icon: BriefcaseIcon, title: 'Capture every lead', description: 'Quick Add a company, role, and optional URL as soon as you find it. New records stay in Saved until you decide they are worth applying to.' },
      { icon: ShieldCheckIcon, title: 'Check fit and eligibility', description: 'Classify the target track, priority, visa eligibility, export-control risk, source, and referral status.' },
      { icon: CheckCircleIcon, title: 'Move the work forward', description: 'Set the stage, deadline, and next action. The workspace surfaces overdue follow-ups and near-term deadlines first.' },
      { icon: ChartBarIcon, title: 'Review and back up', description: 'Watch your General SWE / AI Systems / Robotics mix, export an Excel-ready CSV, and keep full JSON backups of local data.' }
    ]
  },
  {
    id: 'simulation',
    label: 'Interview Prep',
    steps: [
      { icon: DocumentTextIcon, title: 'Choose a resume', description: 'Select a named resume version or upload a new PDF/DOCX, then add the job description.' },
      { icon: MagnifyingGlassIcon, title: 'Review the match', description: 'Compare the resume against the posting and review keyword gaps and suggested emphasis.' },
      { icon: AcademicCapIcon, title: 'Practice a round', description: 'Run behavioral, technical, or culture-fit practice and save feedback back to the linked opportunity.' }
    ]
  },
  {
    id: 'analysis',
    label: 'Recording Analysis',
    steps: [
      { icon: MicrophoneIcon, title: 'Upload a recording', description: 'Add an MP3, WAV, WebM, or M4A recording of a real interview.' },
      { icon: ChartBarIcon, title: 'Review the report', description: 'See the transcription summary, performance score, filler words, strengths, and improvement areas.' }
    ]
  }
];

const FEATURES = [
  {
    icon: BriefcaseIcon,
    title: 'Opportunity tracking',
    description: 'Use a dense, Excel-style workspace to qualify leads before applying, track visa and export-control constraints, manage referrals, and keep the next action visible.',
    tags: ['Inline stages', 'Visa review', 'CSV + JSON backup'],
    to: '/applications',
    action: 'Open tracker',
    primary: true
  },
  {
    icon: AcademicCapIcon,
    title: 'Interview preparation',
    description: 'Link a resume and job description, review the match, and practice three interview rounds with feedback saved to the opportunity.',
    tags: ['Resume analysis', '3 rounds', 'Linked sessions'],
    to: '/upload',
    action: 'Start interview prep'
  },
  {
    icon: MicrophoneIcon,
    title: 'Recording analysis',
    description: 'Upload a real interview recording and receive a structured report with strengths, weaknesses, filler-word counts, and next-step coaching.',
    tags: ['Audio analysis', 'Performance report', 'Actionable feedback'],
    to: '/analyze-recording',
    action: 'Analyze recording'
  }
];

export default function Landing() {
  const [showGuide, setShowGuide] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('tracking');

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setShowGuide(false);
    };
    if (showGuide) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showGuide]);

  return (
    <div>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-bold text-gray-900 sm:text-lg">2027 Internship Workspace</Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/applications"
              className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-blue-100"
            >
              <BriefcaseIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Applications</span>
            </Link>
            <Link to="/resumes" aria-label="Resumes" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-primary">
              <FolderIcon className="h-5 w-5" />
              <span className="hidden md:inline">Resumes</span>
            </Link>
            <Link to="/upload" aria-label="Interview prep" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-primary">
              <AcademicCapIcon className="h-5 w-5" />
              <span className="hidden lg:inline">Interview Prep</span>
            </Link>
            <Link to="/analyze-recording" aria-label="Recording analysis" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-primary">
              <MicrophoneIcon className="h-5 w-5" />
              <span className="hidden lg:inline">Recording</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              aria-label="How to use"
              className="p-2 text-gray-500 hover:text-primary"
            >
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <main>
        <section className="flex min-h-screen items-center px-4 pb-16 pt-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                2027 Summer Internship Search
              </p>
              <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Turn every internship lead into a clear next action.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
                Track opportunities before and after applying, screen F-1 eligibility early, keep referrals and deadlines visible, and carry the same record into interview preparation.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button to="/applications" className="inline-flex items-center">
                  Track Applications
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" to="/upload">Interview Prep</Button>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Built for daily triage</p>
              <div className="mt-5 space-y-4">
                {[
                  ['50%', 'General SWE / Backend / Infra'],
                  ['30%', 'AI Systems / GPU / Architecture'],
                  ['20%', 'Robotics / Hardware / Research']
                ].map(([ratio, label]) => (
                  <div key={ratio} className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
                    <span className="w-14 text-2xl font-bold text-primary">{ratio}</span>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <ShieldCheckIcon className="h-5 w-5 shrink-0" />
                Eligibility and export-control review stay visible before you spend time applying.
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold text-gray-900">One pipeline, with interview tools when you need them</h2>
            <p className="mx-auto mb-12 mt-3 max-w-2xl text-center text-gray-500">
              Application tracking is the primary workspace. Resume analysis, practice, and recording feedback remain linked secondary tools.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <article key={feature.title} className={`flex flex-col rounded-xl border p-6 ${feature.primary ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200'}`}>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                  <p className="mb-5 mt-2 flex-1 text-sm leading-6 text-gray-600">{feature.description}</p>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {feature.tags.map(tag => <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-xs text-blue-700">{tag}</span>)}
                  </div>
                  <Button variant={feature.primary ? 'primary' : 'outline'} to={feature.to} className="w-full text-center">
                    {feature.action}
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowGuide(false)}>
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <h2 className="text-xl font-bold text-gray-900">How to use the workspace</h2>
              <button type="button" onClick={() => setShowGuide(false)} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Close guide">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b border-gray-200 px-5 pt-3">
              {GUIDE_TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveGuideTab(tab.id)}
                  className={`shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium ${activeGuideTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="space-y-5 overflow-y-auto p-5">
              {GUIDE_TABS.find(tab => tab.id === activeGuideTab)?.steps.map((step, index) => (
                <div key={step.title} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">Step {index + 1}</span>
                    <h3 className="mt-1 font-semibold text-gray-900">{step.title}</h3>
                    <p className="mt-0.5 text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 p-5">
              <Button className="w-full" onClick={() => setShowGuide(false)}>Got it</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
