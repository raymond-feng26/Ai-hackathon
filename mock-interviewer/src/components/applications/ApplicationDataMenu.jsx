import { createElement, useEffect, useRef, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CircleStackIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

const localDateStamp = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const downloadText = (text, fileName, mimeType, addBom = false) => {
  const content = addBom && !text.startsWith('\uFEFF') ? `\uFEFF${text}` : text;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

const resultMessage = (result, fallback) => {
  if (typeof result === 'string' && result.trim()) return result;
  if (!result || typeof result !== 'object') return fallback;
  if (result.message) return result.message;

  const parts = [];
  const imported = result.imported ?? result.rowsImported;
  const skipped = result.skipped ?? result.rowsSkipped;
  if (Number.isFinite(imported)) parts.push(`${imported} imported`);
  if (Number.isFinite(result.restored)) parts.push(`${result.restored} restored`);
  if (Number.isFinite(skipped)) parts.push(`${skipped} skipped`);
  if (Array.isArray(result.warnings) && result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}`);
  } else if (Number.isFinite(result.warnings) && result.warnings > 0) {
    parts.push(`${result.warnings} warning${result.warnings === 1 ? '' : 's'}`);
  }
  if (Array.isArray(result.errors) && result.errors.length > 0) {
    parts.push(`${result.errors.length} error${result.errors.length === 1 ? '' : 's'}`);
  }
  return parts.length > 0 ? parts.join(', ') : fallback;
};

const resultTone = result => {
  if (!result || typeof result !== 'object') return 'success';
  const errorCount = Array.isArray(result.errors) ? result.errors.length : 0;
  const warningCount = Array.isArray(result.warnings)
    ? result.warnings.length
    : (Number.isFinite(result.warnings) ? result.warnings : 0);
  const imported = result.imported ?? result.rowsImported ?? result.restored ?? 0;
  if (errorCount > 0 && imported === 0) return 'error';
  if (errorCount > 0 || warningCount > 0) return 'info';
  return 'success';
};

function MenuButton({ icon, children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {createElement(icon, { className: 'mr-2.5 h-4 w-4 text-gray-400' })}
      {children}
    </button>
  );
}

/**
 * The callbacks own parsing, validation, and persistence. Export/backup callbacks
 * return serialized text; import/restore callbacks receive file text and may
 * return { imported/restored, skipped, warnings, message } for the status line.
 */
export default function ApplicationDataMenu({
  onExportCsv,
  onImportCsv,
  onBackup,
  onRestore,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const containerRef = useRef(null);
  const csvInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = event => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = event => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const runTask = async task => {
    setIsBusy(true);
    setStatus(null);
    try {
      await task();
    } catch (error) {
      setStatus({
        type: 'error',
        text: error instanceof Error ? error.message : 'The data operation failed.'
      });
    } finally {
      setIsBusy(false);
      setIsOpen(false);
    }
  };

  const handleExport = () => runTask(async () => {
    const csv = await onExportCsv?.();
    if (typeof csv !== 'string') throw new Error('CSV export did not return valid text.');
    const fileName = `opportunities-${localDateStamp()}.csv`;
    downloadText(csv, fileName, 'text/csv;charset=utf-8', true);
    setStatus({ type: 'success', text: `Downloaded ${fileName}.` });
  });

  const handleBackup = () => runTask(async () => {
    const json = await onBackup?.();
    if (typeof json !== 'string') throw new Error('Backup did not return valid JSON text.');
    const fileName = `job-tracker-backup-${localDateStamp()}.json`;
    downloadText(json, fileName, 'application/json;charset=utf-8');
    setStatus({ type: 'success', text: `Downloaded ${fileName}.` });
  });

  const handleCsvFile = event => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    runTask(async () => {
      const text = await file.text();
      const result = await onImportCsv?.(text, file);
      setStatus({ type: resultTone(result), text: resultMessage(result, 'CSV import complete.') });
    });
  };

  const handleRestoreFile = event => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const confirmed = window.confirm(
      'Restore this backup? Current opportunities and resumes will be replaced. This cannot be undone.'
    );
    if (!confirmed) {
      setStatus({ type: 'info', text: 'Restore cancelled. No data was changed.' });
      return;
    }

    runTask(async () => {
      const text = await file.text();
      const result = await onRestore?.(text, file);
      setStatus({ type: resultTone(result), text: resultMessage(result, 'Backup restored.') });
    });
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        disabled={disabled || isBusy}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="inline-flex min-h-10 items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CircleStackIcon className="mr-1.5 h-4 w-4" />
        Data
        <EllipsisVerticalIcon className="ml-1 h-4 w-4" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          <MenuButton icon={ArrowDownTrayIcon} onClick={handleExport} disabled={!onExportCsv || isBusy}>
            Export active CSV
          </MenuButton>
          <MenuButton icon={ArrowUpTrayIcon} onClick={() => csvInputRef.current?.click()} disabled={!onImportCsv || isBusy}>
            Import CSV
          </MenuButton>
          <div className="my-1 border-t border-gray-100" />
          <MenuButton icon={ArrowDownTrayIcon} onClick={handleBackup} disabled={!onBackup || isBusy}>
            Download full backup
          </MenuButton>
          <MenuButton icon={ArrowPathIcon} onClick={() => jsonInputRef.current?.click()} disabled={!onRestore || isBusy}>
            Restore full backup
          </MenuButton>
        </div>
      )}

      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleCsvFile}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleRestoreFile}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      {status && (
        <p
          className={`absolute right-0 top-full z-20 mt-2 w-72 rounded-md border bg-white px-3 py-2 text-xs shadow-sm ${
            status.type === 'error'
              ? 'border-red-200 text-red-700'
              : status.type === 'success'
                ? 'border-green-200 text-green-700'
                : 'border-gray-200 text-gray-600'
          }`}
          role={status.type === 'error' ? 'alert' : 'status'}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
