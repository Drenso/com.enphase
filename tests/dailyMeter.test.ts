import { test } from 'node:test';
import assert from 'node:assert/strict';

import { resolveDailyMeter } from '../lib/dailyMeter.js';

const DAY = 86400;
const start = 1784757600; // /today window start (site-local midnight), epoch seconds

test('window a full day old still serving a number -> resets to 0 (does not write the stale total)', () => {
  assert.deepEqual(resolveDailyMeter(start, 15000, (start + DAY + 60) * 1000), { kWh: 0 });
});

test('exactly 24h after the window start -> resets to 0', () => {
  assert.deepEqual(resolveDailyMeter(start, 15000, (start + DAY) * 1000), { kWh: 0 });
});

test('one second before 24h -> writes the current total (no early reset)', () => {
  assert.deepEqual(resolveDailyMeter(start, 15000, (start + DAY - 1) * 1000), { kWh: 15 });
});
