import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatDate,
  formatDateTime,
  isValidDateValue,
  parseDateValue,
  toDateInputValue,
  toDateTimeInputValue,
  toIsoString
} from './dateFormatters.js';

test('empty and invalid values render safely', () => {
  for (const value of [null, undefined, '', 'not-a-date', '2026-02-30']) {
    assert.equal(formatDate(value), '');
    assert.equal(formatDateTime(value), '');
    assert.equal(toDateInputValue(value), '');
    assert.equal(toDateTimeInputValue(value), '');
    assert.equal(toIsoString(value), '');
    assert.equal(isValidDateValue(value), false);
  }
  assert.equal(formatDate(null, { fallback: 'Unknown' }), 'Unknown');
  assert.equal(parseDateValue('bad', null), null);
});

test('date-only input is preserved in local date controls', () => {
  assert.equal(toDateInputValue('2026-08-29'), '2026-08-29');
  assert.equal(isValidDateValue('2026-08-29'), true);
});

test('timestamps and ISO strings convert without Invalid Date output', () => {
  const timestamp = Date.UTC(2026, 7, 29, 12, 34, 0);
  assert.equal(parseDateValue(timestamp), timestamp);
  assert.equal(toIsoString(timestamp), '2026-08-29T12:34:00.000Z');
  assert.notEqual(formatDate(timestamp), '');
  assert.notEqual(formatDateTime(timestamp), '');
  assert.equal(toIsoString(0), '1970-01-01T00:00:00.000Z');
});
