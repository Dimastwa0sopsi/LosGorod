const ctxProxy: any = new Proxy({}, { get: (_t, k) => k === 'measureText' ? () => ({ width: 10 }) : () => {}, set: () => true });
(globalThis as any).document = { createElement: () => ({ getContext: () => ctxProxy, style: {} }) };
import { generateLayout, nearestRoadPoint } from '../src/game/worldgen';
import { Collision } from '../src/game/collision';
import { Vehicle, AIDriver, nearestNodeFast } from '../src/game/vehicles';
const L = generateLayout(); const col = new Collision(L.colliders);
for (const vname of ['Берёзово', 'Сосновка']) {
  const vg = L.villages.find((v) => v.name === vname)!;
  const v = new Vehicle('volta', 'owned'); v.place(L.playerSpawn.x - 6, 486, Math.PI / 2);
  const dr = nearestRoadPoint(L, vg.ex - (vg.ex - vg.sx) * 0.05, vg.ez); const ai = new AIDriver();
  ai.setRoute(L, nearestNodeFast(L, v.x, v.z), L.edges[dr.e].a, { x: dr.x, z: dr.z }); let done = false; ai.onArrive = () => (done = true);
  let maxD = 0, hits = 0; const tags = new Map<string, number>();
  const ctx = { L, vehicles: [], player: { x: -1e4, z: -1e4, inVehicle: null }, lightState: () => 'green', rand: Math.random };
  for (let i = 0; i < 8000 && !done; i++) {
    ai.step(v, 0.05, ctx as any);
    const near = col.query(v.x, v.z, 1.0).filter((b) => b.y1 > 0.55);
    for (const b of near) { hits++; const k = (b.tag ?? 'prop') + '@' + Math.round(b.x0) + ',' + Math.round(b.z0); tags.set(k, (tags.get(k) ?? 0) + 1); }
    maxD = Math.max(maxD, nearestRoadPoint(L, v.x, v.z).d);
  }
  console.log(vname, 'arrived', done, 'max dist from road centerline', maxD.toFixed(1), 'collider touches', hits, [...tags.entries()].slice(0, 6));
}
