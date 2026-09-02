import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buffer, cleanCoords, lineString, polygon, simplify } from '@turf/turf';

const endpoint = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';
const bounds = '22.43,113.74,22.82,114.42';
const query = `[out:json][timeout:120];
(
  way["natural"="water"](${bounds});
  way["waterway"~"^(river|canal)$"](${bounds});
  way["highway"~"^(motorway|motorway_link)$"](${bounds});
);
out geom;`;

const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
  headers: { 'User-Agent': 'TransitReach-Shenzhen/0.3 barrier snapshot builder' },
});
if (!response.ok) throw new Error(`Overpass ${response.status}: ${await response.text()}`);
const data = await response.json();

function isClosed(coords) {
  if (coords.length < 4) return false;
  const first = coords[0];
  const last = coords.at(-1);
  return first[0] === last[0] && first[1] === last[1];
}

function roundedRing(ring) {
  const result = [];
  for (const [lon, lat] of ring) {
    const point = [Number(lon.toFixed(5)), Number(lat.toFixed(5))];
    const previous = result.at(-1);
    if (!previous || previous[0] !== point[0] || previous[1] !== point[1]) result.push(point);
  }
  if (result.length < 3) return null;
  const first = result[0];
  const last = result.at(-1);
  if (first[0] !== last[0] || first[1] !== last[1]) result.push([...first]);
  return result.length >= 4 ? result : null;
}

function collectPolygons(feature, tolerance) {
  const geometry = cleanCoords(simplify(feature, { tolerance, highQuality: false })).geometry;
  const sourcePolygons = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [];
  return sourcePolygons
    .map(rings => rings.map(roundedRing).filter(Boolean))
    .filter(rings => rings.length > 0 && rings[0].length >= 4);
}

const sourceFeatures = [];
for (const element of data.elements ?? []) {
  if (!Array.isArray(element.geometry) || element.geometry.length < 2) continue;
  const coords = element.geometry.map(point => [point.lon, point.lat]);
  const tags = element.tags ?? {};
  const kind = tags.highway ? 'motorway' : tags.natural === 'water' ? 'water' : 'waterway';
  try {
    sourceFeatures.push({
      kind,
      feature: kind === 'water' && isClosed(coords)
        ? polygon([coords])
        : buffer(lineString(coords), kind === 'motorway' ? 0.018 : 0.025, { units: 'kilometers', steps: 2 }),
    });
  } catch {
    // A malformed OSM way is ignored; the source query remains reproducible and logged.
  }
}

function buildBarriers(tolerance) {
  return sourceFeatures.flatMap(({ kind, feature }) =>
    collectPolygons(feature, tolerance).map(rings => ({ kind, rings })),
  );
}

function groupBarriers(barriers) {
  return barriers.reduce((groups, barrier) => {
    (groups[barrier.kind] ??= []).push(barrier.rings);
    return groups;
  }, {});
}

let outputData;
let serialized;
let bytes;
for (const tolerance of [0.00006, 0.00012, 0.00024, 0.00048, 0.001, 0.002]) {
  const barriers = buildBarriers(tolerance);
  if (barriers.length === 0) continue;
  outputData = {
    generatedAt: new Date().toISOString(),
    source: endpoint,
    licence: 'ODbL',
    query,
    simplificationToleranceDegrees: tolerance,
    notes: 'OSM water, rivers/canals and motorway buffers. A routing heuristic clips these barriers; this is not a full pedestrian graph.',
    barriers: groupBarriers(barriers),
  };
  serialized = `${JSON.stringify(outputData)}\n`;
  bytes = Buffer.byteLength(serialized);
  const kindCounts = barriers.reduce((counts, barrier) => {
    counts[barrier.kind] = (counts[barrier.kind] ?? 0) + 1;
    return counts;
  }, {});
  console.log(`candidate ${tolerance}: ${barriers.length} barriers, ${(bytes / 1024).toFixed(1)} KB`, kindCounts);
  if (bytes <= 1_000_000) break;
}
if (!outputData || !serialized || !bytes || bytes > 1_000_000) {
  throw new Error('Barrier snapshot remains above the 1 MB limit after simplification.');
}

const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/shared/data/shenzhen/barriers.generated.json');
await writeFile(output, serialized);
console.log(`Wrote ${Object.values(outputData.barriers).flat().length} OSM barriers (${(bytes / 1024).toFixed(1)} KB) to ${output}`);
