const ctxProxy: any = new Proxy({}, { get: (_t, k) => k === 'measureText' ? () => ({ width: 10 }) : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
(globalThis as any).document = { createElement: () => ({ getContext: () => ctxProxy, style: {} }) };
(globalThis as any).window = globalThis;
import * as THREE from 'three';
import { Game } from '../src/game/game';
import { Character } from '../src/game/character';
import { Vehicle, playerDrive } from '../src/game/vehicles';
import { Collision } from '../src/game/collision';
import { buildInterior } from '../src/game/interiors';
import { defaultLook } from '../src/game/data';
// ---- обмен: два «клиента» на прототипе Game, события доставляются напрямую
const mk = (id: number, nick: string, inv: Record<string, number>, money: number) => {
  const g: any = Object.create(Game.prototype);
  Object.assign(g, { state: { inventory: inv, money, nick }, weapon: 'fists', trade: null, tradeInvite: null, pendingTradeTo: null, panel: null, toasts: [] as string[],
    toast: (t: string) => g.toasts.push(t), sound: new Proxy({}, { get: () => () => {} }), closePanel: () => { g.panel = null; }, openPanel: (p: any) => { g.panel = p; }, save: () => {}, setWeapon: (w: string) => { g.weapon = w; } });
  g.net = { id, displayName: (x: number) => (x === 1 ? 'Аня' : 'Борис'), findByNick: (n: string) => (n === 'Борис' ? { id: 2, nick: 'Борис', name: 'Игрок2' } : n === 'Аня' ? { id: 1, nick: 'Аня', name: 'Игрок1' } : null), sendEvent: (ev: any) => queue.push([id, ev]), sendMe: (t: string) => g.me = t, sendNews: (t: string) => g.news = t, chat: [] };
  return g;
};
const queue: [number, any][] = [];
const A = mk(1, 'Аня', { burger: 3, pistol: 1, tomato: 5 }, 1000), B = mk(2, 'Борис', { cola: 4, medkit: 1 }, 500);
const pump = () => { while (queue.length) { const [from, ev] = queue.shift()!; const to = ev.t === 1 ? A : B; to.onTradeEvent(from, ev); } };
A.chatSubmit('/obm Борис'); pump();
console.log('B invite from:', B.tradeInvite?.name, '| B panel', B.panel?.type);
B.chatSubmit('/obm да'); pump();
console.log('both trade open:', !!A.trade, !!B.trade);
A.tradeAdd('pistol'); A.tradeAdd('burger'); A.tradeAdd('burger'); A.tradeMoney(100); pump();
B.tradeAdd('medkit'); B.tradeAdd('cola'); pump();
console.log('A sees B offer:', JSON.stringify(A.trade.theirs), '| B sees A offer:', JSON.stringify(B.trade.theirs), B.trade.theirMoney);
A.tradeReady(); pump(); B.tradeAdd('cola'); pump(); // изменение сбрасывает согласие
console.log('after change: A ready', A.trade.myReady, '| B sees A ready', B.trade.theirReady);
A.tradeReady(); pump(); B.tradeReady(); pump();
console.log('done:', !A.trade && !B.trade, '| A inv', JSON.stringify(A.state.inventory), A.state.money, '| B inv', JSON.stringify(B.state.inventory), B.state.money);
// ---- команды
const C = mk(1, 'Аня', {}, 1000); C.net.chat = [];
C.chatSubmit('/me открывает дверь'); C.chatSubmit('/smi Продам Бриз-24 недорого'); C.chatSubmit('/xyz');
console.log('/me ->', C.me, '| /smi ->', C.news, 'money', C.state.money, '| unknown cmd msg:', C.net.chat.at(-1)?.text.slice(0, 30));
// ---- плавание: голова над водой (0.08), тело у поверхности
const ch = new Character(defaultLook('f')); const box = new THREE.Box3();
for (const p of ['tread', 'swim'] as const) { ch.pose(p, 1, 1); ch.root.updateMatrixWorld(true); const hp = ch.head.getWorldPosition(new THREE.Vector3()); box.setFromObject(ch.root); console.log(p, 'head y', hp.y.toFixed(2), 'top', box.max.y.toFixed(2), 'bottom', box.min.y.toFixed(2)); }
for (const p of ['dance1', 'dance5', 'sit', 'pushup', 'evening'] as const) { if (p === 'evening') { ch.setLook({ ...defaultLook('f'), top: 'evening' }); ch.pose('idle', 0); } else ch.pose(p as any, 2, 0); }
console.log('poses & evening dress ok');
// ---- самокат: стант
const col = new Collision([]); const sv = new Vehicle('scooter', 'rental'); sv.place(0, 0, 0); sv.speed = 6; let st: any = null, mx = 0;
for (let i = 0; i < 300; i++) { const r = playerDrive(sv, { throttle: 0.5, brake: 0, steer: 0, handbrake: false, wheelie: i < 200, up: 0 }, 0.016, col, false, () => false); sv.sync(); mx = Math.max(mx, sv.wheelie); if (r.stunt) st = r.stunt; }
console.log('scooter max tilt', mx.toFixed(2), 'stunt', st ? `${st.kind} ${st.t.toFixed(1)}s` : '-', '| speed', (sv.speed * 3.6).toFixed(0), 'km/h');
// ---- интерьеры
for (const k of ['basement', 'truckoffice', 'house_village'] as const) { const it = buildInterior(k); const c = new Collision(it.colliders, 4); console.log(k, 'acts', it.acts.map((a) => a.action).join(','), 'pots', it.pots?.length ?? 0, 'spawn ok', !c.solidAt(it.spawn.x, 1, it.spawn.z), it.doorSpots.hatch ? 'hatch ok ' + !c.solidAt(it.doorSpots.hatch.x, 1, it.doorSpots.hatch.z) : ''); }
