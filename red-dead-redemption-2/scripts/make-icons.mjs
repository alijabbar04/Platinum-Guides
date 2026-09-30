// Renders the app icon/splash from our own SVG artwork (no game art).
// Needs: npm i --no-save --legacy-peer-deps @resvg/resvg-js
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const BG = '#17120d', GOLD = '#d9a84e', CREAM = '#f0e4c8', RED = '#c8452f';
const star = (cx, cy, r, ri) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? ri : r;
    d += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }
  return d + 'Z';
};
// artwork in a 1024 box; `s` scales it about the centre (adaptive icons need a safe zone)
const art = (s, mono = false) => {
  const g = mono ? '#ffffff' : GOLD, c = mono ? '#ffffff' : CREAM, r = mono ? '#ffffff' : RED;
  const dots = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    return `<circle cx="${512 + 392 * Math.cos(a)}" cy="${512 + 392 * Math.sin(a)}" r="9" fill="${c}"/>`;
  }).join('');
  return `<g transform="translate(512 512) scale(${s}) translate(-512 -512)">
    <circle cx="512" cy="512" r="430" fill="none" stroke="${c}" stroke-width="22"/>
    ${dots}
    <circle cx="512" cy="512" r="352" fill="none" stroke="${c}" stroke-width="8"/>
    <path d="M362 300 H662 V420 A150 150 0 0 1 362 420 Z" fill="${g}"/>
    <path d="M362 330 H300 A70 70 0 0 0 380 470" fill="none" stroke="${g}" stroke-width="26"/>
    <path d="M662 330 H724 A70 70 0 0 1 644 470" fill="none" stroke="${g}" stroke-width="26"/>
    <rect x="488" y="560" width="48" height="90" fill="${g}"/>
    <rect x="400" y="650" width="224" height="46" rx="6" fill="${g}"/>
    <path d="${star(512, 405, 70, 30)}" fill="${mono ? '#000000' : BG}"/>
    <path d="M300 760 H724" stroke="${r}" stroke-width="16"/>
    <path d="${star(512, 760, 30, 13)}" fill="${r}"/>
  </g>`;
};
const svg = (inner, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}${inner}</svg>`;
const out = (file, s, w = 1024) => fs.writeFileSync(file, new Resvg(s, { fitTo: { mode: 'width', value: w } }).render().asPng());

out('assets/icon.png', svg(art(0.95), BG));
out('assets/android-icon-foreground.png', svg(art(0.62)));
out('assets/android-icon-monochrome.png', svg(art(0.62, true)));
out('assets/android-icon-background.png', svg('', BG));
out('assets/splash-icon.png', svg(art(1)), 512);
out('assets/favicon.png', svg(art(0.95), BG), 64);
console.log('icons written');
