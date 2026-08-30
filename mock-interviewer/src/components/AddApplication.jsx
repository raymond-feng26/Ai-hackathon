import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { findOpportunityDuplicates } from '../utils/opportunityData';
import BackButton from './ui/BackButton';
import OpportunityForm from './applications/OpportunityForm';

const duplicateReasonLabel = reason => {
  if (reason === 'job_url') return 'same canonical job URL';
  if (reason === 'company_requisition_id') return 'same company and requisition ID';
  return reason;
};

export default function AddApplication() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [newRecordNow] = useState(() => Date.now());
  const [duplicateCheck, setDuplicateCheck] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    getApplication,
    addApplication,
    updateApplication,
    addSessionToApplication,
    applications,
    resumes,
    isLoaded
  } = useApp();

  const application = isEditing ? getApplication(id) : null;
  const prefill = useMemo(() => (
    location.state && typeof location.state === 'object' ? location.state : {}
  ), [location.state]);

  const initialValues = useMemo(() => {
    if (application) return application;
    return {
      ...prefill,
      stage: prefill.stage || 'saved',
      jobDescription: prefill.jobDescription || '',
      resumeId: prefill.resumeId || null,
      discoveredAt: prefill.discoveredAt ?? newRecordNow,
      lastActivityAt: prefill.lastActivityAt ?? newRecordNow
    };
  }, [application, newRecordNow, prefill]);

  const persistOpportunity = async values => {
    setIsSubmitting(true);
    setError('');
    try {
      let applicationId = id;
      if (isEditing) {
        updateApplication(id, values);
      } else {
        const analysis = prefill.analysis
          ? {
              ...prefill.analysis,
              analyzedAt: prefill.analysis.analyzedAt ?? Date.now()
            }
          : null;
        applicationId = addApplication({ ...values, analysis });
      }

      if (prefill.pendingSession) {
        addSessionToApplication(applicationId, prefill.pendingSession);
      }

      setDuplicateCheck(null);
      navigate(`/applications/${applicationId}`, { replace: isEditing });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this opportunity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async values => {
    setError('');
    const matches = findOpportunityDuplicates(values, applications, { excludeId: id });
    if (matches.length > 0) {
      setDuplicateCheck({ values, matches });
      return;
    }
    await persistOpportunity(values);
  };

  const handleFormChange = () => {
    setDuplicateCheck(null);
    setError('');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-5xl rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading opportunity…
        </div>
      </div>
    );
  }

  if (isEditing && !application) {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <BackButton to="/applications" label="Back to Applications" />
          <div className="mt-6 rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">Opportunity not found</h1>
            <p className="mt-2 text-gray-600">It may have been removed or the link may be invalid.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <BackButton
          to={isEditing ? `/applications/${id}` : undefined}
          label={isEditing ? 'Back to Opportunity' : 'Back'}
        />

        <div className="mb-7 mt-4">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {isEditing ? 'Edit Opportunity' : 'New Opportunity'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEditing
              ? 'Update fit, eligibility, dates, materials, and your next action.'
              : 'Add what you know now. Unknown details can stay empty.'}
          </p>
        </div>

        {duplicateCheck && (
          <section className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4" aria-labelledby="duplicate-warning-title">
            <h2 id="duplicate-warning-title" className="font-semibold text-amber-900">
              Possible duplicate found
            </h2>
            <p className="mt-1 text-sm text-amber-800">
              Review these existing opportunities before saving another copy:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-amber-900">
              {duplicateCheck.matches.map(match => (
                <li key={match.opportunity.id} className="rounded-md bg-white/70 px-3 py-2">
                  <span className="font-medium">{match.opportunity.company} — {match.opportunity.role}</span>
                  <span className="ml-2 text-xs text-amber-700">
                    ({match.reasons.map(duplicateReasonLabel).join(', ')})
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setDuplicateCheck(null)}
                disabled={isSubmitting}
                className="rounded-md border border-amber-400 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
              >
                Review details
              </button>
              <button
                type="button"
                onClick={() => persistOpportunity(duplicateCheck.values)}
                disabled={isSubmitting}
                className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving…' : 'Save anyway'}
              </button>
            </div>
          </section>
        )}

        <OpportunityForm
          key={id || 'new'}
          initialValues={initialValues}
          resumes={resumes}
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
          onChange={handleFormChange}
          submitLabel={isEditing ? 'Save Changes' : 'Create Opportunity'}
          isSubmitting={isSubmitting}
          error={error}
        />
      </div>
    </div>
  );
}
