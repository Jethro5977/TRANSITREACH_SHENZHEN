import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const appKey = process.env.SHENZHEN_OPENDATA_APP_KEY;
const endpoint = process.env.SHENZHEN_OPENDATA_TIMETABLE_API_URL;
if (!appKey || !endpoint) {
  throw new Error(
    'Set SHENZHEN_OPENDATA_APP_KEY and SHENZHEN_OPENDATA_TIMETABLE_API_URL from an authorised Shenzhen Open Data application before running this importer.',
  );
}

const url = new URL(endpoint);
url.searchParams.set('appKey', appKey);
const response = await fetch(url, { headers: { Accept: 'application/json' } });
if (!response.ok) throw new Error(`Timetable API ${response.status}: ${await response.text()}`);
const payload = await response.json();

// The platform's field names may change. Keep the raw authorised download private and
// normalise it here only after confirming the current response schema.
const records = payload?.data?.list ?? payload?.data?.rows ?? payload?.rows;
if (!Array.isArray(records) || records.length === 0) {
  throw new Error('No timetable records found. Inspect the authorised API response and update the field mapping before publishing a generated file.');
}

const fieldMapRaw = process.env.SHENZHEN_OPENDATA_TIMETABLE_FIELD_MAP;
if (!fieldMapRaw) {
  throw new Error('Set SHENZHEN_OPENDATA_TIMETABLE_FIELD_MAP to a verified JSON field map before normalising authorised records.');
}
const fieldMap = JSON.parse(fieldMapRaw);
const field = (record, name) => record[fieldMap[name]];
const parsePeakHours = value => String(value ?? '')
  .split(/[;；]/)
  .map(range => range.trim().split(/[-—–~至]/).map(part => part.trim()))
  .filter(parts => parts.length === 2 && /^\d{1,2}:\d{2}$/.test(parts[0]) && /^\d{1,2}:\d{2}$/.test(parts[1]));

const lines = [...new Map(records.map(record => {
  const lineId = String(field(record, 'lineId') ?? '').trim();
  const peakIntervalMin = Number(field(record, 'peakIntervalMin'));
  const offPeakIntervalMin = Number(field(record, 'offPeakIntervalMin'));
  if (!lineId || !Number.isFinite(peakIntervalMin) || !Number.isFinite(offPeakIntervalMin)) {
    throw new Error('A required lineId or headway field is missing or invalid; do not publish an inferred timetable.');
  }
  return [lineId, {
    lineId,
    peakIntervalMin,
    offPeakIntervalMin,
    peakHours: parsePeakHours(field(record, 'peakHours')),
  }];
})).values()];

await writeFile(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/shared/data/shenzhen/timetable.generated.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), source: endpoint, status: 'verified', lines }, null, 2)}\n`,
);
console.log(`Wrote ${lines.length} verified timetable lines.`);
