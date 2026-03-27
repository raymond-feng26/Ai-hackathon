# Mock Interviewer

An AI-powered interview preparation and job application tracking tool. Upload your resume, paste a job description, and get instant analysis, tailored practice interviews with real-time grading, and recording analysis — all in the browser.

## Features

### Interview Preparation
- **Resume Analysis** — Upload PDF/DOCX resumes and compare against job descriptions. Get a match score, keyword gap analysis, and suggested resume edits.
- **3-Round Practice Interviews** — Behavioral, Technical, and Culture Fit rounds with AI-generated questions tailored to your resume and the job description.
- **Real-Time Grading** — Each answer is graded instantly with strengths, weaknesses, and specific improvement suggestions.
- **Voice Input** — Answer questions by voice using the browser's Web Speech API — no setup required.
- **Session Summary** — Overall score, aggregated strengths/weaknesses, and top improvement areas after each session.

### Recording Analysis
- **Upload & Analyze** — Upload an audio recording of a real interview and get an AI-generated report card with feedback.

### Job Application Tracker
- **Application Dashboard** — Track applications through stages: Sent, Read, Interviewing, Interviewed, Offer.
- **Resume Deck** — Save and manage up to 5 resumes for quick reuse across applications.
- **Linked Practice Sessions** — Run practice interviews directly from an application and view past session results.
- **Inline Editing** — Edit application details (company, role, JD, notes) without leaving the page.

## Live Demo

Deployed on Vercel: ai-hackathon-sable.vercel.app

## Getting Started

### Prerequisites
- Node.js 18+
- A Google Gemini API key (free tier at [ai.google.dev](https://ai.google.dev/))

### Install & Run

```bash
cd mock-interviewer
npm install
```

Create a `.env` file:

```
VITE_GEMINI_API_KEY=your_key_here
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> Without an API key the app falls back to mock AI responses — useful for UI testing.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7 |
| Build | Vite |
| Styling | Tailwind CSS 4 |
| AI | Google Gemini 2.5 Flash (`@google/generative-ai`) |
| Speech-to-Text | Browser Web Speech API |
| PDF Parsing | pdf.js |
| DOCX Parsing | Mammoth |
| Icons | Heroicons |
| Persistence | localStorage |
| Deployment | Vercel |

## Project Structure

```
mock-interviewer/
├── src/
│   ├── components/             # Page-level components
│   │   ├── ui/                 # Reusable UI (Button, Card, BackButton, etc.)
│   │   ├── Landing.jsx         # Hero page with feature cards
│   │   ├── ResumeUpload.jsx    # Resume + JD input
│   │   ├── AnalysisResults.jsx # Match score & gap analysis
│   │   ├── RoundSelector.jsx   # Interview round picker
│   │   ├── InterviewSession.jsx# Live Q&A with grading
│   │   ├── Summary.jsx         # Post-interview report
│   │   ├── RecordingAnalysis.jsx# Upload & analyze interview recordings
│   │   ├── ResumeDeck.jsx      # Saved resume manager
│   │   ├── ApplicationTracker.jsx # Application dashboard
│   │   ├── AddApplication.jsx  # New application form
│   │   └── ApplicationDetails.jsx # Single application view
│   ├── services/
│   │   ├── ai.js               # AI service switcher (mock vs Gemini)
│   │   ├── gemini.js           # Google Gemini API calls
│   │   ├── mockAI.js           # Mock responses for development
│   │   ├── pdfParser.js        # PDF text extraction
│   │   └── resumeParser.js     # Resume file handling
│   ├── context/
│   │   ├── AppContext.jsx       # Global state (resumes, applications, localStorage)
│   │   └── InterviewContext.jsx # Interview session state
│   ├── hooks/
│   │   └── useSpeechToText.js   # Web Speech API hook
│   └── utils/                   # Shared helpers (scoring, dates, rounds, status)
├── index.html
├── vite.config.js
├── tailwind.config.js
└── vercel.json                  # SPA rewrites for Vercel
```

## User Flow

1. **Landing** — Choose: start a new interview, manage applications, manage resumes, or analyze a recording
2. **Upload** — Drag-drop resume (PDF/DOCX) + paste job description
3. **Analysis** — View match score, keyword gaps, strengths, and suggested resume edits
4. **Round Select** — Pick Behavioral, Technical, or Culture Fit
5. **Interview** — Answer 5 AI-generated questions (text or voice), get graded in real time
6. **Summary** — Overall score, strengths, weaknesses, and top 3 improvements
7. **Save** — Optionally save as a tracked application

## Development

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## License

MIT
