import { useMemo, useState } from 'react';
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  ClockIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { STAGE_CONFIG } from '../../domain/opportunity';
import Card from '../ui/Card';

const asArray = (value) => (Array.isArray(value) ? value : []);

const isValidTimestamp = (value) => {
  if (value === null || value === undefined || value === '') return false;
  return Number.isFinite(new Date(value).getTime());
};

const formatDateTimeSafe = (value) => {
  if (!isValidTimestamp(value)) return 'Date unavailable';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const toLocalDateTimeInput = (value = Date.now()) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
};

const getStageLabel = (stage) => {
  if (typeof stage !== 'string' || !stage) return 'Unknown';
  return STAGE_CONFIG[stage]?.label || stage;
};

const getEventNote = (event, fallback) => (
  typeof event.note === 'string' && event.note.trim() ? event.note : fallback
);

const describeEvent = (event) => {
  switch (event.type) {
    case 'created':
      return getEventNote(event, 'Opportunity created');
    case 'stage_changed':
      return (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          Stage changed from <strong>{getStageLabel(event.fromStage)}</strong>
          <ArrowRightIcon className="h-3.5 w-3.5" />
          <strong>{getStageLabel(event.toStage)}</strong>
        </span>
      );
    case 'applied':
      return getEventNote(event, 'Application submitted');
    case 'referral_requested':
      return getEventNote(event, 'Referral requested');
    case 'note':
      return getEventNote(event, 'Timeline note');
    default:
      return getEventNote(event, 'Opportunity updated');
  }
};

const getEventStyle = (type) => {
  switch (type) {
    case 'created':
      return { Icon: CalendarDaysIcon, iconClass: 'bg-slate-100 text-slate-600' };
    case 'stage_changed':
      return { Icon: ArrowRightIcon, iconClass: 'bg-blue-100 text-blue-700' };
    case 'applied':
      return { Icon: CheckCircleIcon, iconClass: 'bg-green-100 text-green-700' };
    case 'referral_requested':
      return { Icon: UserPlusIcon, iconClass: 'bg-purple-100 text-purple-700' };
    case 'note':
      return { Icon: ChatBubbleLeftEllipsisIcon, iconClass: 'bg-amber-100 text-amber-700' };
    default:
      return { Icon: ClockIcon, iconClass: 'bg-gray-100 text-gray-600' };
  }
};

const buildTimeline = (opportunity) => {
  const events = asArray(opportunity?.events)
    .filter((event) => event && typeof event === 'object')
    .map((event, index) => ({
      ...event,
      id: event.id || `event-${index}`,
    }));

  if (
    !events.some((event) => event.type === 'created' && isValidTimestamp(event.timestamp))
    && isValidTimestamp(opportunity?.createdAt)
  ) {
    events.push({
      id: `created-${opportunity.id}`,
      type: 'created',
      timestamp: opportunity.createdAt,
      note: 'Opportunity created',
    });
  }

  if (
    !events.some((event) => event.type === 'applied' && isValidTimestamp(event.timestamp))
    && isValidTimestamp(opportunity?.appliedAt)
  ) {
    events.push({
      id: `applied-${opportunity.id}`,
      type: 'applied',
      timestamp: opportunity.appliedAt,
      note: 'Application submitted',
    });
  }

  if (
    !events.some((event) => event.type === 'referral_requested' && isValidTimestamp(event.timestamp))
    && isValidTimestamp(opportunity?.referralRequestedAt)
  ) {
    events.push({
      id: `referral-${opportunity.id}`,
      type: 'referral_requested',
      timestamp: opportunity.referralRequestedAt,
      note: opportunity.referralContact
        ? `Referral requested from ${opportunity.referralContact}`
        : 'Referral requested',
    });
  }

  return events.sort((left, right) => {
    const leftTime = isValidTimestamp(left.timestamp) ? new Date(left.timestamp).getTime() : 0;
    const rightTime = isValidTimestamp(right.timestamp) ? new Date(right.timestamp).getTime() : 0;
    return rightTime - leftTime;
  });
};

export default function ActivityTimeline({ opportunity, addTimelineNote }) {
  const [note, setNote] = useState('');
  const [noteAt, setNoteAt] = useState(() => toLocalDateTimeInput());
  const [error, setError] = useState('');
  const timeline = useMemo(() => buildTimeline(opportunity), [opportunity]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedNote = note.trim();
    const timestamp = new Date(noteAt).getTime();

    if (!trimmedNote) {
      setError('Enter a timeline note before saving.');
      return;
    }
    if (!Number.isFinite(timestamp)) {
      setError('Choose a valid date and time.');
      return;
    }

    try {
      addTimelineNote(opportunity.id, trimmedNote, timestamp);
      setNote('');
      setNoteAt(toLocalDateTimeInput());
      setError('');
    } catch (err) {
      setError(err.message || 'Could not add the timeline note.');
    }
  };

  return (
    <Card className="mb-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Activity Timeline</h2>
          <p className="text-sm text-gray-500">Stage changes, application activity, referrals, and notes.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-6">
        <label htmlFor="timeline-note" className="block text-sm font-medium text-gray-700 mb-1">
          Add a note
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <input
            id="timeline-note"
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Emailed recruiter with a follow-up"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <input
            aria-label="Timeline note date and time"
            type="datetime-local"
            value={noteAt}
            onChange={(event) => setNoteAt(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={!note.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Note
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
      </form>

      {timeline.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">No activity recorded yet.</p>
      ) : (
        <ol className="space-y-0">
          {timeline.map((event, index) => {
            const { Icon, iconClass } = getEventStyle(event.type);
            return (
              <li key={`${String(event.id)}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
                {index < timeline.length - 1 && (
                  <span className="absolute left-4 top-8 h-[calc(100%-1rem)] w-px bg-gray-200" aria-hidden="true" />
                )}
                <span className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <div className="text-sm text-gray-800">{describeEvent(event)}</div>
                  <time className="mt-1 block text-xs text-gray-400" dateTime={isValidTimestamp(event.timestamp) ? new Date(event.timestamp).toISOString() : undefined}>
                    {formatDateTimeSafe(event.timestamp)}
                  </time>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
