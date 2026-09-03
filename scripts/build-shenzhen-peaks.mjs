import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const endpoint = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';
const bounds = '22.43,113.74,22.82,114.42';
const query = `[out:json][timeout:30];
node["natural"="peak"](${bounds});
out body;`;

const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
  headers: { 'User-Agent': 'TransitReach-Shenzhen/0.4 peak snapshot builder' },
});
if (!response.ok) throw new Error(`Overpass ${response.status}: ${await response.text()}`);
const data = await response.json();

function elevationFromTag(value) {
  if (typeof value !== 'string') return undefined;
  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const elevationM = Number(match[0]);
  return Number.isFinite(elevationM) && elevationM >= 0 ? Number(elevationM.toFixed(1)) : undefined;
}

const peaks = (data.elements ?? [])
  .map(element => {
    const tags = element.tags ?? {};
    const name = tags['name:zh'] ?? tags.name;
    if (typeof name !== 'string' || !Number.isFinite(element.lat) || !Number.isFinite(element.lon)) return null;
    const elevationM = elevationFromTag(tags.ele);
    return {
      osmId: element.id,
      name,
      lat: Number(element.lat.toFixed(6)),
      lon: Number(element.lon.toFixed(6)),
      ...(elevationM === undefined ? {} : { elevationM }),
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

if (peaks.length === 0) throw new Error('No named OSM natural=peak nodes were returned for Shenzhen.');

const output = `/** Generated from OpenStreetMap via scripts/build-shenzhen-peaks.mjs. Do not edit by hand. */\nexport interface ShenzhenPeak {\n  osmId: number;\n  name: string;\n  lat: number;\n  lon: number;\n  /** OSM ele tag when supplied; undefined means the source did not provide elevation. */\n  elevationM?: number;\n}\n\nexport const SHENZHEN_PEAKS: readonly ShenzhenPeak[] = ${JSON.stringify(peaks, null, 2)};\n`;
const outputPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/shared/data/shenzhen/peaks.generated.ts');
await writeFile(outputPath, output);
console.log(`Wrote ${peaks.length} named OSM peaks to ${outputPath}`);
