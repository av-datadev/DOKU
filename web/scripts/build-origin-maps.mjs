// One-off generator for the item page's Origin chapter: downloads each city's
// street network from OpenStreetMap (Overpass API) and writes a gold-line SVG
// to public/origins/<sku>.svg. Run by hand when a place is added or moved:
//
//   node scripts/build-origin-maps.mjs            # every sku in origins.json
//   node scripts/build-origin-maps.mjs 007 014    # just these
//
// Visitors never call OpenStreetMap — the SVGs ship as static assets.
// Map data © OpenStreetMap contributors (ODbL); the page shows the credit.

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';

const W = 600;
const H = 800;
const ROOT = new URL('../', import.meta.url);
const places = JSON.parse(await readFile(new URL('src/lib/origins.json', ROOT), 'utf8'));
// Public Overpass instances; rotate on failure (the main one 502s under load).
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// Road class → drawing layer, faintest first so major roads sit on top.
const LAYERS = [
  { name: 'alley', match: /^(footway|path|steps)$/, stroke: 0.3, opacity: 0.22 },
  { name: 'minor', match: /^(residential|unclassified|living_street|pedestrian|service)$/, stroke: 0.55, opacity: 0.45 },
  { name: 'tertiary', match: /^tertiary(_link)?$/, stroke: 1.1, opacity: 0.62 },
  { name: 'secondary', match: /^secondary(_link)?$/, stroke: 1.6, opacity: 0.8 },
  { name: 'major', match: /^(motorway|trunk|primary)(_link)?$/, stroke: 2.2, opacity: 0.95 },
];

function frame(p) {
  const halfW = p.km;
  const halfH = (p.km * H) / W;
  const kmPerLon = 111.32 * Math.cos((p.lat * Math.PI) / 180);
  const pad = 1.06;
  return {
    s: p.lat - (halfH * pad) / 110.57,
    n: p.lat + (halfH * pad) / 110.57,
    w: p.lon - (halfW * pad) / kmPerLon,
    e: p.lon + (halfW * pad) / kmPerLon,
    project: ({ lat, lon }) => [
      W / 2 + ((lon - p.lon) * kmPerLon * W) / (2 * halfW),
      H / 2 - ((lat - p.lat) * 110.57 * W) / (2 * halfW),
    ],
  };
}

// Ramer–Douglas–Peucker, in pixels.
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0];
  const [bx, by] = pts[pts.length - 1];
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  let max = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
    if (d > max) { max = d; idx = i; }
  }
  if (max <= tol) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)];
}

const r = (n) => Math.round(n * 10) / 10;
const outside = ([x, y]) => x < -40 || x > W + 40 || y < -40 || y > H + 40;

function pathData(ways, project, close = false) {
  let d = '';
  for (const way of ways) {
    const pts = simplify(way.geometry.map(project), 0.45);
    if (pts.length < 2 || pts.every(outside)) continue;
    d += 'M' + pts.map(([x, y]) => `${r(x)} ${r(y)}`).join('L') + (close ? 'Z' : '');
  }
  return d;
}

async function overpass(query) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const url = OVERPASS[(attempt - 1) % OVERPASS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'DOKU-origin-maps/1.0 (discoverdoku.com)' },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(150_000),
      });
      if (res.ok) return res.json();
      console.warn(`  ${new URL(url).host} ${res.status}, retry ${attempt}`);
    } catch (err) {
      console.warn(`  ${new URL(url).host} ${err.name}, retry ${attempt}`);
    }
    await new Promise((r) => setTimeout(r, 4000 * attempt));
  }
  throw new Error('overpass failed');
}

async function build(sku, p) {
  const f = frame(p);
  const bbox = `${f.s},${f.w},${f.n},${f.e}`;
  const json = await overpass(`[out:json][timeout:120];(
    way["highway"](${bbox});
    way["natural"="water"](${bbox});
    way["waterway"~"^(river|canal|riverbank)$"](${bbox});
    way["railway"="rail"](${bbox});
  );out geom;`);
  const ways = json.elements.filter((e) => e.type === 'way' && e.geometry?.length);

  const water = ways.filter((w) => w.tags.natural === 'water' || w.tags.waterway === 'riverbank');
  const rivers = ways.filter((w) => /^(river|canal)$/.test(w.tags.waterway ?? ''));
  const rail = ways.filter((w) => w.tags.railway === 'rail');
  const roads = ways.filter((w) => w.tags.highway);

  const parts = [];
  const waterD = pathData(water, f.project, true);
  if (waterD) parts.push(`<path d="${waterD}" fill="#14110e" stroke="#2B2620" stroke-width=".5"/>`);
  const riverD = pathData(rivers, f.project);
  if (riverD) parts.push(`<path d="${riverD}" stroke="#1d1915" stroke-width="7" opacity=".9"/>`);
  const railD = pathData(rail, f.project);
  if (railD) parts.push(`<path d="${railD}" stroke="#6B6258" stroke-width=".7" stroke-dasharray="3 2" opacity=".6"/>`);
  for (const layer of LAYERS) {
    if (layer.name === 'alley' && !p.alleys) continue;
    const d = pathData(roads.filter((w) => layer.match.test(w.tags.highway)), f.project);
    if (d) parts.push(`<path d="${d}" stroke="#B08D57" stroke-width="${layer.stroke}" opacity="${layer.opacity}"/>`);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none" stroke-linecap="round" stroke-linejoin="round"><!-- ${p.city} · Map data © OpenStreetMap contributors (ODbL) -->${parts.join('')}</svg>\n`;
  await writeFile(new URL(`public/origins/${sku}.svg`, ROOT), svg);
  console.log(`${sku} ${p.city}: ${roads.length} roads, ${(svg.length / 1024).toFixed(0)} KB`);
}

await mkdir(new URL('public/origins/', ROOT), { recursive: true });
const only = process.argv.slice(2);
for (const [sku, p] of Object.entries(places)) {
  if (only.length && !only.includes(sku)) continue;
  try {
    await build(sku, p);
  } catch {
    console.warn(`${sku} ${p.city}: skipped — servers busy, run again later`);
  }
  await new Promise((r) => setTimeout(r, 3000)); // be polite to the public Overpass server
}

// Which skus have a map — the item page only shows the Origin chapter for these.
const rendered = (await readdir(new URL('public/origins/', ROOT))).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)).sort();
await writeFile(new URL('src/lib/origin-maps.json', ROOT), JSON.stringify(rendered) + '\n');
