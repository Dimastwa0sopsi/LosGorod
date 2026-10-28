import { generateLayout, astar, nearestNode } from '../src/game/worldgen';
import { N } from '../src/game/config';
const t0 = Date.now();
const L = generateLayout();
console.log('gen ms', Date.now() - t0, 'nodes', L.nodes.length, 'edges', L.edges.length, 'buildings', L.buildings.length, 'props', L.props.length, 'colliders', L.colliders.length);
const center = nearestNode(L, 540, 540);
for (const v of L.villages) {
  const p = astar(L, center, nearestNode(L, v.ex, v.ez));
  console.log(v.name, p ? 'OK len ' + p.length : 'NO ROUTE');
}
for (const [n, x, z] of [['beach', -150, 480], ['industrial', 1690, 540], ['farm', 1470, 1140], ['ind-n', 1600, 400]] as const) {
  const p = astar(L, center, nearestNode(L, x, z)); console.log(n, p ? 'OK ' + p.length : 'NO');
}
console.log('blocks', L.blocks.length, 'max i/j', Math.max(...L.blocks.map(b => b.i)), Math.max(...L.blocks.map(b => b.j)), 'N', N);
const kinds: Record<string, number> = {};
for (const b of L.buildings) kinds[b.kind] = (kinds[b.kind] || 0) + 1;
console.log(kinds);
console.log('kiosks', L.kiosks.length, 'garages', L.garages.length, 'spawn', L.playerSpawn);
// spawn not inside collider
const s = L.playerSpawn;
const inside = L.colliders.filter(c => c.y1 > 0.5 && s.x > c.x0 && s.x < c.x1 && s.z > c.z0 && s.z < c.z1);
console.log('spawn blocked:', inside.length);
// doors not inside colliders
let bad = 0;
for (const b of L.buildings) { const d = b.door; if (L.colliders.some(c => c.y1 > 0.5 && d.x > c.x0 && d.x < c.x1 && d.z > c.z0 && d.z < c.z1)) { bad++; if (bad < 5) console.log('door blocked', b.kind, b.id, d); } }
console.log('blocked doors', bad);
