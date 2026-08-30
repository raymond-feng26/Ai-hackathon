import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  MapPinIcon,
  PencilSquareIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import {
  APPLICATION_CHANNEL_CONFIG,
  DISCOVERY_SOURCE_CONFIG,
  ELIGIBILITY_CONFIG,
  ELIGIBILITY_REASON_CONFIG,
  PRIORITY_CONFIG,
  REFERRAL_STATUS_CONFIG,
  STAGE_CONFIG,
  TRACK_CONFIG,
} from '../domain/opportunity';
import { toSafeHttpUrl } from '../utils/opportunityData';
import ActivityTimeline from './applications/ActivityTimeline';
import SecondaryApplicationTools from './applications/SecondaryApplicationTools';
import BackButton from './ui/BackButton';
import Card from './ui/Card';

const isValidTimestamp = (value) => {
  if (value === null || value === undefined || value === '') return false;
  return Number.isFinite(new Date(value).getTime());
};

const formatDateSafe = (value) => {
  if (!isValidTimestamp(value)) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateTimeSafe = (value) => {
  if (!isValidTimestamp(value)) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getDueTone = (value, endOfDay = false) => {
  if (!isValidTimestamp(value)) return '';
  const dueDate = new Date(value);
  if (endOfDay) dueDate.setHours(23, 59, 59, 999);
  const dueAt = dueDate.getTime();
  const now = Date.now();
  if (dueAt < now) return 'text-red-600';
  if (dueAt - now <= 3 * 24 * 60 * 60 * 1000) return 'text-amber-600';
  return '';
};

const getResumeDisplayName = (resume) => (
  resume?.displayName || resume?.name || resume?.fileName || ''
);

function DetailItem({ label, children, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-800">{children || '—'}</dd>
    </div>
  );
}

function InfoCard({ title, icon, children }) {
  const IconComponent = icon;
  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center gap-2">
        <IconComponent className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <dl className="space-y-4">{children}</dl>
    </Card>
  );
}

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    addTimelineNote,
    deleteSessionFromApplication,
    getApplication,
    getResume,
    isLoaded,
    updateApplication,
  } = useApp();

  const application = getApplication(id);

  useEffect(() => {
    if (isLoaded && !application) navigate('/applications', { replace: true });
  }, [application, isLoaded, navigate]);

  if (!application) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-500">Loading opportunity...</p>
        </div>
      </div>
    );
  }

  const linkedResume = application.resumeId ? getResume(application.resumeId) : null;
  const resumeSnapshot = application.resumeNameSnapshot || getResumeDisplayName(linkedResume);
  const currentResumeName = getResumeDisplayName(linkedResume);
  const jobUrl = toSafeHttpUrl(application.jobUrl);
  const stage = STAGE_CONFIG[application.stage] || { label: application.stage || 'Unknown', color: 'bg-gray-100 text-gray-700' };
  const priority = PRIORITY_CONFIG[application.priority] || { label: application.priority || '—', color: 'bg-gray-100 text-gray-700' };
  const track = TRACK_CONFIG[application.track] || { label: application.track || 'Unclassified' };
  const eligibility = ELIGIBILITY_CONFIG[application.eligibility] || { label: application.eligibility || 'Unknown', color: 'bg-gray-100 text-gray-700' };
  const eligibilityReason = ELIGIBILITY_REASON_CONFIG[application.eligibilityReason]?.label || 'None';
  const referralStatus = REFERRAL_STATUS_CONFIG[application.referralStatus]?.label || 'None';
  const discoverySource = DISCOVERY_SOURCE_CONFIG[application.discoverySource]?.label || 'Other';
  const applicationChannel = APPLICATION_CHANNEL_CONFIG[application.applicationChannel]?.label || 'Not Applied';

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <BackButton to="/applications" label="Back to Applications" />

        {application.archivedAt && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This opportunity is archived. It remains available for historical reference.
          </div>
        )}

        <header className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <BriefcaseIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="break-words text-3xl font-bold text-gray-900">{application.company || 'Unnamed company'}</h1>
                <p className="mt-1 break-words text-lg text-gray-600">{application.role || 'Unnamed role'}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${stage.color}`}>{stage.label}</span>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${priority.color}`}>{priority.label}</span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">{track.label}</span>
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${eligibility.color}`}>{eligibility.label}</span>
                </div>
              </div>
            </div>

            <Link
              to={`/applications/${application.id}/edit`}
              className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-primary px-4 py-2 font-medium text-primary transition-colors hover:bg-blue-50"
            >
              <PencilSquareIcon className="h-5 w-5" />
              Edit
            </Link>
          </div>

          {(application.eligibilityReason !== 'none' || application.eligibilityNotes) && (
            <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <span className="font-semibold">Eligibility:</span>{' '}
              {eligibilityReason}
              {application.eligibilityNotes ? ` — ${application.eligibilityNotes}` : ''}
            </div>
          )}
        </header>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard title="Job Information" icon={MapPinIcon}>
            <DetailItem label="Job URL">
              {jobUrl ? (
                <a
                  href={jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  Open job posting <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </a>
              ) : application.jobUrl ? (
                <span className="break-all text-gray-500" title={application.jobUrl}>Invalid or unsupported URL</span>
              ) : '—'}
            </DetailItem>
            <DetailItem label="Requisition ID">{application.requisitionId || '—'}</DetailItem>
            <DetailItem label="Location">{application.location || '—'}</DetailItem>
          </InfoCard>

          <InfoCard title="Dates & Next Action" icon={CalendarDaysIcon}>
            <DetailItem label="Deadline" className={getDueTone(application.deadlineAt, true)}>
              {formatDateSafe(application.deadlineAt)}
            </DetailItem>
            <DetailItem label="Applied Date">{formatDateSafe(application.appliedAt)}</DetailItem>
            <DetailItem label="Next Action" className={getDueTone(application.nextActionAt)}>
              <span className="block">{application.nextAction || '—'}</span>
              {isValidTimestamp(application.nextActionAt) && (
                <span className="mt-0.5 block text-xs font-normal">{formatDateTimeSafe(application.nextActionAt)}</span>
              )}
            </DetailItem>
          </InfoCard>

          <InfoCard title="Source & Referral" icon={UserGroupIcon}>
            <DetailItem label="Referral Status">{referralStatus}</DetailItem>
            <DetailItem label="Referral Contact">{application.referralContact || '—'}</DetailItem>
            <DetailItem label="Referral Requested">{formatDateSafe(application.referralRequestedAt)}</DetailItem>
            <DetailItem label="Discovery / Channel">{discoverySource} / {applicationChannel}</DetailItem>
          </InfoCard>

          <InfoCard title="Submitted Resume" icon={DocumentTextIcon}>
            <DetailItem label="Resume Snapshot">{resumeSnapshot || 'No resume recorded'}</DetailItem>
            {linkedResume && (
              <>
                <DetailItem label="Library Status">{linkedResume.archivedAt ? 'Archived' : 'Active'}</DetailItem>
                <DetailItem label="Original File">{linkedResume.fileName || '—'}</DetailItem>
                {currentResumeName && resumeSnapshot && currentResumeName !== resumeSnapshot && (
                  <DetailItem label="Current Library Name">{currentResumeName}</DetailItem>
                )}
              </>
            )}
            {!linkedResume && application.resumeId && (
              <DetailItem label="Library Status">Resume no longer available</DetailItem>
            )}
          </InfoCard>
        </div>

        <ActivityTimeline opportunity={application} addTimelineNote={addTimelineNote} />

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Job Description</h2>
            {application.jobDescription ? (
              <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{application.jobDescription}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No job description saved.</p>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Notes</h2>
            {application.notes ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{application.notes}</p>
            ) : (
              <p className="text-sm text-gray-500">No notes saved.</p>
            )}
          </Card>
        </div>

        <SecondaryApplicationTools
          application={application}
          getResume={getResume}
          updateApplication={updateApplication}
          deleteSessionFromApplication={deleteSessionFromApplication}
        />
      </div>
    </div>
  );
}
