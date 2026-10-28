import { generateLayout } from '../src/game/worldgen';
const L = generateLayout(); console.log('lamps', L.props.filter((p) => p.t === 'lamp').length, 'docks', L.scooterDocks.length, 'vhouse beds', L.buildings.filter((b) => b.beds).length);
