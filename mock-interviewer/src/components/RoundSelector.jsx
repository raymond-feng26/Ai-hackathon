import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { generateQuestions } from '../services/ai';
import Button from './ui/Button';
import Card from './ui/Card';
import {
  HandRaisedIcon,
  ComputerDesktopIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const ROUNDS = {
  first: {
    name: '1st Round',
    title: 'Behavioral Interview',
    description: 'Introduction and background questions to get to know you',
    Icon: HandRaisedIcon,
    color: 'bg-green-100 text-green-600',
    questionCount: 5
  },
  second: {
    name: '2nd Round',
    title: 'Technical Interview',
    description: 'Deep dive into your technical skills and problem-solving',
    Icon: ComputerDesktopIcon,
    color: 'bg-blue-100 text-blue-600',
    questionCount: 5
  },
  final: {
    name: 'Final Round',
    title: 'Culture Fit',
    description: 'Values alignment and long-term goals discussion',
    Icon: UserGroupIcon,
    color: 'bg-purple-100 text-purple-600',
    questionCount: 5
  }
};

export default function RoundSelector() {
  const navigate = useNavigate();
  const { resumeText, jobDescription, setSelectedRound, setQuestions, resetInterview, linkedApplicationId } = useInterview();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only job description is required - resume is optional
    if (!jobDescription) {
      navigate('/upload');
    }
  }, [jobDescription, navigate]);

  if (!jobDescription) {
    return null;
  }

  const handleRoundSelect = async (roundKey) => {
    setLoading(true);
    setSelectedRound(roundKey);
    resetInterview();

    try {
      const generatedQuestions = await generateQuestions(resumeText, jobDescription, roundKey);
      setQuestions(generatedQuestions);
      navigate('/interview');
    } catch (error) {
      console.error('Failed to generate questions:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">
          Choose Interview Round
        </h1>
        <p className="text-gray-600 mb-12 text-center">
          Select which round you'd like to practice for
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(ROUNDS).map(([key, round]) => {
            const IconComponent = round.Icon;
            return (
              <Card
                key={key}
                onClick={() => !loading && handleRoundSelect(key)}
                className={`text-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${round.color}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {round.name}
                </h2>
                <h3 className="text-lg font-semibold text-primary mb-3">
                  {round.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {round.description}
                </p>
                <p className="text-sm text-gray-500">
                  {round.questionCount} questions
                </p>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(linkedApplicationId ? `/applications/${linkedApplicationId}` : '/analysis')}
            disabled={loading}
          >
            {linkedApplicationId ? 'Back to Application' : 'Back to Analysis'}
          </Button>
        </div>
      </div>
    </div>
  );
}
