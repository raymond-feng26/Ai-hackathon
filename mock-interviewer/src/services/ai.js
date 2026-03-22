// AI service switcher - uses mock data unless API key is configured

const USE_MOCK = !import.meta.env.VITE_GEMINI_API_KEY;

let aiService;

if (USE_MOCK) {
  // Use mock AI for development
  aiService = await import('./mockAI.js');
} else {
  // Use real Gemini API when key is available
  // aiService = await import('./gemini.js');
  // For now, fallback to mock if gemini.js doesn't exist
  aiService = await import('./mockAI.js');
}

export const { analyzeResumeVsJD, generateQuestions, gradeAnswer } = aiService;
