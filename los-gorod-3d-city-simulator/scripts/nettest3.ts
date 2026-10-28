(globalThis as any).WebSocket = require('/tmp/pw/node_modules/ws');
(globalThis as any).window = globalThis;
import { NetClient } from '../src/game/net';
const a = new NetClient('Аня'), b = new NetClient('Борис'); const evB: string[] = []; let news = '';
b.onEvent = (_f, e) => evB.push(e.e + ':' + ((e as any).op ?? '')); b.onNews = (n, t) => { news = n + ': ' + t; };
a.connect(); b.connect();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
(async () => {
  await wait(2500);
  a.sendState({ x: 1, y: 0, z: 2, a: 0, s: 0, v: 'strizh', c: '#dc2626', seat: 0, n: 'Аня', lk: 1 } as any);
  a.sendMe('машет рукой'); a.sendNews('Продам самокат'); a.sendEvent({ e: 'trade', t: b.id!, op: 'req' });
  await wait(1500);
  console.log('B found A by nick:', b.findByNick('аня')?.id === a.id, '| lock flag', b.players.get(a.id!)?.st?.lk, '| moto', b.players.get(a.id!)?.st?.v);
  console.log('B chat:', b.chat.filter((m) => m.kind === 'me' || m.kind === 'news').map((m) => `[${m.kind}] ${m.name} ${m.text}`).join(' | '), '| news cb:', news);
  console.log('B events:', evB.join(', '));
  a.close(); b.close(); process.exit(0);
})();
