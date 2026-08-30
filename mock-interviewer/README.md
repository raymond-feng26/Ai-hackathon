# 2027 Internship Workspace

A local-first opportunity tracker for a 2027 Summer Internship search, with the project's existing AI resume analysis, interview practice, and recording analysis kept as linked secondary tools.

The primary `/applications` workspace is designed as a more useful job-search spreadsheet: capture roles before they open, triage F-1 eligibility and export-control constraints, manage referrals and deadlines, track next actions, and keep the General SWE / AI Systems / Robotics application mix visible.

## Live Demo

[ai-hackathon-sable.vercel.app](https://ai-hackathon-sable.vercel.app)

Data is stored in `localStorage`, so each browser origin has its own data. Production and Vercel Preview URLs do not share records. Use the JSON full-backup feature before clearing browser data or moving to another browser/device.

## Features

### Opportunity tracking

- Dense desktop table with a compact mobile-card fallback
- Quick Add for company, role, and optional job URL
- Stages from `watching` and `saved` through `offer`, `rejected`, and `closed`
- Inline stage, track, priority, and eligibility editing
- F-1-focused eligibility reasons including sponsorship, U.S. person, citizenship, and export control
- Search, facet filters, and quick views for To Apply, Active, Visa Review, Watching, and Archived
- Deadline and next-action urgency, default priority sorting, and weekly/application-mix summaries
- Soft archive/restore and an activity timeline with stage-change and manual-note events
- Versioned migration from the legacy `sent/read/interviewing/interviewed` model

### Data safety

- CSV export of every non-archived opportunity's core spreadsheet fields
- CSV import with defaults, row-level error isolation, RFC 4180 quoting, UTF-8 BOM, and spreadsheet-formula protection
- Full JSON backup/restore for job descriptions, events, sessions, analyses, and resumes
- Date-stamped export filenames and validation before a destructive restore

### Resume deck

- Unlimited named resume versions
- Target-track labels for General SWE, AI Systems/GPU, Robotics/Research, and General
- Archive/restore instead of destructive deletion
- Opportunity-level resume-name snapshots, so history survives later renames or archival

### Secondary interview tools

- PDF/DOCX resume parsing and job-description match analysis
- Behavioral, technical, and culture-fit practice rounds with per-answer feedback
- Practice sessions linked back to an opportunity
- Audio recording analysis

## Getting Started

### Prerequisites

- Node.js 20.19+ (Node 22 LTS is recommended for Vite 8)
- npm
- Optional AI provider credentials for live AI responses

Install and run:

```bash
cd mock-interviewer
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Without a configured AI key, interview features fall back to mock responses. The opportunity tracker, CSV, JSON backup, and resume organization do not require an API key.

## Environment Variables and Security

The current client can select Gemini with:

```text
VITE_GEMINI_API_KEY=your_key_here
```

Any `VITE_*` value is embedded into the browser bundle by Vite. That means `VITE_GEMINI_API_KEY` is not secret in a production deployment. Restrict and rotate deployed credentials; a future security pass should move provider calls behind a server-side endpoint. This repository intentionally does not change that AI behavior in the tracker refactor.

## Validation

```bash
npm test
npm run lint
npm run build
```

Pure-function tests cover schema migration, stage events, search/sort/filter behavior, duplicate detection, CSV round trips and malformed rows, JSON backup/restore, date safety, and resume migration.

## Deployment on Vercel

The Vercel project's **Root Directory must be `mock-interviewer`** because `package.json` and `vercel.json` live in this folder. The checked-in rewrite keeps React Router deep links working:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Vercel can use the standard commands:

- Build command: `npm run build`
- Output directory: `dist`

CSV and JSON operations run entirely in the browser; they do not require a Vercel Function.

## Project Structure

```text
src/
├── components/
│   ├── applications/       # Table, filters, Quick Add, summary, data menu, timeline/form helpers
│   ├── ApplicationTracker.jsx
│   ├── AddApplication.jsx
│   ├── ApplicationDetails.jsx
│   ├── ResumeDeck.jsx
│   └── ...                 # Existing interview and recording tools
├── context/
│   ├── AppContext.jsx      # React-facing opportunity/resume operations
│   └── InterviewContext.jsx
├── domain/
│   ├── opportunity.js      # Schema, enums, defaults, normalization
│   └── resume.js
├── storage/
│   └── appStorage.js       # localStorage adapter
├── utils/
│   ├── opportunityData.js  # Migration, events, duplicate detection, filters/sort/summary
│   ├── opportunityCsv.js
│   ├── backup.js
│   └── *.test.js
└── services/               # Existing AI and parser services
```

## Data Model Notes

- New opportunities default to `stage: saved`; `appliedAt` stays `null` until entering Applied, OA, Interview, or Offer.
- Every stage change appends an immutable timeline event with the previous stage, next stage, and timestamp.
- Legacy records are normalized field-by-field on load. Missing arrays/objects receive safe defaults, while job descriptions, notes, resume links, sessions, and analyses are preserved.
- Opportunity deletion is a soft archive. Archived rows are hidden from normal views and CSV exports but remain in full JSON backups.

## License

MIT
