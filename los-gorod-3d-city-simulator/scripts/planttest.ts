const ctxProxy: any = new Proxy({}, { get: (_t, k) => k === 'measureText' ? () => ({ width: 10 }) : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: () => true });
(globalThis as any).document = { createElement: () => ({ getContext: () => ctxProxy, style: {} }) };
(globalThis as any).window = globalThis;
import { Game } from '../src/game/game';
const g: any = Object.create(Game.prototype);
const toasts: string[] = [];
Object.assign(g, { state: { inventory: { seed_tomato: 2, seed_durman: 1 }, money: 0, wanted: 0, quest: { step: 1 } }, online: false, toast: (t: string) => toasts.push(t), sound: new Proxy({}, { get: () => () => {} }), closePanel: () => {}, save: () => {}, updatePlants: () => {}, addWanted: () => { g.state.wanted++; } });
g.plant('5:pot:0', 'seed_tomato'); console.log('tomato in pot:', toasts.at(-1));
g.plant('5:bed:0', 'seed_durman'); console.log('durman on bed:', toasts.at(-1));
g.plant('5:bed:0', 'seed_tomato'); g.plant('5:pot:0', 'seed_durman');
console.log('plants:', Object.keys(g.state.plants), 'seeds left', JSON.stringify(g.state.inventory));
for (const k of Object.keys(g.state.plants)) g.state.plants[k].t -= 10 * 60 * 1000; // ускорить время
g.harvestPlant('5:bed:0'); g.harvestPlant('5:pot:0');
console.log('after harvest:', JSON.stringify(g.state.inventory));
g.sellProduce('veg'); g.sellProduce('drug'); console.log('money after selling', g.state.money, '| wanted', g.state.wanted, '|', toasts.slice(-2).join(' / '));
g.questEvent('water'); g.questEvent('vehicle'); console.log('quest step after water+vehicle:', g.state.quest.step);
