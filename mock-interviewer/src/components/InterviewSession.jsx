import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { gradeAnswer } from '../services/ai';
import { getScoreColor, INTERVIEW_SCORE_TIERS } from '../utils/scoring';
import useSpeechToText from '../hooks/useSpeechToText';
import Button from './ui/Button';
import Card from './ui/Card';
import TextArea from './ui/TextArea';
import ScoreGuidePopover from './ui/ScoreGuidePopover';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChatBubbleLeftIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/outline';

export default function InterviewSession() {
  const navigate = useNavigate();
  const {
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    setAnswers,
    grades,
    setGrades,
    selectedRound
  } = useInterview();

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentGrade, setCurrentGrade] = useState(null);

  // Voice input
  const {
    isListening,
    transcript,
    error: voiceError,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechToText();

  // Update answer when transcript changes
  useEffect(() => {
    if (transcript) {
      setCurrentAnswer(prev => prev + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Redirect if no questions
  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate('/setup');
    }
  }, [questions, navigate]);

  if (!questions || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) {
      alert('Please provide an answer before submitting');
      return;
    }

    setLoading(true);

    try {
      // Get grade for the answer
      const grade = await gradeAnswer(currentQuestion, currentAnswer, selectedRound);

      // Store answer and grade
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = currentAnswer;
      setAnswers(newAnswers);

      const newGrades = [...grades];
      newGrades[currentQuestionIndex] = grade;
      setGrades(newGrades);

      // Show feedback
      setCurrentGrade(grade);
      setShowFeedback(true);
    } catch (error) {
      console.error('Failed to grade answer:', error);
      alert('Failed to grade answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (isListening) {
      stopListening();
    }
    resetTranscript();

    if (isLastQuestion) {
      // Go to summary
      navigate('/summary');
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
      setShowFeedback(false);
      setCurrentGrade(null);
    }
  };


  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <Card className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {currentQuestion}
          </h2>
        </Card>

        {/* Answer Input */}
        {!showFeedback ? (
          <>
            <Card className="mb-6">
              <div className="relative">
                <TextArea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder={isListening ? "Listening... speak now" : "Type your answer here or use the microphone..."}
                  rows={8}
                />

                {/* Microphone Button */}
                {voiceSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={loading}
                    className={`absolute bottom-3 right-3 p-3.5 rounded-full transition-all ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-gray-100 text-gray-600 hover:bg-primary hover:text-white'
                    } disabled:opacity-50`}
                    title={isListening ? 'Stop recording' : 'Start voice input'}
                    aria-label={isListening ? 'Stop recording' : 'Start voice input'}
                  >
                    <MicrophoneIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Voice Input Status */}
              {isListening && (
                <div className="flex items-center mt-2 text-red-600 text-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
                  Recording... Click the microphone to stop.
                </div>
              )}

              {voiceError && (
                <p className="mt-2 text-red-600 text-sm">{voiceError}</p>
              )}

              {!voiceSupported && (
                <p className="mt-2 text-gray-500 text-sm">
                  Voice input not available. Use Chrome or Edge for voice input.
                </p>
              )}
            </Card>

            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/setup')}
                disabled={loading}
              >
                Back
              </Button>
              <Button onClick={handleSubmitAnswer} disabled={loading}>
                {loading ? 'Grading...' : 'Submit Answer'}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Your Response */}
            <Card className="mb-4">
              <div className="flex items-center mb-3">
                <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-700">Your Response</h3>
              </div>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
                {currentAnswer}
              </p>
            </Card>

            {/* Score and Feedback */}
            <Card className="mb-6 bg-blue-50 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">Your Score</h3>
                  <ScoreGuidePopover tiers={INTERVIEW_SCORE_TIERS} />
                </div>
                <div className={`text-4xl font-bold ${getScoreColor(currentGrade.score)}`}>
                  {currentGrade.score}/10
                </div>
              </div>
              <p className="text-gray-700 mb-4">{currentGrade.feedback}</p>

              {/* Strengths */}
              {currentGrade.strengths && currentGrade.strengths.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                    <h4 className="font-semibold text-green-700">Strengths</h4>
                  </div>
                  <ul className="space-y-3 ml-7">
                    {currentGrade.strengths.map((strength, idx) => (
                      <li key={idx} className="text-gray-700 text-sm">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {currentGrade.weaknesses && currentGrade.weaknesses.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 mr-2" />
                    <h4 className="font-semibold text-orange-700">Areas to Improve</h4>
                  </div>
                  <ul className="space-y-3 ml-7">
                    {currentGrade.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-gray-700 text-sm">{weakness}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvement Suggestions */}
              {currentGrade.suggestions && currentGrade.suggestions.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center mb-2">
                    <LightBulbIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-blue-700">Try This Instead</h4>
                  </div>
                  <ul className="space-y-3 ml-7">
                    {currentGrade.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-gray-700 text-sm italic">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <div className="flex justify-center">
              <Button onClick={handleNextQuestion}>
                {isLastQuestion ? 'View Summary' : 'Next Question'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
