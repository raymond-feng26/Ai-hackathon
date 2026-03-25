import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeInterview } from '../services/ai';
import { getScoreColor } from '../utils/scoring';
import Card from './ui/Card';
import Button from './ui/Button';
import BackButton from './ui/BackButton';
import {
  MicrophoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowUpTrayIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

const MAX_FILE_SIZE_MB = 20;
const ACCEPTED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];

export default function RecordingAnalysis() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setError('');
    setResult(null);

    if (!ACCEPTED_TYPES.includes(selected.type) && !selected.name.match(/\.(mp3|wav|webm|mp4|m4a|aac)$/i)) {
      setError('Unsupported file type. Please upload an MP3, WAV, WebM, MP4, or M4A file.');
      return;
    }
    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Please upload a recording under ${MAX_FILE_SIZE_MB}MB (~15 minutes of MP3).`);
      return;
    }
    setFile(selected);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError('');

    try {
      const mimeType = file.type || 'audio/mpeg';
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const analysis = await analyzeInterview(base64, mimeType);
      setResult(analysis);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <BackButton to="/" label="Back to Home" />

        <div className="flex items-center gap-3 mb-6 mt-2">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <MicrophoneIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Recording Analysis</h1>
            <p className="text-gray-500 text-sm">Upload a real interview recording and get AI feedback</p>
          </div>
        </div>

        {!result && (
          <Card className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Upload Recording</h2>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <ArrowUpTrayIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              {file ? (
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium">Click to select audio file</p>
                  <p className="text-sm text-gray-400 mt-1">MP3, WAV, WebM, MP4, M4A — max 20MB (~15 min)</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/wav,audio/webm,audio/mp4,audio/x-m4a,audio/aac,.mp3,.wav,.webm,.mp4,.m4a,.aac"
              className="hidden"
              onChange={handleFileChange}
            />

            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button
              className="w-full mt-4"
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing recording…' : 'Analyze Recording'}
            </Button>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            {/* Score header */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Analysis Report</h2>
                  <p className="text-sm text-gray-500">{file?.name}</p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
                    {result.overallScore}/10
                  </div>
                  <p className="text-xs text-gray-400">Overall Score</p>
                </div>
              </div>

              {/* Summary */}
              <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 mb-3">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{result.transcriptionSummary}</p>
              </div>

              {/* Filler words + topics */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2.5 py-1 rounded-full">
                  {result.fillerWordCount} filler word{result.fillerWordCount !== 1 ? 's' : ''}
                </span>
                {result.keyTopics.map((topic, i) => (
                  <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                    {topic}
                  </span>
                ))}
              </div>
            </Card>

            {/* Strengths */}
            <Card>
              <div className="flex items-center mb-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-700">Strengths</h3>
              </div>
              <ul className="space-y-3 ml-7">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-700">{s}</li>
                ))}
              </ul>
            </Card>

            {/* Weaknesses */}
            <Card>
              <div className="flex items-center mb-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 mr-2" />
                <h3 className="font-semibold text-orange-700">Areas to Improve</h3>
              </div>
              <ul className="space-y-3 ml-7">
                {result.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-gray-700">{w}</li>
                ))}
              </ul>
            </Card>

            {/* Suggestions */}
            <Card>
              <div className="flex items-center mb-3">
                <LightBulbIcon className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-700">Try This Instead</h3>
              </div>
              <ul className="space-y-3 ml-7">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-gray-700 italic">{s}</li>
                ))}
              </ul>
            </Card>

            {/* Footer actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Analyze Another
              </Button>
              <Button onClick={() => navigate('/')} className="flex-1">
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
