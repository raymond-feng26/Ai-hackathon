import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  APPLICATION_CHANNELS,
  APPLICATION_CHANNEL_CONFIG,
  APPLIED_STAGES,
  DISCOVERY_SOURCES,
  DISCOVERY_SOURCE_CONFIG,
  ELIGIBILITIES,
  ELIGIBILITY_CONFIG,
  ELIGIBILITY_REASONS,
  ELIGIBILITY_REASON_CONFIG,
  PRIORITIES,
  PRIORITY_CONFIG,
  REFERRAL_STATUSES,
  REFERRAL_STATUS_CONFIG,
  STAGES,
  STAGE_CONFIG,
  TRACKS,
  TRACK_CONFIG
} from '../../domain/opportunity';
import { getResumeDisplayName } from '../../domain/resume';

const inputClassName = (
  'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 '
  + 'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100'
);

const pad = value => String(value).padStart(2, '0');

const parseDate = value => {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateTimeLocal = value => {
  const date = parseDate(value);
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toDateOnly = value => {
  const date = parseDate(value);
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const fromDateTimeLocal = value => {
  if (!value) return null;
  const [datePart, timePart = '00:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const date = new Date(year, month - 1, day, hour || 0, minute || 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const fromDeadlineDate = value => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const currentDateTimeLocal = () => toDateTimeLocal(Date.now());

const buildFormValues = values => ({
  company: values?.company ?? '',
  role: values?.role ?? '',
  jobUrl: values?.jobUrl ?? '',
  requisitionId: values?.requisitionId ?? '',
  location: values?.location ?? '',

  track: values?.track ?? 'unclassified',
  priority: values?.priority ?? 'p1',
  eligibility: values?.eligibility ?? 'needs_research',
  eligibilityReason: values?.eligibilityReason ?? 'none',
  eligibilityNotes: values?.eligibilityNotes ?? '',
  stage: values?.stage ?? 'saved',

  discoverySource: values?.discoverySource ?? 'other',
  applicationChannel: values?.applicationChannel ?? 'not_applied',
  referralStatus: values?.referralStatus ?? 'none',
  referralContact: values?.referralContact ?? '',
  referralRequestedAt: toDateTimeLocal(values?.referralRequestedAt),

  postedAt: toDateTimeLocal(values?.postedAt),
  discoveredAt: toDateTimeLocal(values?.discoveredAt ?? Date.now()),
  deadlineAt: toDateOnly(values?.deadlineAt),
  appliedAt: toDateTimeLocal(values?.appliedAt),
  lastActivityAt: toDateTimeLocal(values?.lastActivityAt ?? Date.now()),
  nextAction: values?.nextAction ?? '',
  nextActionAt: toDateTimeLocal(values?.nextActionAt),

  resumeId: values?.resumeId ?? '',
  resumeNameSnapshot: values?.resumeNameSnapshot ?? '',
  jobDescription: values?.jobDescription ?? '',
  notes: values?.notes ?? ''
});

function FormSection({ title, description, children }) {
  return (
    <fieldset className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <legend className="px-1 text-lg font-semibold text-gray-900">{title}</legend>
      {description && <p className="mb-4 text-sm text-gray-500">{description}</p>}
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, required = false, hint, className = '', children }) {
  return (
    <label className={`block text-sm font-medium text-gray-700 ${className}`}>
      {label}{required && <span className="ml-1 text-red-600">*</span>}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-gray-400">{hint}</span>}
    </label>
  );
}

function SelectField({ label, name, value, values, config, onChange, className = '' }) {
  return (
    <Field label={label} className={className}>
      <select name={name} value={value} onChange={onChange} className={inputClassName}>
        {values.map(option => (
          <option key={option} value={option}>{config[option]?.label ?? option}</option>
        ))}
      </select>
    </Field>
  );
}

export default function OpportunityForm({
  initialValues,
  resumes = [],
  onSubmit,
  onCancel,
  onChange,
  submitLabel = 'Save Opportunity',
  isSubmitting = false,
  error = ''
}) {
  const [form, setForm] = useState(() => buildFormValues(initialValues));
  const [initialLastActivityAt] = useState(() => toDateTimeLocal(initialValues?.lastActivityAt));
  const [validationError, setValidationError] = useState('');
  const [hasAppliedHistory] = useState(() => (
    Boolean(initialValues?.appliedAt)
    || initialValues?.events?.some(event => event?.type === 'applied')
  ));

  const availableResumes = useMemo(() => {
    const selectedId = form.resumeId;
    return resumes.filter(resume => !resume.archivedAt || resume.id === selectedId);
  }, [form.resumeId, resumes]);

  const selectedResumeExists = availableResumes.some(resume => resume.id === form.resumeId);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(previous => {
      const next = { ...previous, [name]: value };
      if (name === 'stage' && APPLIED_STAGES.includes(value) && !previous.appliedAt) {
        next.appliedAt = currentDateTimeLocal();
      }
      if (name === 'stage' && !APPLIED_STAGES.includes(value) && !hasAppliedHistory) {
        next.appliedAt = '';
      }
      if (name === 'referralStatus' && value === 'requested' && !previous.referralRequestedAt) {
        next.referralRequestedAt = currentDateTimeLocal();
      }
      return next;
    });
    setValidationError('');
    onChange?.();
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const company = form.company.trim();
    const role = form.role.trim();
    if (!company || !role) {
      setValidationError('Company and role are required.');
      return;
    }

    const appliedAtEnabled = APPLIED_STAGES.includes(form.stage) || hasAppliedHistory;
    const appliedAt = appliedAtEnabled && form.appliedAt
      ? fromDateTimeLocal(form.appliedAt)
      : (APPLIED_STAGES.includes(form.stage) ? Date.now() : null);

    await onSubmit?.({
      company,
      role,
      jobUrl: form.jobUrl.trim(),
      requisitionId: form.requisitionId.trim(),
      location: form.location.trim(),

      track: form.track,
      priority: form.priority,
      eligibility: form.eligibility,
      eligibilityReason: form.eligibilityReason,
      eligibilityNotes: form.eligibilityNotes.trim(),
      stage: form.stage,

      discoverySource: form.discoverySource,
      applicationChannel: form.applicationChannel,
      referralStatus: form.referralStatus,
      referralContact: form.referralContact.trim(),
      referralRequestedAt: fromDateTimeLocal(form.referralRequestedAt),

      postedAt: fromDateTimeLocal(form.postedAt),
      discoveredAt: fromDateTimeLocal(form.discoveredAt) ?? Date.now(),
      deadlineAt: fromDeadlineDate(form.deadlineAt),
      appliedAt,
      lastActivityAt: form.lastActivityAt === initialLastActivityAt
        ? undefined
        : fromDateTimeLocal(form.lastActivityAt),
      nextAction: form.nextAction.trim(),
      nextActionAt: fromDateTimeLocal(form.nextActionAt),

      resumeId: form.resumeId || null,
      resumeNameSnapshot: form.resumeNameSnapshot.trim(),
      jobDescription: form.jobDescription.trim(),
      notes: form.notes.trim()
    });
  };

  const displayedError = validationError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormSection title="1. Basic Information" description="Identify the role and keep the original posting easy to find.">
        <Field label="Company" required>
          <input name="company" value={form.company} onChange={handleChange} className={inputClassName} autoComplete="organization" required />
        </Field>
        <Field label="Role" required>
          <input name="role" value={form.role} onChange={handleChange} className={inputClassName} autoComplete="organization-title" required />
        </Field>
        <Field label="Job URL" hint="Use the canonical company posting when possible." className="md:col-span-2">
          <input type="url" name="jobUrl" value={form.jobUrl} onChange={handleChange} className={inputClassName} placeholder="https://…" />
        </Field>
        <Field label="Requisition ID">
          <input name="requisitionId" value={form.requisitionId} onChange={handleChange} className={inputClassName} />
        </Field>
        <Field label="Location">
          <input name="location" value={form.location} onChange={handleChange} className={inputClassName} />
        </Field>
      </FormSection>

      <FormSection title="2. Fit & Eligibility" description="Track fit separately from F-1 and export-control eligibility.">
        <SelectField label="Track" name="track" value={form.track} values={TRACKS} config={TRACK_CONFIG} onChange={handleChange} />
        <SelectField label="Priority" name="priority" value={form.priority} values={PRIORITIES} config={PRIORITY_CONFIG} onChange={handleChange} />
        <SelectField label="Eligibility" name="eligibility" value={form.eligibility} values={ELIGIBILITIES} config={ELIGIBILITY_CONFIG} onChange={handleChange} />
        <SelectField label="Eligibility Reason" name="eligibilityReason" value={form.eligibilityReason} values={ELIGIBILITY_REASONS} config={ELIGIBILITY_REASON_CONFIG} onChange={handleChange} />
        <SelectField label="Stage" name="stage" value={form.stage} values={STAGES} config={STAGE_CONFIG} onChange={handleChange} />
        <Field label="Eligibility Notes" className="md:col-span-2">
          <textarea name="eligibilityNotes" value={form.eligibilityNotes} onChange={handleChange} rows={3} className={inputClassName} placeholder="Sponsorship language, U.S. person requirement, class year, degree level…" />
        </Field>
      </FormSection>

      <FormSection title="3. Source & Referral" description="Referral is independent from the application stage.">
        <SelectField label="Discovery Source" name="discoverySource" value={form.discoverySource} values={DISCOVERY_SOURCES} config={DISCOVERY_SOURCE_CONFIG} onChange={handleChange} />
        <SelectField label="Application Channel" name="applicationChannel" value={form.applicationChannel} values={APPLICATION_CHANNELS} config={APPLICATION_CHANNEL_CONFIG} onChange={handleChange} />
        <SelectField label="Referral Status" name="referralStatus" value={form.referralStatus} values={REFERRAL_STATUSES} config={REFERRAL_STATUS_CONFIG} onChange={handleChange} />
        <Field label="Referral Contact">
          <input name="referralContact" value={form.referralContact} onChange={handleChange} className={inputClassName} />
        </Field>
        <Field label="Referral Requested At">
          <input type="datetime-local" name="referralRequestedAt" value={form.referralRequestedAt} onChange={handleChange} className={inputClassName} />
        </Field>
      </FormSection>

      <FormSection title="4. Dates & Next Action" description="Deadline is saved at the end of the selected local day.">
        <Field label="Posted At">
          <input type="datetime-local" name="postedAt" value={form.postedAt} onChange={handleChange} className={inputClassName} />
        </Field>
        <Field label="Discovered At">
          <input type="datetime-local" name="discoveredAt" value={form.discoveredAt} onChange={handleChange} className={inputClassName} />
        </Field>
        <Field label="Deadline">
          <input type="date" name="deadlineAt" value={form.deadlineAt} onChange={handleChange} className={inputClassName} />
        </Field>
        <Field label="Applied At" hint="May stay empty for Watching, Saved, and Ready.">
          <input
            type="datetime-local"
            name="appliedAt"
            value={form.appliedAt}
            onChange={handleChange}
            disabled={!APPLIED_STAGES.includes(form.stage) && !hasAppliedHistory}
            className={inputClassName}
          />
        </Field>
        <Field label="Last Activity At">
          <input type="datetime-local" name="lastActivityAt" value={form.lastActivityAt} onChange={handleChange} className={inputClassName} />
        </Field>
        <Field label="Next Action">
          <input name="nextAction" value={form.nextAction} onChange={handleChange} className={inputClassName} placeholder="Tailor resume, ask alumnus, complete OA…" />
        </Field>
        <Field label="Next Action At">
          <input type="datetime-local" name="nextActionAt" value={form.nextActionAt} onChange={handleChange} className={inputClassName} />
        </Field>
      </FormSection>

      <FormSection title="5. Materials" description="The selected resume name is snapshotted when you save.">
        <Field label="Linked Resume" className="md:col-span-2">
          <select name="resumeId" value={form.resumeId} onChange={handleChange} className={inputClassName}>
            <option value="">No resume linked</option>
            {availableResumes.map(resume => (
              <option key={resume.id} value={resume.id}>
                {getResumeDisplayName(resume)}{resume.archivedAt ? ' (Archived — currently linked)' : ''}
              </option>
            ))}
            {form.resumeId && !selectedResumeExists && (
              <option value={form.resumeId}>
                {form.resumeNameSnapshot || 'Historical resume'} (Unavailable — snapshot retained)
              </option>
            )}
          </select>
          <span className="mt-1 block text-xs font-normal text-gray-400">
            Need another version? <Link to="/resumes" className="text-primary hover:underline">Manage resumes</Link>.
          </span>
        </Field>
      </FormSection>

      <FormSection title="6. Job Description & Notes">
        <Field label="Job Description" className="md:col-span-2">
          <textarea name="jobDescription" value={form.jobDescription} onChange={handleChange} rows={10} className={inputClassName} placeholder="Paste the full job description for later analysis and interview practice." />
        </Field>
        <Field label="Notes" className="md:col-span-2">
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={5} className={inputClassName} placeholder="Contacts, preparation notes, recruiter updates, or anything else." />
        </Field>
      </FormSection>

      {displayedError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {displayedError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !onSubmit}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
