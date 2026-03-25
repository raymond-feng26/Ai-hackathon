// AI service switcher - uses mock data unless API key is configured

const USE_MOCK = !import.meta.env.VITE_GEMINI_API_KEY;

let aiService;

if (USE_MOCK) {
  // Use mock AI for development
  aiService = await import('./mockAI.js');
} else {
  aiService = await import('./gemini.js');
}

export const { analyzeResumeVsJD, generateQuestions, gradeAnswer, analyzeInterview } = aiService;
