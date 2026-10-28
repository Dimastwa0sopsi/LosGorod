const ctxProxy: any = new Proxy({}, { get: (_t, k) => k === 'measureText' ? () => ({ width: 10 }) : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
(globalThis as any).document = { createElement: () => ({ getContext: () => ctxProxy, style: {} }) };
import { buildInterior, type InteriorKind } from '../src/game/interiors';
import { Collision } from '../src/game/collision';
for (const k of ['office', 'scootershop', 'house_city', 'apt_mid', 'apt_lux', 'house_village', 'basement'] as InteriorKind[]) {
  const it = buildInterior(k); const c = new Collision(it.colliders, 4);
  const bad = it.acts.filter((a) => c.solidAt(a.x, 1, a.z)).map((a) => a.action);
  const hs = it.doorSpots.hatch; console.log(k.padEnd(12), 'acts', it.acts.length, 'blocked', bad.join(',') || 'none', '| spawn', !c.solidAt(it.spawn.x, 1, it.spawn.z) ? 'ok' : 'BLOCKED', hs ? '| hatch ' + (!c.solidAt(hs.x, 1, hs.z) ? 'ok' : 'BLOCKED') : '');
}
