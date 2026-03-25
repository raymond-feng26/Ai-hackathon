// Mock AI service - returns realistic fake data for development

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function analyzeResumeVsJD(resumeText, jobDescription) {
  await delay(1500);

  return {
    matchScore: 78,
    missingKeywords: ["Kubernetes", "CI/CD", "Agile", "Docker"],
    strengths: [
      "Strong React experience",
      "Team leadership skills",
      "Full-stack development background"
    ],
    suggestedEmphasis: [
      "Highlight your project management experience in the behavioral round",
      "Prepare examples of your React work for technical discussions",
      "Be ready to discuss your experience with team collaboration"
    ],
    // Resume modification suggestions
    modifications: [
      {
        section: "Skills Section",
        original: "JavaScript, React, Node.js, Python",
        recommended: "JavaScript, React, Node.js, Python, Kubernetes, Docker, CI/CD pipelines",
        reason: "Add missing technical skills mentioned in the job description to improve ATS matching"
      },
      {
        section: "Experience - Project Description",
        original: "Built web applications for clients",
        recommended: "Built and deployed scalable web applications using React and Node.js, implementing CI/CD pipelines that reduced deployment time by 60%",
        reason: "Add specific technologies and quantifiable metrics to demonstrate impact"
      },
      {
        section: "Experience - Team Work",
        original: "Worked with team members on various projects",
        recommended: "Led Agile ceremonies and collaborated with cross-functional teams of 8+ members using Scrum methodology",
        reason: "Include Agile methodology and leadership aspects mentioned in job requirements"
      }
    ]
  };
}

export async function generateQuestions(resumeText, jobDescription, round) {
  await delay(1200);

  const questionsByRound = {
    first: [
      "Tell me about yourself and your background.",
      "Why are you interested in this role?",
      "Describe a challenging project you worked on.",
      "How do you handle tight deadlines?",
      "Tell me about a time you had to learn something new quickly."
    ],
    second: [
      "Explain how React hooks work and when you'd use them.",
      "How would you optimize a slow-loading React application?",
      "Describe your experience with state management solutions.",
      "Walk me through your approach to debugging a complex issue.",
      "How do you ensure code quality in your projects?"
    ],
    final: [
      "Where do you see yourself in 5 years?",
      "What motivates you in your work?",
      "How do you handle disagreements with team members?",
      "What kind of work environment do you thrive in?",
      "Why should we hire you over other candidates?"
    ]
  };

  return questionsByRound[round] || questionsByRound.first;
}

export async function gradeAnswer(question, answer, round) {
  await delay(1000);

  const scores = [6, 7, 7, 8, 8, 9];
  const randomScore = scores[Math.floor(Math.random() * scores.length)];

  const strengthsPool = [
    "Clear and structured communication",
    "Provided relevant examples",
    "Demonstrated problem-solving skills",
    "Showed enthusiasm and passion",
    "Good use of specific details",
    "Confident delivery"
  ];

  const weaknessesPool = [
    "Answer could be more concise",
    "Lacked specific metrics or outcomes",
    "Could elaborate more on your role",
    "Missing the 'Result' in STAR format",
    "Could show more enthusiasm",
    "Consider adding context about the challenge"
  ];

  const suggestionsPool = [
    "Try: 'I improved performance by 40%' instead of 'I improved performance'",
    "Add the business impact: 'This resulted in $X revenue increase'",
    "Start with: 'In my role as X, I was responsible for...'",
    "Include timeline: 'Over 6 months, I achieved...'",
    "Mention team size: 'Leading a team of 5 engineers...'",
    "Quantify when possible: 'Reduced load time from 5s to 1.2s'"
  ];

  // Randomly select strengths, weaknesses, and suggestions based on score
  const numStrengths = randomScore >= 8 ? 3 : randomScore >= 6 ? 2 : 1;
  const numWeaknesses = randomScore >= 8 ? 1 : randomScore >= 6 ? 2 : 3;
  const numSuggestions = randomScore >= 8 ? 1 : 2;

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const strengths = shuffle(strengthsPool).slice(0, numStrengths);
  const weaknesses = shuffle(weaknessesPool).slice(0, numWeaknesses);
  const suggestions = shuffle(suggestionsPool).slice(0, numSuggestions);

  const feedbackOptions = {
    high: [
      "Excellent answer! You provided specific examples and demonstrated clear understanding.",
      "Great response! Your answer was well-structured and showed strong experience.",
      "Outstanding! You addressed all aspects of the question effectively."
    ],
    medium: [
      "Good answer, but consider adding more specific examples to strengthen your response.",
      "Solid response. Try to provide more concrete metrics or outcomes next time.",
      "Decent answer. You could improve by elaborating on the impact of your actions."
    ],
    low: [
      "Your answer could be stronger. Focus on providing specific examples from your experience.",
      "Consider using the STAR method (Situation, Task, Action, Result) to structure your response.",
      "Try to be more specific about your role and contributions in the example."
    ]
  };

  let feedbackCategory;
  if (randomScore >= 8) feedbackCategory = 'high';
  else if (randomScore >= 6) feedbackCategory = 'medium';
  else feedbackCategory = 'low';

  const feedback = feedbackOptions[feedbackCategory][
    Math.floor(Math.random() * feedbackOptions[feedbackCategory].length)
  ];

  return {
    score: randomScore,
    feedback,
    strengths,
    weaknesses,
    suggestions,
    improvements: weaknesses // Keep for backward compatibility
  };
}

export async function analyzeInterview(audioBase64, mimeType) {
  await delay(2000);
  return {
    transcriptionSummary: "The candidate discussed their software engineering background, focusing on React and Node.js projects. They described a challenging team leadership experience and how they handled a production outage. The interviewer asked about career goals and the candidate expressed interest in growing into a senior engineering role.",
    overallScore: 6,
    strengths: [
      "Clear explanation of technical projects",
      "Good use of specific examples when describing team experience",
      "Confident and composed throughout"
    ],
    weaknesses: [
      "Frequent use of filler words (um, like) disrupts flow",
      "Answers trailed off without a clear conclusion",
      "Missed quantifying the impact of the production outage fix"
    ],
    suggestions: [
      "Practice pausing instead of using filler words — silence reads as confidence",
      "End each answer with a clear takeaway: 'The result was X'",
      "Quantify your achievements: mention team size, timelines, or business impact"
    ],
    fillerWordCount: 27,
    keyTopics: ["React", "Node.js", "Team leadership", "Production incident", "Career goals", "Code review"]
  };
}
