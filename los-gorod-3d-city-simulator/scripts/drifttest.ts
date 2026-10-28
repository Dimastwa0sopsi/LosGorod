const ctxProxy: any = new Proxy({}, { get: (_t, k) => k === 'measureText' ? () => ({ width: 10 }) : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
(globalThis as any).document = { createElement: () => ({ getContext: () => ctxProxy, style: {} }) };
import { Vehicle, playerDrive } from '../src/game/vehicles';
import { Collision } from '../src/game/collision';
import { VEHICLES } from '../src/game/data';
import { VehicleModel } from '../src/game/vehicleModel';
const col = new Collision([]);
const v = new Vehicle('kolibri', 'owned'); v.place(0, 0, 0); v.speed = 22;
let maxSlip = 0, res: any = null; const h0 = v.heading;
for (let i = 0; i < 260; i++) { const drift = i < 160; const r = playerDrive(v, { throttle: 0.7, brake: 0, steer: drift ? 1 : 0, handbrake: drift, wheelie: false, up: 0 }, 0.016, col, false, () => false); maxSlip = Math.max(maxSlip, Math.abs(v.slip)); if (r.stunt) res = r.stunt; }
console.log('drift: max slip', maxSlip.toFixed(2), 'rad | speed after', (v.speed * 3.6).toFixed(0), 'km/h | turned', ((h0 - v.heading) * 57.3).toFixed(0), 'deg | result', res ? `${res.kind} ${res.t.toFixed(1)}s score ${res.dist.toFixed(0)}` : '-');
const s0 = new Vehicle('kolibri', 'owned'); s0.place(0, 0, 0); s0.speed = 22; for (let i = 0; i < 160; i++) playerDrive(s0, { throttle: 0.7, brake: 0, steer: 0, handbrake: true, wheelie: false, up: 0 }, 0.016, col, false, () => false);
console.log('handbrake straight (no steer): speed after 2.5s', (s0.speed * 3.6).toFixed(0), 'km/h');
const ids = Object.keys(VEHICLES); console.log('vehicles total', ids.length, '| scooters', ids.filter((k) => VEHICLES[k].body === 'scooter').length, '| semis', ids.filter((k) => VEHICLES[k].body === 'semi').length);
let fails = 0; for (const id of ids) { try { const m = new VehicleModel(id); if (!m.meshes.length) fails++; } catch (e) { fails++; console.log('FAIL', id, (e as Error).message); } }
console.log('models built ok:', ids.length - fails, '/', ids.length);
