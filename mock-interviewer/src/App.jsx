import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { InterviewProvider } from './context/InterviewContext';
import { AppProvider } from './context/AppContext';
import Landing from './components/Landing';
import ResumeUpload from './components/ResumeUpload';
import AnalysisResults from './components/AnalysisResults';
import RoundSelector from './components/RoundSelector';
import InterviewSession from './components/InterviewSession';
import Summary from './components/Summary';
import ResumeDeck from './components/ResumeDeck';
import ApplicationTracker from './components/ApplicationTracker';
import AddApplication from './components/AddApplication';
import ApplicationDetails from './components/ApplicationDetails';
import RecordingAnalysis from './components/RecordingAnalysis';

function App() {
  return (
    <AppProvider>
      <InterviewProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/upload" element={<ResumeUpload />} />
            <Route path="/analysis" element={<AnalysisResults />} />
            <Route path="/setup" element={<RoundSelector />} />
            <Route path="/interview" element={<InterviewSession />} />
            <Route path="/summary" element={<Summary />} />
            {/* New routes for job application tracker */}
            <Route path="/resumes" element={<ResumeDeck />} />
            <Route path="/applications" element={<ApplicationTracker />} />
            <Route path="/applications/new" element={<AddApplication />} />
            <Route path="/applications/:id" element={<ApplicationDetails />} />
            <Route path="/analyze-recording" element={<RecordingAnalysis />} />
          </Routes>
        </Router>
      </InterviewProvider>
    </AppProvider>
  );
}

export default App;
