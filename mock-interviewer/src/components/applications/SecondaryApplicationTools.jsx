import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  PlayIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useInterview } from '../../context/InterviewContext';
import { analyzeResumeVsJD } from '../../services/ai';
import { aggregateFeedback } from '../../utils/feedbackAggregator';
import { getRoundLabel } from '../../utils/interviewRounds';
import { getOverallColor, getScoreColor } from '../../utils/scoring';
import Button from '../ui/Button';
import Card from '../ui/Card';

const asArray = (value) => (Array.isArray(value) ? value : []);

const asStringArray = (value) => asArray(value).filter((item) => typeof item === 'string' && item.trim());

const getNumericScore = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
};

const formatDateTimeSafe = (value) => {
  if (value === null || value === undefined || value === '') return 'Date unavailable';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Date unavailable';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatScore = (value) => {
  const score = getNumericScore(value);
  return score === null ? '—' : `${score.toFixed(1)}/10`;
};

function ResumeAnalysis({ analysis, canAnalyze, isAnalyzing, analysisError, onRunAnalysis }) {
  const matchScore = getNumericScore(analysis?.matchScore);
  const missingKeywords = asStringArray(analysis?.missingKeywords);
  const strengths = asStringArray(analysis?.strengths);
  const suggestedEmphasis = asStringArray(analysis?.suggestedEmphasis);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Resume Analysis</h3>
          <p className="text-sm text-gray-500">Compare the linked resume with this job description.</p>
        </div>
        {matchScore !== null && (
          <span className={`text-xl font-bold ${getScoreColor(matchScore, true)}`}>
            {Math.round(matchScore)}% match
          </span>
        )}
      </div>

      {analysis ? (
        <div className="mt-5 space-y-4">
          {missingKeywords.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-600">Missing Keywords</p>
              <div className="flex flex-wrap gap-2">
                {missingKeywords.map((keyword, index) => (
                  <span key={`${keyword}-${index}`} className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {strengths.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-green-700">Strengths</p>
              <ul className="space-y-2">
                {strengths.map((strength, index) => (
                  <li key={`${strength}-${index}`} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestedEmphasis.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-blue-700">Preparation Tips</p>
              <ul className="space-y-2">
                {suggestedEmphasis.map((tip, index) => (
                  <li key={`${tip}-${index}`} className="flex items-start gap-2 text-sm text-gray-700">
                    <LightBulbIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.analyzedAt && (
            <p className="text-xs text-gray-400">Analyzed {formatDateTimeSafe(analysis.analyzedAt)}</p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No analysis has been saved for this opportunity.</p>
      )}

      {analysisError && <p className="mt-3 text-sm text-red-600" role="alert">{analysisError}</p>}
      <Button
        variant="outline"
        onClick={onRunAnalysis}
        disabled={!canAnalyze || isAnalyzing}
        className="mt-4"
      >
        {isAnalyzing ? 'Analyzing…' : analysis ? 'Re-run Analysis' : 'Run Analysis'}
      </Button>
      {!canAnalyze && (
        <p className="mt-2 text-xs text-gray-500">A linked resume with extracted text and a job description are required.</p>
      )}
    </section>
  );
}

function SessionModal({ session, sessionNumber, onClose }) {
  const score = getNumericScore(session?.score);
  const grades = asArray(session?.grades);
  const validGrades = grades.filter((grade) => grade && typeof grade === 'object');
  const questions = asArray(session?.questions);
  const answers = asArray(session?.answers);
  const aggregatedFeedback = aggregateFeedback(validGrades);
  const feedback = {
    strengths: asStringArray(aggregatedFeedback.strengths),
    weaknesses: asStringArray(aggregatedFeedback.weaknesses),
    suggestions: asStringArray(aggregatedFeedback.suggestions),
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Session {sessionNumber}: {getRoundLabel(session.round) || 'Practice'}
            </h2>
            <p className="text-sm text-gray-500">{formatDateTimeSafe(session.completedAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold ${score === null ? 'text-gray-500' : getScoreColor(score)}`}>
              {formatScore(score)}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Close session details"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 overflow-y-auto p-5">
          <Card className={`border-2 ${score === null ? 'border-gray-200 bg-gray-50' : getOverallColor(score)}`}>
            <div className="text-center">
              <div className={`mb-1 text-5xl font-bold ${score === null ? 'text-gray-500' : getScoreColor(score)}`}>
                {formatScore(score)}
              </div>
              {score !== null && (
                <p className="text-sm text-gray-600">
                  {score >= 8 && 'Excellent performance!'}
                  {score >= 6 && score < 8 && 'Good job! Focus on the improvement areas below.'}
                  {score < 6 && 'Keep practicing! Review the feedback carefully.'}
                </p>
              )}
            </div>
          </Card>

          {(feedback.strengths.length > 0 || feedback.weaknesses.length > 0) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {feedback.strengths.length > 0 && (
                <Card className="border border-green-200 bg-green-50">
                  <div className="mb-3 flex items-center">
                    <CheckCircleIcon className="mr-2 h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">What You Did Well</h3>
                  </div>
                  <ul className="space-y-1">
                    {feedback.strengths.map((strength, index) => (
                      <li key={`${strength}-${index}`} className="flex items-start text-sm text-green-900">
                        <span className="mr-2 text-green-600">-</span>{strength}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              {feedback.weaknesses.length > 0 && (
                <Card className="border border-orange-200 bg-orange-50">
                  <div className="mb-3 flex items-center">
                    <ExclamationTriangleIcon className="mr-2 h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-800">Areas to Improve</h3>
                  </div>
                  <ul className="space-y-1">
                    {feedback.weaknesses.map((weakness, index) => (
                      <li key={`${weakness}-${index}`} className="flex items-start text-sm text-orange-900">
                        <span className="mr-2 text-orange-600">-</span>{weakness}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}

          {feedback.suggestions.length > 0 && (
            <Card className="border border-blue-200 bg-blue-50">
              <div className="mb-3 flex items-center">
                <LightBulbIcon className="mr-2 h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">Try These Tips Next Time</h3>
              </div>
              <div className="space-y-2">
                {feedback.suggestions.map((suggestion, index) => (
                  <div key={`${suggestion}-${index}`} className="flex items-start rounded-lg border border-blue-100 bg-white p-2">
                    <span className="mr-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm italic text-gray-700">{suggestion}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Detailed Question Review</h3>
            {questions.length === 0 ? (
              <p className="text-sm text-gray-500">No detailed question data was saved for this session.</p>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const rawGrade = grades[index];
                  const grade = rawGrade && typeof rawGrade === 'object' ? rawGrade : {};
                  const gradeScore = getNumericScore(grade.score);
                  const gradeStrengths = asStringArray(grade.strengths).slice(0, 2);
                  const gradeWeaknesses = asStringArray(grade.weaknesses || grade.improvements).slice(0, 2);
                  return (
                    <Card key={`${String(question)}-${index}`} className="border-l-4 border-primary">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <h4 className="flex-1 font-semibold text-gray-900">Q{index + 1}: {String(question || 'Question unavailable')}</h4>
                        <span className={`text-xl font-bold ${gradeScore === null ? 'text-gray-400' : getScoreColor(gradeScore)}`}>
                          {gradeScore === null ? '—' : `${gradeScore}/10`}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="mb-2 flex items-center">
                          <ChatBubbleLeftIcon className="mr-2 h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600">Your Response</span>
                        </div>
                        <div className="rounded bg-gray-50 p-3">
                          <p className="text-sm text-gray-700">{String(answers[index] || 'No response saved.')}</p>
                        </div>
                      </div>

                      {grade.feedback && <p className="mb-3 text-sm text-gray-700">{String(grade.feedback)}</p>}
                      {(gradeStrengths.length > 0 || gradeWeaknesses.length > 0) && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {gradeStrengths.length > 0 && (
                            <div className="rounded bg-green-50 p-2">
                              <p className="mb-1 text-xs font-medium text-green-700">Strengths</p>
                              <ul className="space-y-1 text-xs text-green-900">
                                {gradeStrengths.map((strength, strengthIndex) => (
                                  <li key={`${strength}-${strengthIndex}`}>- {strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {gradeWeaknesses.length > 0 && (
                            <div className="rounded bg-orange-50 p-2">
                              <p className="mb-1 text-xs font-medium text-orange-700">To Improve</p>
                              <ul className="space-y-1 text-xs text-orange-900">
                                {gradeWeaknesses.map((weakness, weaknessIndex) => (
                                  <li key={`${weakness}-${weaknessIndex}`}>- {weakness}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SecondaryApplicationTools({
  application,
  getResume,
  updateApplication,
  deleteSessionFromApplication,
}) {
  const navigate = useNavigate();
  const {
    setAnalysis,
    setJobDescription,
    setLinkedApplicationId,
    setResumeId,
    setResumeText,
  } = useInterview();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(null);

  const linkedResume = application.resumeId ? getResume(application.resumeId) : null;
  const sessions = asArray(application.sessions).filter((session) => session && typeof session === 'object');
  const analysis = application.analysis && typeof application.analysis === 'object'
    ? application.analysis
    : null;
  const hasResumeText = Boolean(linkedResume?.text?.trim());
  const hasJobDescription = Boolean(application.jobDescription?.trim());
  const canPractice = hasResumeText && hasJobDescription;
  const selectedSession = selectedSessionIndex === null ? null : sessions[selectedSessionIndex] || null;

  const handleRunAnalysis = async () => {
    if (!canPractice) return;
    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const result = await analyzeResumeVsJD(linkedResume.text, application.jobDescription);
      updateApplication(application.id, {
        analysis: { ...result, analyzedAt: Date.now() },
      });
    } catch (err) {
      setAnalysisError(err.message || 'Resume analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartPractice = () => {
    if (!canPractice) return;
    setResumeText(linkedResume.text);
    setResumeId(application.resumeId || null);
    setJobDescription(application.jobDescription);
    setAnalysis(analysis || null);
    setLinkedApplicationId(application.id);
    navigate('/setup');
  };

  const handleDeleteSession = (event, session) => {
    event.stopPropagation();
    if (!session.id) return;
    if (confirm('Are you sure you want to delete this practice session?')) {
      deleteSessionFromApplication(application.id, session.id);
      setSelectedSessionIndex(null);
    }
  };

  return (
    <Card className="mb-8">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 text-left"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Secondary Tools</h2>
          <p className="mt-1 text-sm text-gray-500">
            Resume analysis, interview practice, and {sessions.length} saved practice {sessions.length === 1 ? 'session' : 'sessions'}.
          </p>
        </div>
        <ChevronDownIcon className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-6 space-y-5 border-t border-gray-100 pt-6">
          <section className="rounded-lg border-2 border-blue-200 bg-blue-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Interview Practice</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {canPractice
                    ? 'Practice with questions tailored to this opportunity.'
                    : 'Link a resume with extracted text and add a job description to begin.'}
                </p>
              </div>
              <Button onClick={handleStartPractice} disabled={!canPractice}>
                <PlayIcon className="mr-2 inline h-5 w-5" />
                Start Practice
              </Button>
            </div>
          </section>

          <ResumeAnalysis
            analysis={analysis}
            canAnalyze={canPractice}
            isAnalyzing={isAnalyzing}
            analysisError={analysisError}
            onRunAnalysis={handleRunAnalysis}
          />

          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-gray-900">Practice Sessions</h3>
            <p className="mt-1 text-sm text-gray-500">Open a session to review its score, feedback, and answers.</p>

            {sessions.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No practice sessions yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {sessions.map((session, index) => {
                  const score = getNumericScore(session.score);
                  return (
                    <div key={session.id || `session-${index}`} className="flex items-center rounded-lg bg-gray-50 transition-colors hover:bg-gray-100">
                      <button
                        type="button"
                        onClick={() => setSelectedSessionIndex(index)}
                        className="flex min-w-0 flex-1 items-center justify-between gap-3 p-3 text-left"
                        aria-label={`View session ${index + 1}: ${getRoundLabel(session.round) || 'Practice'}`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">
                            Session {index + 1}: {getRoundLabel(session.round) || 'Practice'}
                          </p>
                          <p className="text-sm text-gray-500">{formatDateTimeSafe(session.completedAt)}</p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-3">
                          <span className={`text-xl font-bold ${score === null ? 'text-gray-400' : getScoreColor(score)}`}>
                            {formatScore(score)}
                          </span>
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                      {session.id && (
                        <button
                          type="button"
                          aria-label={`Delete practice session ${index + 1}`}
                          className="mr-3 p-1.5 text-gray-400 transition-colors hover:text-red-500"
                          onClick={(event) => handleDeleteSession(event, session)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {selectedSession && (
        <SessionModal
          session={selectedSession}
          sessionNumber={selectedSessionIndex + 1}
          onClose={() => setSelectedSessionIndex(null)}
        />
      )}
    </Card>
  );
}
