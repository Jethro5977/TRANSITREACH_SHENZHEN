import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const endpoint = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';
const query = `[out:json][timeout:90];
relation["type"="route"]["route"="subway"]["network"="深圳地铁"](22.43,113.74,22.82,114.42)->.routes;
.routes out body;
node(r.routes:"stop");
out body qt;`;
const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'TransitReach-Shenzhen/0.2 data snapshot builder' } });
if (!response.ok) throw new Error(`Overpass ${response.status}: ${await response.text()}`);
const data = await response.json();
const elements = new Map(data.elements.map(element => [`${element.type}/${element.id}`, element]));
const wanted = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '14']);
const stations = new Map();

for (const relation of data.elements.filter(element => element.type === 'relation')) {
  const ref = relation.tags?.ref?.trim();
  if (!wanted.has(ref)) continue;
  const line = ref === '2' || ref === '8' ? '2-8' : ref;
  for (const member of relation.members ?? []) {
    if (!member.role?.startsWith('stop')) continue;
    const node = elements.get(`${member.type}/${member.ref}`);
    const name = node?.tags?.name?.trim();
    if (!name || typeof node.lat !== 'number' || typeof node.lon !== 'number') continue;
    const key = name.replace(/站$/, '');
    const current = stations.get(key) ?? { name: key, lat: node.lat, lon: node.lon, lines: new Set(), osmIds: new Set() };
    current.lines.add(line);
    current.osmIds.add(node.id);
    stations.set(key, current);
  }
}

const snapshot = [...stations.values()]
  .map(station => ({ name: station.name, lat: station.lat, lon: station.lon, lines: [...station.lines].sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true })), osmIds: [...station.osmIds] }))
  .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
if (snapshot.length < 100) throw new Error(`Only ${snapshot.length} stations parsed; refusing to overwrite the snapshot.`);

const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/shared/data/shenzhen/stations.generated.json');
await writeFile(output, `${JSON.stringify({ generatedAt: new Date().toISOString(), source: endpoint, licence: 'ODbL', stations: snapshot }, null, 2)}\n`);
console.log(`Wrote ${snapshot.length} stations to ${output}`);
