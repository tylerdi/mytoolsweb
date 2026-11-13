import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { practiceBoard as routePractice } from '../prototypes/daily-route/game-core.mjs';
import { practiceBoard as twinPractice } from '../twins/twins-core.mjs';

const directory = new URL('./assets/', import.meta.url);
await mkdir(directory, { recursive: true });

function routeSvg(board) {
  const size = 66;
  const offset = 26;
  const width = offset + 7 * size + 10;
  const tiles = [];
  for(let n=0;n<7;n++) tiles.push(`<text x="${offset+n*size+31}" y="17" text-anchor="middle" font-size="12" fill="#315460">${n+1}</text><text x="12" y="${offset+n*size+36}" text-anchor="middle" font-size="12" fill="#315460">${n+1}</text>`);
  for (let index = 0; index < 49; index += 1) {
    const x = offset + index % 7 * size;
    const y = offset + Math.floor(index / 7) * size;
    const rock = board.obstacles.includes(index);
    const beacon = board.beacons.includes(index);
    const current = board.currents[index];
    const fill = rock ? '#a9bfc0' : beacon ? '#fff0d5' : current ? '#dcebf6' : '#edf7f3';
    tiles.push(`<rect x="${x}" y="${y}" width="${size - 4}" height="${size - 4}" rx="3" fill="${fill}" stroke="#b7d1c9"/>`);
    if (rock) tiles.push(`<path d="M${x + 12} ${y + 48}l12-24 10 12 8-17 11 27z" fill="#607b83" stroke="#315460" stroke-width="2"/>`);
    if (beacon) tiles.push(`<circle cx="${x + 31}" cy="${y + 31}" r="17" fill="#f7c46c" stroke="#bd843c" stroke-width="2"/><path d="M${x + 31} ${y + 17}l4 10 11 1-8 7 3 11-10-6-10 6 3-11-8-7 11-1z" fill="#fff9e8"/>`);
    if (current) tiles.push(`<text x="${x + 31}" y="${y + 43}" text-anchor="middle" font-size="29" font-weight="800" fill="#3271a0">${{ up: '↑', right: '→', down: '↓', left: '←' }[current]}</text>`);
    if (index === board.start) tiles.push(`<path d="M${x + 13} ${y + 44}h37l-7 9h-23z" fill="#e5745c" stroke="#315460" stroke-width="2"/><path d="M${x + 31} ${y + 11}v31m0-28 16 25h-16z" fill="#fff8ed" stroke="#315460" stroke-width="2"/>`);
    if (index === board.end) tiles.push(`<path d="M${x + 20} ${y + 50}l5-35h12l5 35z" fill="#fff8ed" stroke="#315460" stroke-width="2"/><path d="M${x + 23} ${y + 34}h16l2 7h-19z" fill="#e5745c"/><circle cx="${x + 31}" cy="${y + 11}" r="4" fill="#f7c46c"/>`);
    if(Object.keys(board.signals||{}).length&&beacon)tiles.push(`<circle cx="${x+49}" cy="${y+12}" r="10" fill="#fff8ed" stroke="#836336"/><text x="${x+49}" y="${y+17}" text-anchor="middle" font-size="13" fill="#664d1d">${board.beacons.indexOf(index)+1}</text>`);
    if(board.signals?.[index]){const signal=board.signals[index];tiles.push(`<rect x="${x+6}" y="${y+17}" width="50" height="29" rx="4" fill="${signal.type==='gate'?'#d8c7b4':'#e9cb9a'}" stroke="#836336"/><text x="${x+31}" y="${y+37}" text-anchor="middle" font-size="14" fill="#513f2d">${signal.type==='gate'?'闸':'桥'} ${signal.beacon+1}</text>`);}
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${width}" role="img" aria-label="每日航线练习关海图"><rect width="${width}" height="${width}" rx="8" fill="#b9d6ce"/>${tiles.join('')}</svg>`;
}

function twinSvg(board) {
  const size = 82;
  const offset = 26;
  const width = offset + 5 * size + 10;
  const tiles = [];
  for(let n=0;n<5;n++) tiles.push(`<text x="${offset+n*size+38}" y="17" text-anchor="middle" font-size="12" fill="#315460">${n+1}</text><text x="12" y="${offset+n*size+43}" text-anchor="middle" font-size="12" fill="#315460">${n+1}</text>`);
  for (let index = 0; index < 25; index += 1) {
    const x = offset + index % 5 * size;
    const y = offset + Math.floor(index / 5) * size;
    const rock = board.rocks.includes(index);
    tiles.push(`<rect x="${x}" y="${y}" width="${size - 5}" height="${size - 5}" rx="3" fill="${rock ? '#a9bfc0' : '#edf7f3'}" stroke="#b7d1c9"/>`);
    if (rock) tiles.push(`<path d="M${x + 13} ${y + 58}l13-27 12 12 10-22 16 37z" fill="#607b83" stroke="#315460" stroke-width="3"/>`);
    if (index === board.goals.a || index === board.goals.b) tiles.push(`<circle cx="${x + 38}" cy="${y + 38}" r="27" fill="none" stroke="${index === board.goals.a ? '#d96853' : '#d69b36'}" stroke-width="4" stroke-dasharray="7 5"/>`);
    for (const [boat, color] of [['a', '#e5745c'], ['b', '#efb74e']]) {
      if (index !== board.start[boat]) continue;
      tiles.push(`<path d="M${x + 12} ${y + 54}h52l-10 12h-32z" fill="${color}" stroke="#244956" stroke-width="3"/><path d="M${x + 39} ${y + 12}v40m0-34 20 31h-20z" fill="#fff8ed" stroke="#244956" stroke-width="3"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${width}" role="img" aria-label="潮汐双船练习关海图"><rect width="${width}" height="${width}" rx="8" fill="#b9d6ce"/>${tiles.join('')}</svg>`;
}

for (const [name, content] of [
  ['route-2', routeSvg(routePractice(2))], ['route-8', routeSvg(routePractice(8))],
  ['route-9', routeSvg(routePractice(9))], ['route-11', routeSvg(routePractice(11))],
  ['twins-9', twinSvg(twinPractice(9))], ['twins-15', twinSvg(twinPractice(15))],
]) {
  await writeFile(fileURLToPath(new URL(`${name}.svg`, directory)), content);
}
