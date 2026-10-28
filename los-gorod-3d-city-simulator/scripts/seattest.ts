const ctxProxy: any = new Proxy({}, { get: (_t, k) => k === 'measureText' ? () => ({ width: 10 }) : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
(globalThis as any).document = { createElement: () => ({ getContext: () => ctxProxy, style: {} }) };
import * as THREE from 'three';
import { VehicleModel } from '../src/game/vehicleModel';
import { Character } from '../src/game/character';
import { VEHICLES, defaultLook } from '../src/game/data';
for (const id of Object.keys(VEHICLES)) {
  const m = new VehicleModel(id); const look = { ...defaultLook('m'), hair: 'mohawk' }; const ch = new Character(look);
  const worst = m.seats.map((s, si) => { const c2 = new Character({ ...defaultLook('f'), hair: 'bun' }); m.body.add(c2.root); c2.root.position.set(s.x, s.y, s.z); c2.root.scale.setScalar(s.scale); c2.pose(s.pose === 'ride' ? 'ride' : si ? 'passenger' : 'drive', 0); m.group.updateMatrixWorld(true); const y = new THREE.Box3().setFromObject(c2.root).max.y; m.body.remove(c2.root); return y; });
  const s = m.driver; m.body.add(ch.root); ch.root.position.set(s.x, s.y, s.z); ch.root.scale.setScalar(s.scale);
  ch.pose(s.pose === 'ride' ? 'ride' : 'drive', 0); m.group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(ch.root);
  const open = ['moto', 'quad'].includes(VEHICLES[id].body);
  console.log(id.padEnd(10), 'head top', box.max.y.toFixed(2), 'roof', VEHICLES[id].hei, open ? '(open)' : box.max.y < VEHICLES[id].hei ? 'OK' : 'THROUGH ROOF', '| seats', worst.length, 'max head', Math.max(...worst).toFixed(2), open ? '' : Math.max(...worst) < VEHICLES[id].hei ? 'ALL_OK' : 'SEAT_THROUGH');
}
