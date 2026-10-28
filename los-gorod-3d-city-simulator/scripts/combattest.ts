const ctxProxy: any = new Proxy({}, { get: (_t, k) => k === 'measureText' ? () => ({ width: 10 }) : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
(globalThis as any).document = { createElement: () => ({ getContext: () => ctxProxy, style: {} }) };
import * as THREE from 'three';
import { generateLayout } from '../src/game/worldgen';
import { PedSystem, rayCylinder } from '../src/game/npc';
import { rayVehicle } from '../src/game/combat';
import { VehicleModel } from '../src/game/vehicleModel';
import { VEHICLES } from '../src/game/data';
const L = generateLayout();
const ps = new PedSystem(L); ps.init(0, 0, 0);
// бойцовый NPC рядом с игроком
const p = ps.addStatic(ps.peds[0].char.look, 10, 10, 0, 'fighter'); p.kind = 'city' as any; p.brave = true; p.state = 'walk';
const player = { x: 10, z: 11.0, hp: 100, hits: 0, blocked: false };
const ctx = { px: player.x, pz: player.z, py: 0, playerVisible: true, lightState: () => 'red', inside: false, viewDist: 300, obstacles: () => false, vehicles: [],
  hitPlayer: (d: number, _fx: number, _fz: number, heavy: boolean) => { player.hits++; player.hp -= player.blocked ? d * 0.25 : d; if (heavy) heavyHits++; return true; } };
let heavyHits = 0;
const r1 = ps.damage(p, 11, player.x, player.z, {}); console.log('1st punch result:', r1, 'state', p.state, 'hp', p.hp);
for (let i = 0; i < 200; i++) ps.update(0.05, i * 0.05, ctx as any);
console.log('NPC fought back 10s: hits on player', player.hits, 'heavy', heavyHits, 'player hp', Math.round(player.hp), 'npc state', p.state);
// блок NPC
p.blockT = 0.5; p.state = 'fight'; p.a = Math.atan2(player.x - p.x, player.z - p.z);
const hpB = p.hp; const rb = ps.damage(p, 20, player.x, player.z, {}); console.log('blocked punch:', rb, 'dmg taken', (hpB - p.hp).toFixed(1));
// хук — нокдаун
p.hp = 40; p.blockT = 0; const rk = ps.damage(p, 24, player.x, player.z, { heavy: true }); console.log('hook at low hp:', rk, 'knockT', p.knockT);
for (let i = 0; i < 60; i++) ps.update(0.05, i * 0.05, ctx as any);
console.log('after 3s gets up -> state', p.state);
// выстрел — смерть/паника
const bystander = ps.addStatic(ps.peds[0].char.look, 14, 10, 0, 'x'); bystander.kind = 'city' as any; bystander.state = 'walk';
console.log('ped at', p.x.toFixed(2), p.z.toFixed(2), 'visible', p.char.root.visible, 'active', p.active, 'state', p.state); const hit = ps.shoot(p.x, 1.2, p.z + 10, 0, 0, -1, 50); console.log('ray hits ped:', !!hit, 'dist', hit?.d.toFixed(2), 'head', hit?.head);
const headHit = ps.shoot(p.x, 1.62, p.z + 10, 0, 0, -1, 50); console.log('head ray head flag:', headHit?.head);
const rs = ps.damage(p, 100, 10, 20, { gun: true }); console.log('headshot result:', rs, '| bystander state', bystander.state);
console.log('rayCylinder miss:', rayCylinder(0, 1, 0, 1, 0, 0, 5, 0, 2, 0.35, 1.8), 'hit:', rayCylinder(0, 1, 0, 1, 0, 0, 5, 0, 0.2, 0.35, 1.8)?.toFixed(2));
console.log('rayVehicle hit:', rayVehicle(new THREE.Vector3(0, 1, -10), new THREE.Vector3(0, 0, 1), 0, 0, 0, 0.3, 1.8, 1.45, 4.5)?.toFixed(2), 'over roof miss:', rayVehicle(new THREE.Vector3(0, 3, -10), new THREE.Vector3(0, 0, 1), 0, 0, 0, 0, 1.8, 1.45, 4.5));
for (const id of ['lada', 'ferrato', 'taiga', 'bus', 'strizh', 'strekoza', 'taxi', 'bizon']) console.log('seats', id, new VehicleModel(id).seats.length);
void VEHICLES;
