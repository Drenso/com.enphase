export type DailyMeterResult = { kWh: number } | 'hold';

/**
 * The cloud `/today` total does not roll over at local midnight: it keeps serving the previous day's window
 * until production resumes. So the day boundary comes from the window's own `start_time`.
 */
export function resolveDailyMeter(
  startTime: number | undefined,
  productionWh: number | undefined,
  nowMs: number,
): DailyMeterResult {
  if (typeof startTime === 'number' && nowMs / 1000 >= startTime + 86400) {
    return { kWh: 0 };
  }

  if (typeof productionWh === 'number') {
    return { kWh: productionWh / 1000 };
  }

  return 'hold';
}
