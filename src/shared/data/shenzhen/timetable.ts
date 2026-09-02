import raw from './timetable.generated.json';

export const DEPARTURE_PROFILES = [
  { id: 'weekday-am-peak', label: '工作日 08:00（早高峰）', time: '08:00', kind: 'weekday' },
  { id: 'weekday-off-peak', label: '工作日 12:00（平峰）', time: '12:00', kind: 'weekday' },
  { id: 'weekday-pm-peak', label: '工作日 18:00（晚高峰）', time: '18:00', kind: 'weekday' },
  { id: 'weekend-day', label: '周末 10:00', time: '10:00', kind: 'weekend' },
] as const;

export type DepartureProfileId = (typeof DEPARTURE_PROFILES)[number]['id'];

interface TimetableLine {
  lineId: string;
  peakIntervalMin: number;
  offPeakIntervalMin: number;
  peakHours: [string, string][];
}

interface TimetableDataset {
  status: 'verified' | 'awaiting-authorized-export';
  source: string;
  lines: TimetableLine[];
}

const dataset = raw as TimetableDataset;
export const DEFAULT_DEPARTURE_PROFILE: DepartureProfileId = 'weekday-am-peak';

export function getDepartureProfile(id: DepartureProfileId) {
  return DEPARTURE_PROFILES.find(profile => profile.id === id) ?? DEPARTURE_PROFILES[0];
}

function isPeak(line: TimetableLine, time: string): boolean {
  return line.peakHours.some(([start, end]) => time >= start && time < end);
}

/**
 * Returns the average expected wait (half a headway) only when a verified timetable is
 * bundled. Until an authorised export is available, all profiles visibly use the same
 * declared 4-minute Demo fallback rather than inventing a timetable.
 */
export function getWaitMinutes(lineIds: string[], profileId: DepartureProfileId): {
  minutes: number;
  source: 'verified-timetable' | 'demo-fallback';
} {
  if (dataset.status !== 'verified') return { minutes: 4, source: 'demo-fallback' };
  const profile = getDepartureProfile(profileId);
  const intervals = lineIds
    .map(lineId => dataset.lines.find(line => line.lineId === lineId))
    .filter((line): line is TimetableLine => Boolean(line))
    .map(line => isPeak(line, profile.time) ? line.peakIntervalMin : line.offPeakIntervalMin);
  if (intervals.length === 0) return { minutes: 4, source: 'demo-fallback' };
  return { minutes: intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length / 2, source: 'verified-timetable' };
}

export const TIMETABLE_STATUS = {
  available: dataset.status === 'verified' && dataset.lines.length > 0,
  source: dataset.source,
  lineCount: dataset.lines.length,
} as const;
