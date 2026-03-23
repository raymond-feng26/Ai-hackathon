import { createContext, useContext, useState } from 'react';

const InterviewContext = createContext();

export function InterviewProvider({ children }) {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [resumeId, setResumeId] = useState(null);
  const [linkedApplicationId, setLinkedApplicationId] = useState(null);

  const resetInterview = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setGrades([]);
  };

  const resetAll = () => {
    setResumeText('');
    setJobDescription('');
    setAnalysis(null);
    setSelectedRound(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setGrades([]);
    setResumeId(null);
    setLinkedApplicationId(null);
  };

  const value = {
    resumeText,
    setResumeText,
    jobDescription,
    setJobDescription,
    analysis,
    setAnalysis,
    selectedRound,
    setSelectedRound,
    questions,
    setQuestions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    setAnswers,
    grades,
    setGrades,
    resumeId,
    setResumeId,
    linkedApplicationId,
    setLinkedApplicationId,
    resetInterview,
    resetAll
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within InterviewProvider');
  }
  return context;
}
