import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from './ui/Button';
import Card from './ui/Card';
import {
  BriefcaseIcon,
  PlusIcon,
  TrashIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const STATUS_CONFIG = {
  sent: { label: 'Sent', color: 'bg-gray-100 text-gray-700' },
  read: { label: 'Read', color: 'bg-blue-100 text-blue-700' },
  interviewing: { label: 'Interviewing', color: 'bg-yellow-100 text-yellow-700' },
  interviewed: { label: 'Interviewed', color: 'bg-purple-100 text-purple-700' },
  offer: { label: 'Offer', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' }
};

export default function ApplicationTracker() {
  const navigate = useNavigate();
  const { applications, deleteApplication, updateApplication } = useApp();
  const [filter, setFilter] = useState('all');

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this application?')) {
      deleteApplication(id);
    }
  };

  const handleStatusChange = (e, id) => {
    e.stopPropagation();
    updateApplication(id, { status: e.target.value });
  };

  const filteredApps = filter === 'all'
    ? applications
    : applications.filter(app => app.status === filter);

  const sortedApps = [...filteredApps].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Applications
            </h1>
            <p className="text-gray-600">
              Track your job applications
            </p>
          </div>
          <Button onClick={() => navigate('/applications/new')}>
            <PlusIcon className="w-5 h-5 mr-2 inline" />
            New Application
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({applications.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = applications.filter(app => app.status === key).length;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-primary text-white'
                    : `${config.color} hover:opacity-80`
                }`}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>

        {sortedApps.length === 0 ? (
          <Card className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <BriefcaseIcon className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No applications yet' : `No ${STATUS_CONFIG[filter]?.label.toLowerCase()} applications`}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all'
                ? 'Start tracking your job applications'
                : 'Try a different filter'}
            </p>
            {filter === 'all' && (
              <Button onClick={() => navigate('/applications/new')}>
                Add Application
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedApps.map(app => (
              <Card
                key={app.id}
                onClick={() => navigate(`/applications/${app.id}`)}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <BriefcaseIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {app.company}
                      </h3>
                      <select
                        value={app.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(e, app.id)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${STATUS_CONFIG[app.status].color}`}
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <option key={key} value={key}>{config.label}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{app.role}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>Applied {formatDate(app.appliedAt)}</span>
                      {app.sessions.length > 0 && (
                        <span>{app.sessions.length} practice session{app.sessions.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(e, app.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
