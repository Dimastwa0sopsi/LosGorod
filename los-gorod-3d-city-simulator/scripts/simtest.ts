// Node-симуляция модулей игры (без WebGL)
const ctxProxy: any = new Proxy({}, { get: (_t, k) => k === 'measureText' ? () => ({ width: 10 }) : k === 'canvas' ? {} : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
(globalThis as any).document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctxProxy, style: {} }) };
import { generateLayout } from '../src/game/worldgen';
import { buildWorldMeshes } from '../src/game/worldMesh';
import { buildInterior, type InteriorKind } from '../src/game/interiors';
import { VehicleModel } from '../src/game/vehicleModel';
import { Character } from '../src/game/character';
import { VEHICLES, defaultLook, defaultTuning } from '../src/game/data';
import { Collision } from '../src/game/collision';
import { Vehicle, AIDriver, playerDrive, nearestNodeFast, heliLanded } from '../src/game/vehicles';
import { PedSystem } from '../src/game/npc';
import { nearestRoadPoint } from '../src/game/worldgen';
(async () => {
  const L = generateLayout();
  let t0 = Date.now();
  const W = await buildWorldMeshes(L, () => {});
  let meshes = 0, tris = 0; W.root.traverse((o: any) => { if (o.isMesh) { meshes++; tris += (o.geometry.attributes.position.count / 3); } });
  console.log('world meshes', meshes, 'tris', Math.round(tris / 1000) + 'k', 'chunks', W.chunks.length, 'lights', W.lights.length, 'ms', Date.now() - t0);
  // интерьеры
  const kinds: InteriorKind[] = ['shop24', 'supermarket', 'cafe', 'pharmacy', 'gunshop', 'clothes', 'barber', 'police', 'hospital', 'cityhall', 'bank', 'dealer', 'service', 'mall', 'hall', 'apt_eco', 'apt_mid', 'apt_lux', 'house_city', 'house_village', 'vshop', 'vadmin', 'checkpoint', 'fire', 'gas', 'mallfood'];
  for (const k of kinds) {
    const it = buildInterior(k, { owned: [true, false, false, false] });
    const c = new Collision(it.colliders, 4);
    const sp = it.spawn; const spawnBad = c.solidAt(sp.x, 1, sp.z);
    const badActs = it.acts.filter((a) => c.solidAt(a.x, (a.y ?? 0) + 1, a.z));
    const exits = it.acts.filter((a) => a.action === 'exit').length;
    let doorBad = 0; for (const [n, d] of Object.entries(it.doorSpots)) if (c.solidAt(d.x, d.y + 1, d.z)) { doorBad++; console.log('  doorSpot blocked', k, n); }
    const walls = it.colliders.filter((b) => b.y1 - b.y0 > 2).length;
    console.log(k.padEnd(14), 'cols', it.colliders.length, 'walls', walls, 'acts', it.acts.length, 'exit', exits, spawnBad ? 'SPAWN BLOCKED' : 'spawn ok', badActs.length ? 'BLOCKED ACTS: ' + badActs.map((a) => a.action).join(',') : '', it.bed ? 'bed' : '', doorBad ? 'DOORS BAD' : '');
    it.dispose();
  }
  // модели транспорта
  for (const id of Object.keys(VEHICLES)) {
    const m = new VehicleModel(id); const parts = m.detachables().length;
    const d = m.detach(); const t = defaultTuning(); t.spoiler = true; t.rims = 2; t.neon = '#00e5ff'; m.applyTuning(t);
    console.log('veh', id.padEnd(10), 'meshes', m.meshes.length, 'wheels', m.wheels.length, 'detachable', parts, 'detached', d?.name, 'seat y', m.driver.y.toFixed(2), 'roof', VEHICLES[id].hei);
  }
  const ch = new Character(defaultLook('f')); for (const p of ['idle', 'walk', 'run', 'drive', 'ride', 'punch', 'lie', 'carry', 'smoke', 'shoot', 'swim'] as const) ch.pose(p, 1, 1);
  let parts = 0; ch.root.traverse((o: any) => o.isMesh && parts++); console.log('character meshes', parts);
  // ИИ: маршруты до каждой деревни и промзоны
  const col = new Collision(L.colliders);
  const ctx = { L, vehicles: [] as Vehicle[], player: { x: -9999, z: -9999, inVehicle: null }, lightState: () => 'green' as const, rand: Math.random };
  const targets = [...L.villages.map((v) => ({ n: v.name, x: v.ex - (v.ex - v.sx) * 0.05, z: v.ez - (v.ez - v.sz) * 0.05 })), { n: 'Промзона', x: 1650, z: 540 }, { n: 'Пляж', x: -150, z: 480 }, { n: 'Ферма', x: 1460, z: 1140 }];
  for (const tg of targets) {
    const v = new Vehicle('volta', 'owned'); v.place(L.playerSpawn.x - 6, 486, Math.PI / 2);
    const start = nearestNodeFast(L, v.x, v.z); const dr = nearestRoadPoint(L, tg.x, tg.z); const e = L.edges[dr.e];
    const ai = new AIDriver(); ai.setRoute(L, start, e.a, { x: dr.x, z: dr.z }); let arrived = false; ai.onArrive = () => (arrived = true);
    let steps = 0, maxOff = 0;
    for (; steps < 20 * 60 * 6 && !arrived; steps++) {
      ai.step(v, 0.05, ctx as any);
      const p = { x: v.x, z: v.z }; const h = col.pushCircle(p, 1.0, 0, 1.6, 0.55); if (h) maxOff++;
      const rp = nearestRoadPoint(L, v.x, v.z); if (steps % 20 === 0 && rp.d > maxOff) maxOff = Math.max(maxOff, rp.d);
    }
    console.log('AI ->', tg.n.padEnd(12), arrived ? `arrived in ${(steps * 0.05).toFixed(0)}s` : 'NOT ARRIVED', 'dist', Math.hypot(v.x - dr.x, v.z - dr.z).toFixed(1), 'maxOffRoad', maxOff.toFixed(1));
  }
  // светофор: машина должна остановиться на красный
  {
    const v = new Vehicle('lada', 'traffic'); const n0 = 8 * 19 + 5, n1 = 8 * 19 + 6; const A = L.nodes[n0];
    v.place(A.x + 8, A.z + 3, Math.PI / 2); v.speed = 12;
    const ai = new AIDriver(); ai.route = [n0, n1, n1 + 1, n1 + 2]; ai.mode = 'route';
    const c2 = { ...ctx, lightState: () => 'red' as const };
    for (let i = 0; i < 400; i++) ai.step(v, 0.05, c2 as any);
    console.log('red light: car stopped at', (L.nodes[n1].x - v.x).toFixed(1), 'm before node, speed', v.speed.toFixed(2));
  }
  // ручная коробка: нейтраль не разгоняет; передачи
  {
    const v = new Vehicle('kolibri', 'owned'); v.place(305, 30, Math.PI); v.gear = 0;
    for (let i = 0; i < 60; i++) playerDrive(v, { throttle: 1, brake: 0, steer: 0, handbrake: false, wheelie: false, up: 0 }, 0.05, col, true, () => false);
    console.log('neutral 3s speed', v.speed.toFixed(2), 'rpm', Math.round(v.rpm));
    v.gear = 1; for (let i = 0; i < 100; i++) playerDrive(v, { throttle: 1, brake: 0, steer: 0, handbrake: false, wheelie: false, up: 0 }, 0.05, col, true, () => false);
    const s1 = v.speed; v.gear = 3; for (let i = 0; i < 100; i++) playerDrive(v, { throttle: 1, brake: 0, steer: 0, handbrake: false, wheelie: false, up: 0 }, 0.05, col, true, () => false);
    console.log('gear1 5s', (s1 * 3.6).toFixed(0), 'km/h; gear3 +5s', (v.speed * 3.6).toFixed(0), 'km/h; pos', v.x.toFixed(1), v.z.toFixed(1));
    const m = new Vehicle('strizh', 'owned'); m.place(305, 30, Math.PI); m.speed = 10;
    playerDrive(m, { throttle: 1, brake: 0, steer: 0, handbrake: false, wheelie: true, up: 0 }, 0.3, col, false, () => false);
    const c = new Vehicle('volga', 'owned'); c.place(305, 30, Math.PI); c.speed = 10;
    playerDrive(c, { throttle: 1, brake: 0, steer: 0, handbrake: false, wheelie: true, up: 0 }, 0.3, col, false, () => false);
    console.log('wheelie moto', m.wheelie.toFixed(2), 'car', c.wheelie.toFixed(2));
    // въезд в стену
    const w = new Vehicle('lada', 'owned'); w.place(L.playerSpawn.x, 497, 0); w.speed = 15; let imp = 0;
    for (let i = 0; i < 40; i++) { const r = playerDrive(w, { throttle: 1, brake: 0, steer: 0, handbrake: false, wheelie: false, up: 0 }, 0.05, col, false, () => false); imp = Math.max(imp, r.impact); }
    console.log('wall crash impact', imp.toFixed(1), 'car z', w.z.toFixed(1), '(cityhall front wall ~501)');
  }
  // вертолёт
  {
    const h = new Vehicle('strekoza', 'owned'); h.place(L.helipad.x, L.helipad.z, 0); h.hasDriver = true;
    const inp = { throttle: 0, brake: 0, steer: 0, handbrake: false, wheelie: false, up: 1 };
    for (let i = 0; i < 200; i++) playerDrive(h, inp, 0.05, col, false, () => false);
    const alt = h.y; for (let i = 0; i < 100; i++) playerDrive(h, { ...inp, up: 0, throttle: 1 }, 0.05, col, false, () => false);
    const moved = Math.hypot(h.x - L.helipad.x, h.z - L.helipad.z);
    console.log('heli alt after 10s', alt.toFixed(1), 'landed?', heliLanded(h, col), 'moved', moved.toFixed(0));
    for (let i = 0; i < 300; i++) playerDrive(h, { ...inp, up: -1, throttle: 0 }, 0.05, col, false, () => false);
    console.log('heli after descend y', h.y.toFixed(2), 'landed', heliLanded(h, col));
  }
  // пешеходы
  {
    const ps = new PedSystem(L); ps.init(20, 540, 540);
    const ctxp = { px: 540, pz: 540, py: 0, playerVisible: true, lightState: () => 'red', hitPlayer: () => {}, inside: false, viewDist: 300, obstacles: (x: number, z: number) => col.query(x, z, 0.3).some((b) => b.y1 > 0.5), vehicles: [] };
    for (let i = 0; i < 600; i++) ps.update(0.05, i * 0.05, ctxp);
    const city = ps.peds.filter((p) => p.kind === 'city');
    const onRoad = city.filter((p) => { const r = nearestRoadPoint(L, p.x, p.z); return r.d < 5.5 && !p.crossing; }).length;
    console.log('peds', ps.peds.length, 'city peds on roadway (not crossing):', onRoad);
    const target = city[0]; const r = ps.damage(target, 22, target.x + 1, target.z); console.log('punched ped reaction:', r);
    const beach = ps.peds.filter((p) => p.kind === 'beach'); ps.setBeachDay(false); for (let i = 0; i < 2400; i++) ps.update(0.05, i, { ...ctxp, px: -200, pz: 480 });
    console.log('beach night gone:', beach.filter((p) => p.state === 'gone').length, '/', beach.length);
  }
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
// погоня: полиция должна догнать стоящего игрока
(async () => {
  const L = generateLayout();
  const v = new Vehicle('police', 'police'); const n = nearestNodeFast(L, 300, 300); v.place(L.nodes[n].x, L.nodes[n].z, 0);
  const ai = new AIDriver(); ai.mode = 'chase'; ai.obeyLights = false; ai.route = [n, L.adj[n][0].n];
  const target = { x: 690, z: 512 }; ai.chaseTarget = () => target;
  const ctx = { L, vehicles: [v], player: { x: target.x, z: target.z, inVehicle: { } as any }, lightState: () => 'green' as const, rand: Math.random };
  let t = 0; for (; t < 2400; t++) { ai.step(v, 0.05, ctx as any); if (Math.hypot(v.x - target.x, v.z - target.z) < 7.5 && Math.abs(v.speed) < 3) break; }
  console.log('police chase reached player:', t < 2400, 'in', (t * 0.05).toFixed(0), 's, dist', Math.hypot(v.x - target.x, v.z - target.z).toFixed(1));
})();
