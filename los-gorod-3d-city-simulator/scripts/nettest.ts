// Проверка сетевого клиента на реальном сервере (Node + пакет ws)
(globalThis as any).WebSocket = require('/tmp/pw/node_modules/ws');
(globalThis as any).window = globalThis;
import { NetClient, type NetEvent } from '../src/game/net';
const a = new NetClient('Маша'), b = new NetClient('Petya_99');
const gotB: [number, NetEvent][] = []; b.onEvent = (f, e) => gotB.push([f, e]);
const gotA: [number, NetEvent][] = []; a.onEvent = (f, e) => gotA.push([f, e]);
a.connect(); b.connect();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
(async () => {
  await wait(2500);
  console.log('status', a.status, b.status, 'ids', a.id, b.id);
  // B водитель, A садится пассажиром
  b.sendState({ x: 500, y: 0.2, z: 480, a: 1, s: 0, v: 'lada', c: '#b8312f', seat: 0, n: 'Petya_99', i: '', hp: 100 });
  a.sendState({ x: 500, y: 0.2, z: 480, a: 1, s: 0, v: '', c: '', seat: 1, r: b.id!, n: 'Маша', i: '', hp: 100, l: ['f', '#f1c9a5', 'long', '#d9b26a', 'tshirt', '#db2777', 'jeans', '#1e3a5f', '#fff'] });
  await wait(800);
  a.sendEvent({ e: 'hit', t: b.id!, d: 14, k: 'fist', hx: 500, hz: 479, heavy: false });
  a.sendEvent({ e: 'shot', o: [500, 1.4, 479], p: [500, 1.2, 490], i: '' });
  a.sendEvent({ e: 'hit', t: b.id!, d: 70, k: 'gun', hx: 500, hz: 479 });
  b.sendEvent({ e: 'dead', by: a.id! });
  a.sendChat('привет, садись!');
  await wait(1500);
  const pa = b.players.get(a.id!), pb = a.players.get(b.id!);
  console.log('B sees nick of A:', pa?.nick, '| gender', pa?.st?.l?.[0], '| A rides with', pa?.st?.r, 'seat', pa?.st?.seat, '(B id', b.id + ')');
  console.log('A sees nick of B:', pb?.nick, '| B car', pb?.st?.v);
  console.log('B received events:', gotB.map(([f, e]) => `${e.e}${'t' in e ? '->' + e.t : ''} from ${f}`).join(', '));
  console.log('A received events:', gotA.map(([f, e]) => `${e.e} from ${f}`).join(', '), '(own events are ignored:', !gotA.some(([f]) => f === a.id), ')');
  console.log('B chat:', b.chat.filter((c) => c.name !== 'Сервер').map((c) => c.name + ': ' + c.text));
  a.close(); b.close(); process.exit(0);
})();
