const ctxProxy: any = new Proxy({}, { get: (_t, k) => k === 'measureText' ? () => ({ width: 10 }) : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
(globalThis as any).document = { createElement: () => ({ getContext: () => ctxProxy, style: {} }) };
(globalThis as any).window = globalThis;
import { Game } from '../src/game/game';
import { generateLayout } from '../src/game/worldgen';
const L = generateLayout();
const g: any = Object.create(Game.prototype);
const toasts: string[] = []; const chat: any[] = [];
const vh = L.buildings.find((b) => b.kind === 'vhouse')!;
Object.assign(g, { L, state: { properties: [`${vh.id}:0`], locks: {}, plants: { [`${vh.id}:bed:0`]: { crop: 'tomato', t: 0 } }, fridges: {}, vehicles: [{ uid: 'a', type: 'kolibri', year: 2020, mileage: 30000, condition: 0.9 }, { uid: 'b', type: 'volga', year: 1990, mileage: 200000, condition: 0.6 }], kiosks: [{ id: 0, last: Date.now(), acc: 300 }], money: 0, listings: [], apps: [] },
  vehicles: [], interior: null, inVeh: null, online: false, localChat: chat, net: null, netN: 0,
  toast: (t: string) => toasts.push(t), sound: new Proxy({}, { get: () => () => {} }), save: () => {}, updateKiosks: () => {}, playerWorldPos: () => ({ x: 9999, z: 9999, a: 0 }), homeId: () => null });
g.chatSubmit('/sellhome'); console.log('home:', toasts.at(-1), '| props', g.state.properties.length, 'plants', Object.keys(g.state.plants).length);
g.chatSubmit('/sellcar'); console.log('car (2 cars, no arg):', chat.at(-1)?.text.slice(0, 70));
g.chatSubmit('/sellcar 2'); console.log('car 2:', toasts.at(-1), '| left', g.state.vehicles.map((v: any) => v.type));
g.chatSubmit('/sellbiz'); console.log('biz:', toasts.at(-1), '| money', g.state.money);
g.installApp('tg'); g.installApp('vzhuh'); console.log('apps:', g.state.apps, g.hasApp('tg'));
g.state.dms = {}; g.sendDm('mama', 'привет'); console.log('dm saved:', JSON.stringify(g.state.dms.mama?.[0]?.text));
