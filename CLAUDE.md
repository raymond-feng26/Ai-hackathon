# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Master Plan

**Why this project exists:**
- Personal pain point: Struggled with interview prep, want to solve it
- Help others: Build a tool that makes interview prep accessible
- Portfolio: Create an impressive project demonstrating AI integration skills

**Success criteria for hackathon:**
- Working demo that judges can try immediately
- Smooth user experience from resume upload to interview feedback
- "Wow factor" from real-time AI grading

## Tech Stack

- **Frontend:** React + Vite
- **AI:** Google Gemini API (free tier)
- **Speech-to-text:** Browser Web Speech API (free, no auth required)
- **PDF parsing:** pdf.js or pdf-parse
- **Styling:** Tailwind CSS (fast to build professional UI)
- **Deployment:** Vercel or Netlify (free, instant deploy)

## Design Guidelines

**Visual Style:** Professional/Corporate
- Color palette: Blues and grays (trust, professionalism)
- Primary: #2563EB (blue-600), Secondary: #64748B (slate-500)
- Background: #F8FAFC (slate-50), Cards: white with subtle shadows
- Font: Inter or system fonts for clean readability
- Rounded corners (8px), clean spacing, minimal decoration

**Interaction Feel:**
- Smooth transitions (200-300ms)
- Clear feedback on actions (loading states, success indicators)
- One action per screen - don't overwhelm

**Emotional Goal:** User feels "This will help me nail my interview" - confidence boost

## User Journey

1. **Landing** → User sees clean hero: "Ace Your Next Interview" with clear CTA
2. **Upload** → Drag-drop resume PDF, paste job description - feels effortless
3. **Analysis** → See match score, gaps, suggestions - feels insightful
4. **Setup** → Pick interview round (1st/2nd/final) - feels in control
5. **Interview** → Answer questions one-by-one, get instant grades - feels coached
6. **Summary** → See overall score + top 3 improvements - feels actionable
7. **Exit** → User thinks "I know exactly what to work on"

## Implementation Plan

### Must-Have (Core Demo)
1. Resume upload + text extraction from PDF
2. Job description input (paste text)
3. AI analysis: match score + keyword gaps
4. Interview round selector
5. Question generation based on JD + round
6. Text input for answers
7. Real-time grading per answer
8. Session summary with improvement areas

### Better-to-Have (If Time Allows)
- Voice input via Web Speech API
- Suggested resume edits
- More detailed grading rubrics per round
- Progress indicator during interview

### Nice-to-Have (Stretch Goals)
- Interview upload & analysis mode
- Filler word detection
- Confidence signal analysis
- Mobile-optimized layout

## Architecture

### Core Modules

**Resume & JD Analysis Pipeline**
- PDF parsing for resume extraction
- Text analysis comparing resume against job description
- Output: match score, keyword gaps, suggested edits, experience highlights

**Interview Session Manager**
- Three interview rounds with distinct question styles:
  - Round 1: Behavioral/intro questions
  - Round 2: Technical/deeper dive
  - Round 3: Culture fit/offer stage
- Round selection determines question generation strategy and grading rubric

**Live Interview Mode**
- Sequential question delivery (one at a time)
- Dual input: text or voice (speech-to-text)
- Immediate per-answer grading with specific feedback
- Session summary with top 3 improvement areas

**Interview Upload & Analysis** (stretch goal)
- Audio/video transcription
- Full conversation analysis

### Technical Constraints
- Browser-based: no installation required
- Voice input works without auth (Web Speech API)
- Response time target: 3-4 seconds max
- Mobile-friendly enough to demo on phone

## Tasks

> Update this section as tasks are completed. Check off with [x] when done.

### MVP Complete (Phases 1-5)
- [x] Project setup (React + Vite + Tailwind)
- [x] Resume upload with PDF/DOCX parsing
- [x] Job description input
- [x] AI analysis with match score
- [x] Interview round selection
- [x] Live interview with grading
- [x] Summary with improvements

---

### Expansion: Job Application Tracker

#### Phase 0: Bug Fixes
- [x] Fix white screen on "Start New Interview" (Summary.jsx navigation bug)

#### Phase 1: Professional UI
- [x] Install Heroicons
- [x] Replace emojis with icons (11 total across 4 files)
- [x] Update Landing, RoundSelector, FileUpload, AnalysisResults

#### Phase 2: Persistence Layer
- [x] Create AppContext for persistent data
- [x] Implement localStorage for resumes and applications
- [x] Add storage manager utilities

#### Phase 3: Resume Deck
- [x] Build ResumeDeck component (manage up to 5 resumes)
- [x] Resume selection integrated into ResumeUpload (can select saved resumes)
- [x] Update ResumeUpload to save/select resumes
- [x] Add /resumes route

#### Phase 4: Application Tracker
- [x] Build ApplicationTracker dashboard
- [x] Build AddApplication form
- [x] Build ApplicationDetails view
- [x] Add status tracking (sent/read/interviewing/interviewed/offer)
- [x] Add /applications routes

#### Phase 5: Enhanced Resume Analysis
- [x] Add resume modification suggestions to mockAI
- [x] Display before/after recommendations in AnalysisResults

#### Phase 9: Real AI Integration
- [x] Install @google/generative-ai SDK
- [x] Create src/services/gemini.js with real Gemini 2.5 Flash calls (analyzeResumeVsJD, generateQuestions, gradeAnswer)
- [x] Wire ai.js switcher to use gemini.js when VITE_GEMINI_API_KEY is set
- [x] Tightened grading prompt — strict rubric, 5-7 average, 9+ reserved for exceptional answers
- [x] Fixed "Save as Application" not attaching interview session to new application
- [x] Added delete button with confirm dialog on practice sessions in ApplicationDetails
- [x] Added deleteSessionFromApplication to AppContext

#### Phase 6: Enhanced Interview Feedback
- [x] Add weaknesses and suggestions to gradeAnswer
- [x] Show user responses in feedback
- [x] Add aggregated feedback in Summary (strengths, weaknesses, improvement tips)
- [x] Link interview sessions to applications (via linkedApplicationId in InterviewContext)

#### Phase 7: Voice Input
- [x] Create useSpeechToText hook (Web Speech API)
- [x] Add microphone button to InterviewSession
- [x] Real-time transcript display

#### Phase 8: Recording Analysis (Future)
- [ ] Deferred - requires external transcription API

---

### UX & Navigation Fixes
- [x] Start practice interview from ApplicationDetails (loads resume + JD into context)
- [x] Edit application inline (company, role, date, resume, JD, notes, applied date) with Save/Cancel
- [x] Back arrows on all detail pages (ResumeDeck, ApplicationDetails, AddApplication)
- [x] "Back to Application" in Summary correctly navigates to originating application
- [x] Context-aware back button in RoundSelector (Back to Application vs Back to Analysis)
- [x] ResumeUpload back button navigates to previous page (navigate(-1))
- [x] "Upload one" link shown when no resumes exist (AddApplication, ApplicationDetails edit)
- [x] Start Practice button disabled without both JD and linked resume
- [x] Nav button changed from "New Interview" to "New Application"
- [x] Resume upload from ResumeDeck (no JD required)
- [x] Home button on AnalysisResults page
- [x] Fixed Summary "Back to Home" redirect loop (isLeavingRef guard)
- [x] Fixed ApplicationDetails redirect on refresh (wait for isLoaded)
- [x] AddApplication cancel goes back to previous page (navigate(-1))
- [x] "Save as Application" from AnalysisResults and Summary (pre-fills JD + resume)
- [x] Clickable practice sessions in ApplicationDetails (modal with full summary view)
- [x] "How to Use" guide modal on Landing page (8-step walkthrough)
- [x] Application Tracking section in Landing features area
- [x] Resume text viewer modal in ResumeDeck
- [x] "Open in new tab" support via Link/to prop on Button, BackButton, and nav links

### Deployment
- [x] Vercel deployment with vercel.json for client-side routing
- [x] PDF.js legacy build (v4) for iOS mobile compatibility

---

### Code Quality (Simplify Pass)
- [x] Extracted shared utils: scoring.js, dateFormatters.js, interviewRounds.js, applicationStatus.js
- [x] Extracted shared UI: BackButton.jsx, ErrorAlert.jsx
- [x] Added useMemo for averageScore, aggregated feedback in Summary.jsx
- [x] Added useMemo for sortedResumes in ResumeDeck.jsx

## Rules

**Before coding:**
- Update task status in this file first
- Read relevant files before modifying

**During coding:**
- Test each module before moving to next
- Do not change core logic without reason
- Ask before making architectural changes

**When stuck:**
- Explain the problem and ask for guidance
- Don't silently change direction

**After completing a task:**
- Mark task as [x] complete
- Note any issues discovered
- Move to next unblocked task
