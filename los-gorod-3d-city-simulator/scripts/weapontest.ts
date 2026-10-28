const ctxProxy: any = new Proxy({}, { get: (_t, k) => k === 'measureText' ? () => ({ width: 10 }) : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
(globalThis as any).document = { createElement: () => ({ getContext: () => ctxProxy, style: {} }) };
import * as THREE from 'three';
import { Combat } from '../src/game/combat';
import { PedSystem } from '../src/game/npc';
import { generateLayout } from '../src/game/worldgen';
import { Collision } from '../src/game/collision';
import { Character } from '../src/game/character';
import { Vehicle } from '../src/game/vehicles';
import { defaultLook, WEAPONS } from '../src/game/data';
const L = generateLayout();
const peds = new PedSystem(L); peds.init(0, 0, 0);
let drops = 0; peds.onDeath = (_p, mine) => { if (mine) drops++; };
const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(65, 1, 0.1, 500);
const player = new Character(defaultLook('m')); scene.add(player.root);
const state: any = { inventory: {}, ammoBy: { p: 60, s: 32, r: 60, m: 18 }, magBy: {}, money: 0, health: 100 };
const g: any = { scene, camera: cam, player, peds, state, weapon: 'pistol', inVeh: null, rideRemote: null, passenger: false, interior: null, vehicles: [] as Vehicle[], mobile: false,
  px: 300, py: 0, pz: 300, pa: 0, camYaw: 0, camPitch: 0.1, activeCol: new Collision([]), sound: new Proxy({}, { get: () => () => {} }), toast: () => {}, net: null,
  remoteTargets: () => [], interiorKey: () => '', policeNear: () => false, addWanted: () => {}, rideVeh: () => null,
  hitPed: (p: any, d: number, fx: number, fz: number, o: any) => peds.damage(p, d, fx, fz, o) };
const cb = new Combat(g);
const results: string[] = [];
for (const w of Object.keys(WEAPONS)) {
  g.weapon = w; cb.reset(); state.magBy[w] = WEAPONS[w].mag;
  const t = peds.addStatic(defaultLook('f'), 300, 312, Math.PI, 'x'); t.kind = 'city' as any; t.hp = 100;
  cam.position.set(300, 1.6, 295); cam.lookAt(300, 1.2, 312); cam.updateMatrixWorld(true);
  let shots = 0; const t0 = t.hp;
  for (let i = 0; i < 120 && t.state !== 'down'; i++) { cb.update(1 / 60, { attack: i % 2 === 0, hold: true, alt: true, reload: false, moving: false, moveDir: null }); }
  shots = WEAPONS[w].mag - state.magBy[w];
  results.push(`${w.padEnd(8)} shots ${shots} target ${t.state === 'down' ? 'DOWN' : 'hp ' + Math.round(t.hp)} (from ${t0})`);
  peds.removePed(t);
}
console.log(results.join('\n'), '\nkill drops triggered:', drops);
// стрельба из машины: игрок в машине, цель сбоку; собственная машина не перехватывает пулю
const car = new Vehicle('lada', 'owned'); car.place(300, 300, 0); scene.add(car.model.group); car.model.body.add(player.root); player.root.position.set(0.36, 0.6, 0); car.model.group.updateMatrixWorld(true);
g.inVeh = car; g.vehicles = [car]; g.weapon = 'smg'; state.magBy.smg = 30; cb.reset();
const t = peds.addStatic(defaultLook('m'), 310, 301, 0, 'x'); t.kind = 'city' as any; t.hp = 100;
g.camYaw = Math.PI / 2; cam.position.set(296, 2.5, 301); cam.lookAt(310, 1.1, 301); cam.updateMatrixWorld(true);
for (let i = 0; i < 90 && t.state !== 'down'; i++) cb.update(1 / 60, { attack: false, hold: true, alt: true, reload: false, moving: true, moveDir: null });
console.log('drive-by: driveBy', cb.driveBy, '| target', t.state, 'hp', Math.round(t.hp), '| mag left', state.magBy.smg, '| own car condition', car.condition.toFixed(2));
{ state.magBy.smg = 30; let n = 0; const cds: string[] = [];
  for (let i = 0; i < 30; i++) { const before = state.magBy.smg; cb.update(1 / 60, { attack: false, hold: true, alt: true, reload: false, moving: true, moveDir: null }); if (state.magBy.smg < before) n++; else if (i < 12) cds.push(`${i}:${(cb as any).fireCd.toFixed(3)}`); }
  console.log('debug shots in 30 frames', n, cds.join(' ')); }
