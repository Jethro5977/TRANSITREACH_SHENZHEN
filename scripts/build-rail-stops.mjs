/**
 * Derives the vendored rail stop set for Epic 1 from the Prasarana GTFS static feed.
 *
 * Input:  data/gtfs/rapid-rail-kl/*.txt   (downloaded separately, gitignored)
 * Output: src/shared/data/rail/stops.json
 *         src/shared/data/rail/feeds.json
 *
 * Run manually and commit the output. This is not wired into `npm run build`.
 *
 *   node scripts/build-rail-stops.mjs
 *
 * AC 1.1.1 is explicit that coordinates come from stop_lat / stop_lon only, and that
 * the feed's `geometry` column — serialised as the literal string "[object Object]" —
 * must never be parsed for position. readCoord() below enforces that.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FEED_DIR = join(ROOT, 'data', 'gtfs', 'rapid-rail-kl');
const OUT_DIR = join(ROOT, 'src', 'shared', 'data', 'rail');

const FEED_SOURCE = 'https://api.data.gov.my/gtfs-static/prasarana?category=rapid-rail-kl';

/** Two platform rows merge into one station only if they are within this distance. */
const PLATFORM_MERGE_METRES = 500;

/**
 * The eight lines Epic 1 names as the rail-stage searchable set, mapped to the
 * route_id used in routes.txt.
 */
const EPIC_LINES = [
  ['LRT Kelana Jaya', 'KJ'],
  ['LRT Ampang', 'AG'],
  ['LRT Sri Petaling', 'PH'],
  ['LRT Shah Alam (LRT3)', 'SA'],
  ['MRT Kajang', 'KGL'],
  ['MRT Putrajaya', 'PYL'],
  ['KL Monorail', 'MR'],
  ['BRT Sunway', 'BRT'],
];

/**
 * stops.txt labels the MRT Kajang line "MRT"; routes.txt labels the same line "KGL".
 * The feed is internally inconsistent here. Mapping it rather than guessing, and the
 * mismatch is recorded in feeds.json so the discrepancy stays visible.
 */
const STOP_ROUTE_ID_FIXES = { MRT: 'KGL' };

// ---------------------------------------------------------------- csv

function parseCsv(text) {
  const src = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').trim();
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  row.push(field);
  rows.push(row);

  const header = rows.shift().map(h => h.trim());
  return rows
    .filter(r => r.length === header.length && r.some(v => v !== ''))
    .map(r => Object.fromEntries(header.map((h, i) => [h, r[i].trim()])));
}

const readTable = name => parseCsv(readFileSync(join(FEED_DIR, name), 'utf8'));

// ---------------------------------------------------------------- geo

/**
 * Reads a position from stop_lat / stop_lon and nothing else.
 * Throws if handed the `geometry` column, which the feed serialises as "[object Object]".
 */
function readCoord(stop) {
  const lat = Number(stop.stop_lat);
  const lon = Number(stop.stop_lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(
      `stop ${stop.stop_id} has no usable stop_lat/stop_lon ` +
      `(got "${stop.stop_lat}" / "${stop.stop_lon}"). Never fall back to the geometry column.`
    );
  }
  return { lat, lon };
}

function metresBetween(a, b) {
  const R = 6371000;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const round6 = n => Math.round(n * 1e6) / 1e6;

// ---------------------------------------------------------------- build

function main() {
  const rawStops = readTable('stops.txt');
  const routes = readTable('routes.txt');
  const calendar = readTable('calendar.txt');
  const trips = readTable('trips.txt');

  const notes = [];
  const warnings = [];

  // -- guard: the geometry column must be present-but-unused, exactly as the epic describes.
  if (rawStops.length && 'geometry' in rawStops[0]) {
    const sample = rawStops[0].geometry;
    notes.push(
      `stops.txt carries a "geometry" column serialised as "${sample}". It is never read; ` +
      `all positions come from stop_lat / stop_lon.`
    );
  }

  // -- service calendars: which are referenced by a trip, and which have expired.
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const referencedServiceIds = new Set(trips.map(t => t.service_id));

  const serviceCalendars = calendar.map(c => ({
    serviceId: c.service_id,
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      .filter(d => c[d] === '1'),
    startDate: c.start_date,
    endDate: c.end_date,
    referencedByTrips: referencedServiceIds.has(c.service_id),
    expired: c.end_date < today,
  }));

  const expiredInUse = serviceCalendars.filter(c => c.expired && c.referencedByTrips);
  if (expiredInUse.length) {
    warnings.push(
      `Expired service periods are referenced by trips: ${expiredInUse.map(c => c.serviceId).join(', ')}. ` +
      `The DoD forbids computing from these.`
    );
  }
  const expiredUnused = serviceCalendars.filter(c => c.expired && !c.referencedByTrips);
  if (expiredUnused.length) {
    notes.push(
      `calendar.txt contains expired service periods (${expiredUnused.map(c => c.serviceId).join(', ')}), ` +
      `but no trip references them, so no computation can draw on them.`
    );
  }

  // -- route table.
  const routeById = new Map(routes.map(r => [r.route_id, r]));
  const lines = routes.map(r => ({
    routeId: r.route_id,
    shortName: r.route_short_name,
    longName: r.route_long_name,
    mode: r.category,
    color: `#${r.route_color}`,
    stopCount: 0,
  }));
  const lineByRouteId = new Map(lines.map(l => [l.routeId, l]));

  // -- platform rows -> stations.
  const platforms = [];
  for (const s of rawStops) {
    if (s.status && s.status !== 'valid') continue;

    const rawRouteId = s.route_id;
    const routeId = STOP_ROUTE_ID_FIXES[rawRouteId] ?? rawRouteId;
    if (rawRouteId !== routeId) {
      const msg = `stops.txt uses route_id "${rawRouteId}" where routes.txt uses "${routeId}"`;
      if (!notes.includes(msg)) notes.push(msg);
    }
    if (!routeById.has(routeId)) {
      warnings.push(`stop ${s.stop_id} references unknown route_id "${rawRouteId}"; stop dropped.`);
      continue;
    }

    platforms.push({
      stopId: s.stop_id,
      name: s.stop_name.replace(/\s+/g, ' ').trim(),
      ...readCoord(s),
      routeId,
    });
  }

  // Group by name, then split any group whose members are too far apart to be one station.
  const byName = new Map();
  for (const p of platforms) {
    const key = p.name.toUpperCase();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(p);
  }

  const stations = [];
  for (const [, group] of byName) {
    const clusters = [];
    for (const p of group) {
      const near = clusters.find(c => c.every(m => metresBetween(m, p) <= PLATFORM_MERGE_METRES));
      if (near) near.push(p);
      else clusters.push([p]);
    }
    if (clusters.length > 1) {
      notes.push(
        `"${group[0].name}" names ${clusters.length} locations more than ${PLATFORM_MERGE_METRES} m apart; ` +
        `kept as separate stations.`
      );
    }

    for (const cluster of clusters) {
      const members = [...cluster].sort((a, b) => a.stopId.localeCompare(b.stopId));
      const lineIds = [...new Set(members.map(m => m.routeId))].sort();
      stations.push({
        stopId: members[0].stopId,
        name: members[0].name,
        lat: round6(members.reduce((sum, m) => sum + m.lat, 0) / members.length),
        lon: round6(members.reduce((sum, m) => sum + m.lon, 0) / members.length),
        lines: lineIds,
        platforms: members.map(m => m.stopId),
      });
      for (const id of lineIds) lineByRouteId.get(id).stopCount++;
    }
  }

  stations.sort((a, b) => a.name.localeCompare(b.name));

  const multiPlatform = stations.filter(s => s.platforms.length > 1);
  if (multiPlatform.length) {
    notes.push(
      `${multiPlatform.length} stations merge multiple platform rows (one per line) into a single ` +
      `searchable entry. Position is the mean of the merged platform coordinates; members are ` +
      `listed in "platforms".`
    );
  }

  // -- study area: the feed's own extent. AC 1.1.2 leaves the bounding box undefined,
  //    so it is derived here and its basis is stated in the interface rather than invented.
  const bounds = stations.reduce(
    (b, s) => ({
      minLat: Math.min(b.minLat, s.lat), maxLat: Math.max(b.maxLat, s.lat),
      minLon: Math.min(b.minLon, s.lon), maxLon: Math.max(b.maxLon, s.lon),
    }),
    { minLat: Infinity, maxLat: -Infinity, minLon: Infinity, maxLon: -Infinity },
  );

  // -- epic line coverage.
  const epicLineCoverage = EPIC_LINES.map(([label, routeId]) => ({
    label,
    routeId,
    present: lineByRouteId.has(routeId) && lineByRouteId.get(routeId).stopCount > 0,
  }));

  const stopsDoc = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/build-rail-stops.mjs',
    feedId: 'prasarana-rapid-rail-kl',
    stationCount: stations.length,
    stations,
  };

  const feedsDoc = {
    generatedAt: new Date().toISOString(),
    feeds: [
      {
        feedId: 'prasarana-rapid-rail-kl',
        feedName: 'Prasarana Rapid Rail KL',
        agency: 'rapidrail',
        source: FEED_SOURCE,
        // Not filled in with a guess. The DoD requires the licence recorded in the
        // Project Governance Portfolio data table; record it there and mirror it here.
        licence: null,
        licenceStatus: 'not yet confirmed — record in the Project Governance Portfolio data table',
        serviceDateRange: {
          start: serviceCalendars.filter(c => c.referencedByTrips)
            .reduce((min, c) => (c.startDate < min ? c.startDate : min), '99999999'),
          end: serviceCalendars.filter(c => c.referencedByTrips)
            .reduce((max, c) => (c.endDate > max ? c.endDate : max), '00000000'),
        },
        serviceCalendars,
        lines,
      },
    ],
    epicLineCoverage,
    // AC 1.3.3 / DoD: modes not loaded are named explicitly rather than passed over.
    modesNotLoaded: [
      'Bus services are not included in this result.',
      'Feeder bus services are not included in this result.',
    ],
    studyAreaFeedExtent: {
      minLat: round6(bounds.minLat), maxLat: round6(bounds.maxLat),
      minLon: round6(bounds.minLon), maxLon: round6(bounds.maxLon),
    },
    notes,
    warnings,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, 'stops.json'), JSON.stringify(stopsDoc, null, 2) + '\n');
  writeFileSync(join(OUT_DIR, 'feeds.json'), JSON.stringify(feedsDoc, null, 2) + '\n');

  // ------------------------------------------------------------ report
  console.log(`\nplatform rows read : ${platforms.length}`);
  console.log(`stations emitted   : ${stations.length}  (${multiPlatform.length} multi-line)`);
  console.log(`\nlines present in the feed:`);
  for (const { label, routeId, present } of epicLineCoverage) {
    const line = lineByRouteId.get(routeId);
    console.log(
      `  ${present ? 'yes' : 'NO '}  ${label.padEnd(22)} ${routeId.padEnd(4)} ` +
      `${present ? `${line.stopCount} stations` : '— not in this feed'}`
    );
  }
  const missing = epicLineCoverage.filter(l => !l.present);
  console.log(
    missing.length
      ? `\n${missing.length} of the 8 named lines are absent and are recorded as missing in feeds.json.`
      : `\nAll 8 lines named in Epic 1 are present.`
  );
  console.log(`\nfeed extent: lat ${round6(bounds.minLat)}..${round6(bounds.maxLat)}  lon ${round6(bounds.minLon)}..${round6(bounds.maxLon)}`);
  if (notes.length) {
    console.log(`\nnotes:`);
    for (const n of notes) console.log(`  - ${n}`);
  }
  if (warnings.length) {
    console.log(`\nWARNINGS:`);
    for (const w of warnings) console.log(`  ! ${w}`);
  }
  console.log(`\nwrote ${join('src', 'shared', 'data', 'rail')}/stops.json + feeds.json\n`);
}

main();
