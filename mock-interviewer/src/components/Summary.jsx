import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { useApp } from '../context/AppContext';
import { getScoreColor, getOverallColor } from '../utils/scoring';
import { aggregateFeedback } from '../utils/feedbackAggregator';
import Button from './ui/Button';
import Card from './ui/Card';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChatBubbleLeftIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

export default function Summary() {
  const navigate = useNavigate();
  const { questions, answers, grades, selectedRound, linkedApplicationId, jobDescription, resumeId, resetAll, resetInterview } = useInterview();
  const { addSessionToApplication } = useApp();
  const sessionSavedRef = useRef(false);

  const isLeavingRef = useRef(false);

  // Redirect if no grades (proper way using useEffect)
  useEffect(() => {
    if (!isLeavingRef.current && (!grades || grades.length === 0)) {
      navigate('/setup');
    }
  }, [grades, navigate]);

  const averageScore = useMemo(() => {
    if (!grades || grades.length === 0) return 0;
    const total = grades.reduce((sum, grade) => sum + grade.score, 0);
    return (total / grades.length).toFixed(1);
  }, [grades]);

  // Save session to application if linked
  useEffect(() => {
    if (linkedApplicationId && grades && grades.length > 0 && !sessionSavedRef.current) {
      sessionSavedRef.current = true;
      addSessionToApplication(linkedApplicationId, {
        round: selectedRound,
        score: parseFloat(averageScore),
        questions,
        answers,
        grades
      });
    }
  }, [linkedApplicationId, grades, selectedRound, averageScore, questions, answers, addSessionToApplication]);

  const { strengths: uniqueStrengths, weaknesses: uniqueWeaknesses, suggestions: uniqueSuggestions } = useMemo(
    () => aggregateFeedback(grades),
    [grades]
  );

  if (!grades || grades.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No interview data</h2>
          <p className="text-gray-500 mb-6">Complete an interview session to see your summary.</p>
          <Button to="/setup">Go to Interview Setup</Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">
          Interview Summary
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Great job completing the interview practice!
        </p>

        {/* Overall Score */}
        <Card className={`mb-8 border-2 ${getOverallColor(averageScore)}`}>
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Overall Score</h2>
            <div className={`text-7xl font-bold ${getScoreColor(averageScore)} mb-2`}>
              {averageScore}/10
            </div>
            <p className="text-gray-600">
              {averageScore >= 8 && "Excellent performance! You're well-prepared."}
              {averageScore >= 6 && averageScore < 8 && "Good job! Focus on the improvement areas below."}
              {averageScore < 6 && "Keep practicing! Review the feedback carefully."}
            </p>
          </div>
        </Card>

        {/* Overall Feedback Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          {uniqueStrengths.length > 0 && (
            <Card className="bg-green-50 border border-green-200">
              <div className="flex items-center mb-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-green-800">What You Did Well</h2>
              </div>
              <ul className="space-y-2">
                {uniqueStrengths.map((strength, idx) => (
                  <li key={idx} className="text-green-900 text-sm flex items-start">
                    <span className="text-green-600 mr-2">-</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Weaknesses */}
          {uniqueWeaknesses.length > 0 && (
            <Card className="bg-orange-50 border border-orange-200">
              <div className="flex items-center mb-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-orange-600 mr-2" />
                <h2 className="text-lg font-semibold text-orange-800">Areas to Improve</h2>
              </div>
              <ul className="space-y-2">
                {uniqueWeaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-orange-900 text-sm flex items-start">
                    <span className="text-orange-600 mr-2">-</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Improvement Suggestions */}
        {uniqueSuggestions.length > 0 && (
          <Card className="mb-8 bg-blue-50 border border-blue-200">
            <div className="flex items-center mb-4">
              <LightBulbIcon className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-blue-800">Try These Tips Next Time</h2>
            </div>
            <div className="space-y-3">
              {uniqueSuggestions.map((suggestion, idx) => (
                <div key={idx} className="flex items-start bg-white rounded-lg p-3 border border-blue-100">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-gray-700 text-sm italic">{suggestion}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* All Q&A with Scores */}
        <h2 className="text-2xl font-semibold mb-4">Detailed Question Review</h2>
        <div className="space-y-6 mb-8">
          {questions.map((question, idx) => (
            <Card key={idx} className="border-l-4 border-primary">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 flex-1">
                  Q{idx + 1}: {question}
                </h3>
                <span className={`text-xl font-bold ${getScoreColor(grades[idx].score)} ml-4`}>
                  {grades[idx].score}/10
                </span>
              </div>

              {/* Your Response */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <ChatBubbleLeftIcon className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-600">Your Response</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-gray-700 text-sm">{answers[idx]}</p>
                </div>
              </div>

              {/* Feedback */}
              <p className="text-sm text-gray-700 mb-3">{grades[idx].feedback}</p>

              {/* Strengths & Weaknesses for this question */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {grades[idx].strengths && grades[idx].strengths.length > 0 && (
                  <div className="bg-green-50 rounded p-2">
                    <p className="text-xs font-medium text-green-700 mb-1">Strengths</p>
                    <ul className="text-xs text-green-900 space-y-1">
                      {grades[idx].strengths.slice(0, 2).map((s, i) => (
                        <li key={i}>- {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {grades[idx].weaknesses && grades[idx].weaknesses.length > 0 && (
                  <div className="bg-orange-50 rounded p-2">
                    <p className="text-xs font-medium text-orange-700 mb-1">To Improve</p>
                    <ul className="text-xs text-orange-900 space-y-1">
                      {grades[idx].weaknesses.slice(0, 2).map((w, i) => (
                        <li key={i}>- {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Button variant="outline" onClick={() => {
            isLeavingRef.current = true;
            resetInterview();
            navigate('/setup');
          }}>
            Try Another Round
          </Button>
          {linkedApplicationId && linkedApplicationId !== 'new' ? (
            <Button onClick={() => {
              isLeavingRef.current = true;
              const appId = linkedApplicationId;
              resetAll();
              navigate(`/applications/${appId}`);
            }}>
              Back to Application
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate('/applications/new', { state: { jobDescription, resumeId } })}>
                <BriefcaseIcon className="w-4 h-4 mr-1 inline" />
                Save as Application
              </Button>
              <Button onClick={() => {
                isLeavingRef.current = true;
                resetAll();
                navigate('/');
              }}>
                Back to Home
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
