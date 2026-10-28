const ctxProxy: any = new Proxy({}, { get: (_t, k) => k === 'measureText' ? () => ({ width: 10 }) : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
(globalThis as any).document = { createElement: () => ({ getContext: () => ctxProxy, style: {} }) };
import { generateLayout } from '../src/game/worldgen';
import { PedSystem } from '../src/game/npc';
import { Vehicle, AIDriver } from '../src/game/vehicles';
import { Character } from '../src/game/character';
import { defaultLook } from '../src/game/data';
import * as THREE from 'three';
const L = generateLayout();
const A = new PedSystem(L), B = new PedSystem(L);
A.init(12, 540, 540); A.initVendors(); B.init(0, 0, 0);
const ctx = (px: number, pz: number) => ({ px, pz, py: 0, playerVisible: true, lightState: () => 'red', hitPlayer: () => true, inside: false, viewDist: 400, obstacles: () => false, vehicles: [], foePos: () => ({ x: 545, z: 545 }), hitFoe: () => { foeHits++; } });
let foeHits = 0;
for (let i = 0; i < 40; i++) A.update(0.05, i * 0.05, ctx(540, 540) as any);
const snap = A.snapshot(540, 540, 300);
B.applySnapshot(7, JSON.parse(JSON.stringify(snap)));
const pup = B.peds.filter((p) => p.kind === 'puppet');
console.log('A local peds', A.peds.length, '| snapshot', snap.length, '| B puppets', pup.length, '| msg bytes', JSON.stringify({ p: snap }).length);
const a0 = A.peds.find((p) => p.uid === pup[0].uid)!;
console.log('same look:', JSON.stringify(a0.char.look) === JSON.stringify(pup[0].char.look), '| pos', a0.x.toFixed(1), a0.z.toFixed(1), 'vs', pup[0].tx2?.toFixed(1), pup[0].tz2?.toFixed(1));
// B бьёт марионетку → владелец A получает событие pedhit и применяет урон, NPC атакует игрока B (foe)
const r = A.damage(a0, 30, 545, 545, { foe: 7 }); console.log('owner applied hit from remote:', r, 'state', a0.state, 'foe', a0.foe);
a0.brave = true; a0.state = 'fight'; a0.x = 544.5; a0.z = 544.2;
for (let i = 0; i < 80; i++) A.update(0.05, i * 0.05, ctx(540, 500) as any);
console.log('NPC fought the remote player: hits sent to foe =', foeHits);
// повторный снимок без пеша — марионетка удаляется
B.applySnapshot(7, snap.slice(1)); console.log('puppet removed when missing:', B.peds.filter((p) => p.kind === 'puppet').length === pup.length - 1);
B.removeOwner(7); console.log('owner left -> puppets', B.peds.filter((p) => p.kind === 'puppet').length);
// трафик и припаркованная машина
const na = 3 * 19 + 5, nb = 3 * 19 + 6; const NA = L.nodes[na], NB = L.nodes[nb];
const v = new Vehicle('lada', 'traffic'); const pv = new Vehicle('taiga', 'parked'); pv.place(NA.x + 30, NA.z + 5.0, Math.PI / 2);
v.place(NA.x + 8, NA.z + 3, Math.PI / 2); v.speed = 10;
const ai = new AIDriver(); ai.route = [na, nb]; ai.mode = 'wander';
let minSp = 99; const actx = { L, vehicles: [v, pv], player: { x: -1e4, z: -1e4, inVehicle: null }, lightState: () => 'green', rand: () => 0.5 };
for (let i = 0; i < 60; i++) { ai.step(v, 0.05, actx as any); minSp = Math.min(minSp, v.speed); }
console.log('traffic passing parked car: min speed', minSp.toFixed(1), '(should stay > 5)');
// женская модель — размеры
const ch = new Character(defaultLook('f')); ch.pose('idle', 0); ch.root.updateMatrixWorld(true);
const bb = new THREE.Box3().setFromObject(ch.root); console.log('female height', (bb.max.y).toFixed(2), 'm; crouch:'); ch.pose('crouch', 0); ch.root.updateMatrixWorld(true); console.log('  crouch height', new THREE.Box3().setFromObject(ch.root).max.y.toFixed(2));
