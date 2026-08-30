import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

const EMPTY_FORM = { company: '', role: '', jobUrl: '' };

export default function QuickAddForm({ onAdd, disabled = false }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
    setMessage(null);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (typeof onAdd !== 'function') {
      setMessage({ type: 'error', text: 'Quick Add is not available right now.' });
      return;
    }
    const company = form.company.trim();
    const role = form.role.trim();

    if (!company || !role) {
      setMessage({ type: 'error', text: 'Company and role are required.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      const result = await onAdd({
        company,
        role,
        jobUrl: form.jobUrl.trim(),
        stage: 'saved'
      });

      if (result === false) return;
      setForm(EMPTY_FORM);
      setMessage({ type: 'success', text: `${company} was added to Saved.` });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not add this opportunity.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm" aria-labelledby="quick-add-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 id="quick-add-title" className="font-semibold text-gray-900">Quick Add</h2>
          <p className="text-xs text-gray-500">Capture a role now and fill in the details later.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-[1fr_1fr_1.25fr_auto] md:items-end">
        <label className="block text-xs font-medium text-gray-600">
          Company <span className="text-red-600">*</span>
          <input
            name="company"
            value={form.company}
            onChange={handleChange}
            disabled={disabled || isSubmitting}
            autoComplete="organization"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. NVIDIA"
          />
        </label>

        <label className="block text-xs font-medium text-gray-600">
          Role <span className="text-red-600">*</span>
          <input
            name="role"
            value={form.role}
            onChange={handleChange}
            disabled={disabled || isSubmitting}
            autoComplete="organization-title"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. Software Engineer Intern"
          />
        </label>

        <label className="block text-xs font-medium text-gray-600">
          Job URL <span className="font-normal text-gray-400">(optional)</span>
          <input
            type="url"
            name="jobUrl"
            value={form.jobUrl}
            onChange={handleChange}
            disabled={disabled || isSubmitting}
            inputMode="url"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="https://…"
          />
        </label>

        <button
          type="submit"
          disabled={disabled || isSubmitting || !onAdd}
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="mr-1.5 h-4 w-4" />
          {isSubmitting ? 'Adding…' : 'Add'}
        </button>
      </form>

      {message && (
        <p
          className={`mt-3 text-sm ${message.type === 'error' ? 'text-red-700' : 'text-green-700'}`}
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
