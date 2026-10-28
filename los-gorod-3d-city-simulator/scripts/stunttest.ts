const ctxProxy: any = new Proxy({}, { get: (_t, k) => k === 'measureText' ? () => ({ width: 10 }) : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
(globalThis as any).document = { createElement: () => ({ getContext: () => ctxProxy, style: {} }) };
(globalThis as any).performance = performance;
import { Vehicle, playerDrive } from '../src/game/vehicles';
import { Collision } from '../src/game/collision';
import * as THREE from 'three';
const col = new Collision([]);
const run = (type: string, steps: number, inp: any, label: string) => {
  const v = new Vehicle(type, 'owned'); v.place(0, 0, 0); v.speed = 14;
  let maxTh = 0, flips = 0, stunt: any = null;
  for (let i = 0; i < steps; i++) { const r = playerDrive(v, inp(i), 0.016, col, false, () => false); v.sync(); maxTh = Math.max(maxTh, Math.abs(v.wheelie)); if (r.flip) flips++; if (r.stunt) stunt = r.stunt; }
  v.model.group.updateMatrixWorld(true);
  const rw = v.model.wheels[1].getWorldPosition(new THREE.Vector3()), fw = v.model.wheels[0].getWorldPosition(new THREE.Vector3());
  console.log(label.padEnd(34), 'maxθ', maxTh.toFixed(2), 'θ', v.wheelie.toFixed(2), 'flips', flips, 'stunt', stunt ? `${stunt.kind} ${stunt.t.toFixed(1)}s ${Math.round(stunt.dist)}m` : '-', '| rearY', rw.y.toFixed(2), 'frontY', fw.y.toFixed(2));
};
const base = { throttle: 0, brake: 0, steer: 0, handbrake: false, up: 0 };
run('strizh', 180, () => ({ ...base, throttle: 0.0, wheelie: true }), 'Ctrl only 3s (held)');
run('strizh', 400, (i: number) => ({ ...base, throttle: i < 250 ? 0.0 : 0, wheelie: i < 250 }), 'Ctrl 4s then release');
run('molnia', 600, () => ({ ...base, throttle: 1, wheelie: true }), 'Ctrl + full gas 10s (risky)');
run('strizh', 200, () => ({ ...base, brake: 1, wheelie: true }), 'stoppie Ctrl+brake');
run('volga', 200, () => ({ ...base, throttle: 1, wheelie: true }), 'car (no stunt)');
