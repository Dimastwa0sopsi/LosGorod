import { generateLayout, astar, nearestNode, nearestRoadPoint } from '../src/game/worldgen';
const L = generateLayout();
const from = nearestNode(L, 1220, 480);
let ok = 0;
for (const d of L.truckDests) { const r = nearestRoadPoint(L, d.x, d.z); const e = L.edges[r.e]; const p = astar(L, from, e.a); if (p) ok++; else console.log('NO ROUTE', d.name); }
console.log('truck destinations', L.truckDests.length, 'reachable', ok, '| lots', L.lots.length, 'spaces', L.lots.reduce((a, l) => a + l.spaces.length, 0), '| parked cars', L.parked.length, '| garages', L.garages.length, '| parkades', L.parkades.length);
const blocked = L.parked.filter((p) => L.colliders.some((c) => c.y1 > 0.6 && c.y0 < 1.5 && p.x > c.x0 - 0.9 && p.x < c.x1 + 0.9 && p.z > c.z0 - 0.9 && p.z < c.z1 + 0.9));
console.log('parked cars overlapping solids:', blocked.length);
