# Mock Interviewer

An AI-powered interview preparation tool that helps you ace your next interview.

## Features

- **Smart Resume Analysis**: Upload your resume PDF and compare it against job descriptions
- **Match Scoring**: Get an instant compatibility score between your resume and the role
- **Tailored Practice**: Choose from 3 interview rounds (Behavioral, Technical, Culture Fit)
- **Real-time Feedback**: Receive instant AI-powered grading on your answers
- **Actionable Insights**: See your overall performance and top areas to improve

## Getting Started

The app is currently running with **mock AI responses** for development. You can test the full flow without needing an API key.

### Current Status

The development server is running at: **http://localhost:5173/**

Open your browser and visit the link to try the application.

### Project Structure

```
mock-interviewer/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── Landing.jsx     # Hero page
│   │   ├── ResumeUpload.jsx
│   │   ├── AnalysisResults.jsx
│   │   ├── RoundSelector.jsx
│   │   ├── InterviewSession.jsx
│   │   └── Summary.jsx
│   ├── services/           # Business logic
│   │   ├── mockAI.js      # Mock responses (currently active)
│   │   ├── ai.js          # AI service switcher
│   │   └── pdfParser.js   # PDF text extraction
│   ├── context/           # Global state
│   └── hooks/             # Custom React hooks
├── .env.example           # Template for API key
└── README.md
```

## Adding Real AI (Optional)

To use the real Google Gemini API instead of mock data:

1. Get an API key from [https://ai.google.dev/](https://ai.google.dev/)
2. Create a `.env` file in the project root
3. Add: `VITE_GEMINI_API_KEY=your_actual_key_here`
4. Install Gemini SDK: `npm install @google/generative-ai`
5. Create `src/services/gemini.js` with real API implementation
6. Restart the dev server

The app will automatically detect the API key and switch from mock to real AI.

## User Flow

1. **Landing** → Click "Get Started"
2. **Upload** → Drag & drop your resume PDF + paste job description
3. **Analysis** → View match score, missing keywords, and strengths
4. **Setup** → Choose interview round (Behavioral/Technical/Culture Fit)
5. **Interview** → Answer 5 questions, get graded instantly
6. **Summary** → See overall score + top 3 improvement areas

## Development Commands

```bash
npm run dev      # Start dev server (already running)
npm run build    # Build for production
npm run preview  # Preview production build
```

## Tech Stack

- **React + Vite**: Fast, modern development
- **Tailwind CSS**: Professional, responsive styling
- **React Router**: Page navigation
- **PDF.js**: Resume text extraction
- **Google Gemini**: AI-powered analysis (when API key added)

## Notes

- Currently using **mock AI data** - perfect for testing the UI/UX
- All 5 phases of core functionality are complete
- Ready for demo and further enhancement
- Can add voice input and other features as needed
