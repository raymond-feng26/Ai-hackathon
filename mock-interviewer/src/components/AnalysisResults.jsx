import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { getScoreColor } from '../utils/scoring';
import Button from './ui/Button';
import Card from './ui/Card';
import { CheckIcon, LightBulbIcon, PencilSquareIcon, ArrowRightIcon, HomeIcon, BriefcaseIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const MATCH_SCORE_TIERS = [
  { range: '85–100', label: 'Near-perfect', desc: 'Covers virtually all required skills, directly relevant experience.', color: 'text-green-600' },
  { range: '70–84',  label: 'Strong',       desc: 'Most required skills present, few gaps in preferred qualifications.', color: 'text-green-500' },
  { range: '50–69',  label: 'Moderate',     desc: 'Some required skills, transferable experience, notable gaps.',        color: 'text-yellow-600' },
  { range: '30–49',  label: 'Weak',         desc: 'Few required skills, significant upskilling needed.',                 color: 'text-orange-500' },
  { range: '0–29',   label: 'Poor',         desc: 'Fundamentally different field or level, almost no overlap.',          color: 'text-red-600' },
];

function ScoreGuidePopover({ tiers }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return (
    <div className="relative inline-flex items-center" ref={ref}>
      <button onClick={() => setOpen(v => !v)} aria-label="Scoring guide" className="text-gray-400 hover:text-gray-600 transition-colors">
        <QuestionMarkCircleIcon className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-7 z-20 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Scoring Guide</p>
          <div className="space-y-2">
            {tiers.map(t => (
              <div key={t.range} className="flex items-start gap-2">
                <span className={`text-sm font-bold w-14 flex-shrink-0 ${t.color}`}>{t.range}</span>
                <div>
                  <span className="text-sm font-semibold text-gray-800">{t.label} — </span>
                  <span className="text-sm text-gray-500">{t.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalysisResults() {
  const navigate = useNavigate();
  const { analysis, jobDescription, resumeId, linkedApplicationId } = useInterview();

  useEffect(() => {
    if (!analysis) {
      navigate('/upload');
    }
  }, [analysis, navigate]);

  if (!analysis) {
    return null;
  }

  const { matchScore, missingKeywords, strengths, suggestedEmphasis, modifications } = analysis;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">
          Analysis Results
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Here's how your resume matches the job description
        </p>

        {/* Match Score */}
        <Card className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">Match Score</h2>
            <ScoreGuidePopover tiers={MATCH_SCORE_TIERS} />
          </div>
          <div className={`text-7xl font-bold ${getScoreColor(matchScore, true)} mb-2`}>
            {matchScore}%
          </div>
          <p className="text-gray-600">
            {matchScore >= 80 && "Excellent match! Your resume aligns well with the job."}
            {matchScore >= 60 && matchScore < 80 && "Good match with room for improvement."}
            {matchScore < 60 && "Consider highlighting relevant skills more prominently."}
          </p>
        </Card>

        {/* Missing Keywords */}
        {missingKeywords.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Missing Keywords</h2>
            <p className="text-gray-600 mb-3">
              These keywords from the job description weren't found in your resume:
            </p>
            <div className="flex flex-wrap gap-2">
              {missingKeywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Strengths */}
        {strengths.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Strengths</h2>
            <ul className="space-y-2">
              {strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Suggested Emphasis */}
        {suggestedEmphasis.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Interview Tips</h2>
            <ul className="space-y-2">
              {suggestedEmphasis.map((tip, idx) => (
                <li key={idx} className="flex items-start">
                  <LightBulbIcon className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Resume Modification Suggestions */}
        {modifications && modifications.length > 0 && (
          <Card className="mb-8">
            <div className="flex items-center mb-4">
              <PencilSquareIcon className="w-6 h-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold">Suggested Resume Modifications</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Consider these changes to better align your resume with the job description:
            </p>
            <div className="space-y-6">
              {modifications.map((mod, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">{mod.section}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-red-700 uppercase mb-2">Original</p>
                      <p className="text-gray-700 text-sm">{mod.original}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-700 uppercase mb-2">Recommended</p>
                      <p className="text-gray-700 text-sm">{mod.recommended}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-start">
                    <ArrowRightIcon className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 italic">{mod.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex gap-4 justify-center flex-wrap">
          <Button variant="outline" onClick={() => navigate('/')}>
            <HomeIcon className="w-4 h-4 mr-1 inline" />
            Home
          </Button>
          <Button variant="outline" onClick={() => navigate('/upload')}>
            Try Another
          </Button>
          {!linkedApplicationId && (
            <Button variant="outline" onClick={() => navigate('/applications/new', { state: { jobDescription, resumeId, analysis } })}>
              <BriefcaseIcon className="w-4 h-4 mr-1 inline" />
              Save as Application
            </Button>
          )}
          <Button onClick={() => navigate('/setup')}>
            Start Interview Practice
          </Button>
        </div>
      </div>
    </div>
  );
}
