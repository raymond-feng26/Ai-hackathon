import { Link } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon,
  ArchiveBoxArrowDownIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import {
  STAGES,
  STAGE_CONFIG,
  TRACKS,
  TRACK_CONFIG,
  PRIORITIES,
  PRIORITY_CONFIG,
  ELIGIBILITIES,
  ELIGIBILITY_CONFIG,
  DISCOVERY_SOURCE_CONFIG,
  REFERRAL_STATUS_CONFIG
} from '../../domain/opportunity';
import { toSafeHttpUrl } from '../../utils/opportunityData';
import {
  formatOpportunityDate,
  getConfigLabel,
  getDateUrgency,
  getOptionValue,
  selectClassName
} from './opportunityUi';

function InlineSelect({ label, value, options, config, onChange, disabled }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value || getOptionValue(options[0])}
        onChange={event => onChange(event.target.value)}
        disabled={disabled}
        className={selectClassName}
        aria-label={label}
      >
        {options.map(option => {
          const optionValue = getOptionValue(option);
          return (
            <option key={optionValue} value={optionValue}>
              {getConfigLabel(config, optionValue)}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function DateDisplay({ value, showUrgency = true, warningDays = 3 }) {
  const formatted = formatOpportunityDate(value);
  if (!formatted) return <span className="text-gray-400">—</span>;

  const urgency = showUrgency ? getDateUrgency(value, warningDays) : null;
  return (
    <div className={urgency?.className ?? 'text-gray-600'}>
      <div>{formatted}</div>
      {urgency?.label && <div className="text-[11px]">{urgency.label}</div>}
    </div>
  );
}

function CompanyRole({ opportunity }) {
  const safeJobUrl = toSafeHttpUrl(opportunity.jobUrl);
  return (
    <div className="min-w-44">
      <div className="flex items-start gap-1.5">
        <Link
          to={`/applications/${opportunity.id}`}
          className="font-semibold text-gray-900 hover:text-primary hover:underline"
        >
          {opportunity.company || 'Untitled company'}
        </Link>
        {safeJobUrl && (
          <a
            href={safeJobUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 shrink-0 text-gray-400 hover:text-primary"
            aria-label={`Open ${opportunity.company || 'job'} posting in a new tab`}
            title="Open job posting"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
          </a>
        )}
      </div>
      <Link
        to={`/applications/${opportunity.id}`}
        className="mt-0.5 block text-sm text-gray-600 hover:text-primary hover:underline"
      >
        {opportunity.role || 'Untitled role'}
      </Link>
      {(opportunity.location || opportunity.requisitionId) && (
        <div className="mt-1 text-[11px] text-gray-400">
          {[opportunity.location, opportunity.requisitionId && `Req ${opportunity.requisitionId}`]
            .filter(Boolean)
            .join(' · ')}
        </div>
      )}
    </div>
  );
}

function SourceReferral({ opportunity }) {
  const source = opportunity.discoverySource
    ? getConfigLabel(DISCOVERY_SOURCE_CONFIG, opportunity.discoverySource)
    : 'Unknown source';
  const referral = opportunity.referralStatus && opportunity.referralStatus !== 'none'
    ? getConfigLabel(REFERRAL_STATUS_CONFIG, opportunity.referralStatus)
    : 'No referral';
  return (
    <div>
      <div className="text-gray-700">{source}</div>
      <div className="mt-0.5 text-[11px] text-gray-400">{referral}</div>
    </div>
  );
}

function ResumeName({ opportunity }) {
  return (
    <span className="line-clamp-2 text-gray-600">
      {opportunity.resumeNameSnapshot
        || opportunity.resumeDisplayNameSnapshot
        || opportunity.resumeSnapshot
        || '—'}
    </span>
  );
}

function RowActions({ opportunity, onArchive, onRestore, disabled }) {
  const archived = Boolean(opportunity.archivedAt);
  const handler = archived ? onRestore : onArchive;
  const label = archived ? 'Restore' : 'Archive';
  const Icon = archived ? ArrowUturnLeftIcon : ArchiveBoxArrowDownIcon;

  return (
    <button
      type="button"
      onClick={() => handler?.(opportunity.id)}
      disabled={disabled || !handler}
      className="inline-flex items-center rounded-md px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
      title={`${label} ${opportunity.company || 'opportunity'}`}
    >
      <Icon className="mr-1 h-4 w-4" />
      {label}
    </button>
  );
}

function EditFields({ opportunity, onUpdate, disabled, layout = 'desktop' }) {
  const update = (field, value) => onUpdate?.(opportunity.id, { [field]: value });
  const fields = [
    ['Track', 'track', TRACKS, TRACK_CONFIG],
    ['Eligibility', 'eligibility', ELIGIBILITIES, ELIGIBILITY_CONFIG],
    ['Priority', 'priority', PRIORITIES, PRIORITY_CONFIG],
    ['Stage', 'stage', STAGES, STAGE_CONFIG]
  ];

  if (layout === 'mobile') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {fields.map(([label, field, options, config]) => (
          <div key={field}>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
            <InlineSelect
              label={`${label} for ${opportunity.company}`}
              value={opportunity[field]}
              options={options}
              config={config}
              onChange={value => update(field, value)}
              disabled={disabled || !onUpdate}
            />
          </div>
        ))}
      </div>
    );
  }

  return fields.map(([label, field, options, config]) => (
    <td key={field} className="px-2 py-3 align-top">
      <InlineSelect
        label={`${label} for ${opportunity.company}`}
        value={opportunity[field]}
        options={options}
        config={config}
        onChange={value => update(field, value)}
        disabled={disabled || !onUpdate}
      />
    </td>
  ));
}

export default function OpportunityTable({
  opportunities = [],
  onUpdate,
  onArchive,
  onRestore,
  disabled = false
}) {
  if (opportunities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
        <p className="font-medium text-gray-700">No opportunities match this view.</p>
        <p className="mt-1 text-sm text-gray-500">Try clearing filters or use Quick Add to capture a role.</p>
      </div>
    );
  }

  return (
    <section aria-label="Opportunities">
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[1180px] border-collapse text-left text-xs">
          <thead className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Company / Role</th>
              <th className="px-2 py-2.5 font-semibold">Track</th>
              <th className="px-2 py-2.5 font-semibold">Eligibility</th>
              <th className="px-2 py-2.5 font-semibold">Priority</th>
              <th className="px-2 py-2.5 font-semibold">Stage</th>
              <th className="px-2 py-2.5 font-semibold">Deadline</th>
              <th className="px-2 py-2.5 font-semibold">Next Action</th>
              <th className="px-2 py-2.5 font-semibold">Source / Referral</th>
              <th className="px-2 py-2.5 font-semibold">Resume</th>
              <th className="px-2 py-2.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {opportunities.map(opportunity => (
              <tr key={opportunity.id} className="hover:bg-blue-50/30">
                <td className="px-3 py-3 align-top"><CompanyRole opportunity={opportunity} /></td>
                <EditFields opportunity={opportunity} onUpdate={onUpdate} disabled={disabled} />
                <td className="whitespace-nowrap px-2 py-3 align-top"><DateDisplay value={opportunity.deadlineAt} /></td>
                <td className="max-w-48 px-2 py-3 align-top">
                  <div className="font-medium text-gray-700">{opportunity.nextAction || '—'}</div>
                  {opportunity.nextActionAt && <DateDisplay value={opportunity.nextActionAt} warningDays={0} />}
                </td>
                <td className="px-2 py-3 align-top"><SourceReferral opportunity={opportunity} /></td>
                <td className="max-w-32 px-2 py-3 align-top"><ResumeName opportunity={opportunity} /></td>
                <td className="px-2 py-3 align-top">
                  <RowActions opportunity={opportunity} onArchive={onArchive} onRestore={onRestore} disabled={disabled} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {opportunities.map(opportunity => (
          <article key={opportunity.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <CompanyRole opportunity={opportunity} />
            <div className="mt-4">
              <EditFields opportunity={opportunity} onUpdate={onUpdate} disabled={disabled} layout="mobile" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-xs">
              <div>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">Deadline</p>
                <DateDisplay value={opportunity.deadlineAt} />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">Next action</p>
                <p className="font-medium text-gray-700">{opportunity.nextAction || '—'}</p>
                {opportunity.nextActionAt && <DateDisplay value={opportunity.nextActionAt} warningDays={0} />}
              </div>
              <div>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">Source / referral</p>
                <SourceReferral opportunity={opportunity} />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">Resume</p>
                <ResumeName opportunity={opportunity} />
              </div>
            </div>

            <div className="mt-3 flex justify-end border-t border-gray-100 pt-2">
              <RowActions opportunity={opportunity} onArchive={onArchive} onRestore={onRestore} disabled={disabled} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
