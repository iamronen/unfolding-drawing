import test from 'brittle';
import { reflectPointAcrossAxisLine } from '../src/lib/axisGeometry.ts';

test('reflect across horizontal axis through origin', (t) => {
  const r = reflectPointAcrossAxisLine(1, 2, 0, 0, 0);
  t.alike(r, { x: 1, y: -2 });
});

test('reflect across vertical line x=1', (t) => {
  const r = reflectPointAcrossAxisLine(2, 2, 1, 0, Math.PI / 2);
  t.ok(Math.abs(r.x - 0) < 1e-9 && Math.abs(r.y - 2) < 1e-9);
});
