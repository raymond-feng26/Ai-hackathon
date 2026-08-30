import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useApp } from '../context/AppContext';
import {
  filterOpportunities,
  getOpportunitySummary,
  QUICK_VIEWS,
  sortOpportunities
} from '../utils/opportunityData.js';
import {
  exportOpportunitiesCsv,
  importOpportunitiesCsv
} from '../utils/opportunityCsv.js';
import {
  parseFullBackup,
  serializeFullBackup
} from '../utils/backup.js';
import {
  ApplicationDataMenu,
  DEFAULT_OPPORTUNITY_FILTERS,
  OpportunityFilters,
  OpportunitySummary,
  OpportunityTable,
  QuickAddForm
} from './applications';

export default function ApplicationTracker() {
  const {
    applications,
    resumes,
    addApplication,
    updateApplication,
    archiveApplication,
    restoreApplication,
    importApplications,
    restoreAllData,
    isLoaded,
    storageError,
    storageWarnings,
    clearStorageMessages
  } = useApp();
  const [filters, setFilters] = useState(DEFAULT_OPPORTUNITY_FILTERS);

  const visibleOpportunities = useMemo(
    () => sortOpportunities(filterOpportunities(applications, filters)),
    [applications, filters]
  );

  const summary = useMemo(
    () => getOpportunitySummary(applications),
    [applications]
  );

  const viewCounts = useMemo(() => Object.keys(QUICK_VIEWS).reduce((counts, view) => ({
    ...counts,
    [view]: filterOpportunities(applications, { view }).length
  }), {}), [applications]);

  const handleQuickAdd = (data) => {
    addApplication(data);
    if (filters.view === 'archived') {
      setFilters({ ...DEFAULT_OPPORTUNITY_FILTERS, view: 'all' });
    }
    return true;
  };

  const handleArchive = (id) => {
    const opportunity = applications.find(item => item.id === id);
    if (!opportunity) return;
    if (window.confirm(`Archive ${opportunity.company} — ${opportunity.role}? You can restore it from the Archived view.`)) {
      archiveApplication(id);
    }
  };

  const handleImportCsv = (text) => {
    const parsed = importOpportunitiesCsv(text, applications);
    const imported = importApplications(parsed.opportunities);

    if (parsed.opportunities.length === 0 && parsed.errors.length > 0) {
      throw new Error(parsed.errors.map(error => error.message).join(' '));
    }

    return {
      imported: imported.imported,
      skipped: parsed.rowsSkipped + imported.skipped,
      warnings: parsed.warnings,
      errors: parsed.errors
    };
  };

  const handleRestore = (text) => {
    const parsed = parseFullBackup(text);
    if (!parsed.ok) throw new Error(parsed.errors.join(' '));

    const restored = restoreAllData(parsed);
    return {
      message: `Restored ${restored.opportunities} opportunities and ${restored.resumes} resumes${
        parsed.warnings.length ? ` with ${parsed.warnings.length} warning${parsed.warnings.length === 1 ? '' : 's'}` : ''
      }.`
    };
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link to="/" className="mb-2 inline-block text-sm font-medium text-gray-500 hover:text-primary">
              ← Home
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Opportunity Tracker
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600 sm:text-base">
              A focused workspace for finding, qualifying, applying to, and following up on 2027 internships.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ApplicationDataMenu
              disabled={!isLoaded}
              onExportCsv={() => exportOpportunitiesCsv(applications)}
              onImportCsv={handleImportCsv}
              onBackup={() => serializeFullBackup({ opportunities: applications, resumes })}
              onRestore={handleRestore}
            />
            <Link
              to="/applications/new"
              className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <PlusIcon className="mr-1.5 h-4 w-4" />
              Full entry
            </Link>
          </div>
        </header>

        {(storageError || storageWarnings.length > 0) && (
          <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            storageError
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-yellow-200 bg-yellow-50 text-yellow-800'
          }`} role={storageError ? 'alert' : 'status'}>
            <div className="flex items-start justify-between gap-4">
              <p>{storageError || storageWarnings.join(' ')}</p>
              <button type="button" onClick={clearStorageMessages} className="font-medium underline">Dismiss</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <OpportunitySummary opportunities={applications} summary={summary} />
          <QuickAddForm onAdd={handleQuickAdd} disabled={!isLoaded} />
          <OpportunityFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(DEFAULT_OPPORTUNITY_FILTERS)}
            viewCounts={viewCounts}
          />
          <OpportunityTable
            opportunities={visibleOpportunities}
            onUpdate={updateApplication}
            onArchive={handleArchive}
            onRestore={restoreApplication}
            disabled={!isLoaded}
          />
        </div>
      </div>
    </main>
  );
}
