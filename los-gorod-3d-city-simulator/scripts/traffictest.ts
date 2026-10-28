const ctxProxy: any = new Proxy({}, { get: (_t, k) => k === 'measureText' ? () => ({ width: 10 }) : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
(globalThis as any).document = { createElement: () => ({ getContext: () => ctxProxy, style: {} }) };
(globalThis as any).window = globalThis;
(globalThis as any).WebSocket = require('/tmp/pw/node_modules/ws');
import * as THREE from 'three';
import { Game } from '../src/game/game';
import { NetClient } from '../src/game/net';
const a = new NetClient('Аня'), b = new NetClient('Борис');
const g: any = Object.create(Game.prototype);
Object.assign(g, { vehicles: [], vehGroup: new THREE.Group(), interior: null, px: 500, pz: 500, settings: { drawDistance: 400 }, qualityLevel: 0, npcCars: new Map(), online: true, remotes: new Map(), net: b });
let got = 0; b.onPeds = (from, list, vehs) => { got = vehs.length; g.applyCarSnapshot(from, vehs); };
a.connect(); b.connect();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
(async () => {
  await wait(2500);
  for (let i = 0; i < 3; i++) { a.sendPeds([], [[11, 'volga', '#e8e1c8', 500 + i * 3, 500, 1.57, 12, 0], [12, 'police', '#f8fafc', 520, 505, 0, 8, 1]]); await wait(300); }
  await wait(800);
  g.updateCarPuppets(0.1);
  const pups = g.vehicles.filter((v: any) => v.role === 'npcpuppet');
  console.log('B received cars:', got, '| puppets', pups.length, pups.map((v: any) => `${v.spec.id}@${v.x.toFixed(0)},${v.z.toFixed(0)} sir=${v.sirens}`).join(' '));
  // suppression: B (higher id) near A (lower id) suppresses its own NPC
  g.remotes.set(a.id, { id: a.id, x: 510, z: 500, ikey: '' }); console.log('suppressed near A:', g.suppressed(505, 505), '| far:', g.suppressed(900, 900), '| ids', a.id, b.id);
  a.sendPeds([], []); await wait(800); console.log('after empty snapshot puppets:', g.vehicles.filter((v: any) => v.role === 'npcpuppet').length);
  a.close(); b.close(); process.exit(0);
})();
