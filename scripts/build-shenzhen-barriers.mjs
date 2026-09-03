import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buffer, cleanCoords, lineString, polygon, simplify } from '@turf/turf';

const endpoint = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';
const bounds = '22.43,113.74,22.82,114.42';
const MAX_SNAPSHOT_BYTES = 1_500_000;
const bufferKmByKind = {
  water: 0,
  waterway: 0.025,
  motorway: 0.018,
  trunk: 0.012,
  railway: 0.015,
  cliff: 0.008,
  military: 0,
};

const query = `[out:json][timeout:180];
(
  way["natural"="water"](${bounds});
  way["waterway"~"^(river|canal)$"](${bounds});
  way["highway"~"^(motorway|motorway_link)$"](${bounds});
  way["highway"~"^(trunk|trunk_link)$"](${bounds});
  way["railway"~"^(rail|light_rail|subway)$"]["service"!="spur"]["service"!="yard"]["tunnel"!="yes"](${bounds});
  way["natural"~"^(cliff|ridge)$"](${bounds});
  relation["natural"="water"](${bounds});
  way["landuse"="military"](${bounds});
  relation["landuse"="military"](${bounds});
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

function samePoint(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

/** Join outer member ways returned by `out geom` for a simple multipolygon relation. */
function joinRelationOuterRings(element) {
  const members = (element.members ?? [])
    .filter(member => (member.role === 'outer' || member.role === '') && Array.isArray(member.geometry))
    .map(member => member.geometry.map(point => [point.lon, point.lat]))
    .filter(coords => coords.length >= 2);
  const rings = [];
  while (members.length > 0) {
    let ring = members.pop();
    let extended = true;
    while (extended && !isClosed(ring)) {
      extended = false;
      for (let index = members.length - 1; index >= 0; index -= 1) {
        const candidate = members[index];
        const first = ring[0];
        const last = ring.at(-1);
        const candidateFirst = candidate[0];
        const candidateLast = candidate.at(-1);
        if (samePoint(last, candidateFirst)) {
          ring = [...ring, ...candidate.slice(1)];
        } else if (samePoint(last, candidateLast)) {
          ring = [...ring, ...candidate.slice(0, -1).reverse()];
        } else if (samePoint(first, candidateLast)) {
          ring = [...candidate.slice(0, -1), ...ring];
        } else if (samePoint(first, candidateFirst)) {
          ring = [...candidate.slice(1).reverse(), ...ring];
        } else {
          continue;
        }
        members.splice(index, 1);
        extended = true;
        break;
      }
    }
    if (isClosed(ring)) rings.push(ring);
  }
  return rings;
}

function barrierKind(tags) {
  if (tags.landuse === 'military') return 'military';
  if (/^(rail|light_rail|subway)$/.test(tags.railway ?? '')) return 'railway';
  if (/^(motorway|motorway_link)$/.test(tags.highway ?? '')) return 'motorway';
  if (/^(trunk|trunk_link)$/.test(tags.highway ?? '')) return 'trunk';
  if (/^(cliff|ridge)$/.test(tags.natural ?? '')) return 'cliff';
  if (tags.natural === 'water') return 'water';
  return 'waterway';
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
  const tags = element.tags ?? {};
  const kind = barrierKind(tags);
  const coordinateSets = element.type === 'relation'
    ? joinRelationOuterRings(element)
    : Array.isArray(element.geometry)
      ? [element.geometry.map(point => [point.lon, point.lat])]
      : [];
  for (const coords of coordinateSets) {
    if (coords.length < 2) continue;
    try {
      const isArea = (kind === 'water' || kind === 'military') && isClosed(coords);
      // Open natural-water ways are rare; handle them as a narrow waterway rather
      // than asking Turf to produce a zero-width line polygon.
      const lineBufferKm = bufferKmByKind[kind] || (kind === 'water' ? bufferKmByKind.waterway : 0.015);
      sourceFeatures.push({
        kind,
        feature: isArea
          ? polygon([coords])
          : buffer(lineString(coords), lineBufferKm, { units: 'kilometers', steps: 2 }),
      });
    } catch {
      // A malformed OSM geometry is ignored; the source query remains reproducible and logged.
    }
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
for (const tolerance of [0.00006, 0.00012, 0.00024, 0.00048, 0.001, 0.002, 0.003, 0.004]) {
  const barriers = buildBarriers(tolerance);
  if (barriers.length === 0) continue;
  outputData = {
    generatedAt: new Date().toISOString(),
    source: endpoint,
    licence: 'ODbL',
    query,
    simplificationToleranceDegrees: tolerance,
    notes: 'OSM water, rivers/canals, motorway/trunk, rail, cliff/ridge and military barriers. A routing heuristic clips these barriers; this is not a full pedestrian graph.',
    barriers: groupBarriers(barriers),
  };
  serialized = `${JSON.stringify(outputData)}\n`;
  bytes = Buffer.byteLength(serialized);
  const kindCounts = barriers.reduce((counts, barrier) => {
    counts[barrier.kind] = (counts[barrier.kind] ?? 0) + 1;
    return counts;
  }, {});
  console.log(`candidate ${tolerance}: ${barriers.length} barriers, ${(bytes / 1024).toFixed(1)} KB`, kindCounts);
  if (bytes <= MAX_SNAPSHOT_BYTES) break;
}
if (!outputData || !serialized || !bytes || bytes > MAX_SNAPSHOT_BYTES) {
  throw new Error('Barrier snapshot remains above the 1.5 MB limit after simplification.');
}

const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/shared/data/shenzhen/barriers.generated.json');
await writeFile(output, serialized);
console.log(`Wrote ${Object.values(outputData.barriers).flat().length} OSM barriers (${(bytes / 1024).toFixed(1)} KB) to ${output}`);
