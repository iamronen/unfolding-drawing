import test from 'brittle';
import {
  getRepeaterAxesSorted,
  getRepeaterReferenceAxisWorldAngle,
  rotationSignByRepeaterId,
  rotationSignForRepeaterHub,
} from '../src/lib/circularRepeaterRotate.ts';
import type {
  AxisId,
  CircularRepeaterId,
  PlaceId,
} from '../src/lib/evolu-db.ts';

const hubA = 'hub-a' as PlaceId;
const hubB = 'hub-b' as PlaceId;
const ax1 = 'ax-1' as AxisId;
const ax2 = 'ax-2' as AxisId;
const r1 = 'rep-1' as CircularRepeaterId;
const r2 = 'rep-2' as CircularRepeaterId;

test('getRepeaterAxesSorted: order by angle', (t) => {
  const axes = [
    { id: ax2, placeId: hubA, circularRepeaterId: r1, angle: 1 },
    { id: ax1, placeId: hubA, circularRepeaterId: r1, angle: 0 },
  ];
  const s = getRepeaterAxesSorted(r1, axes);
  t.is(s.length, 2);
  t.is(s[0].id, ax1);
  t.is(s[1].id, ax2);
});

test('getRepeaterReferenceAxisWorldAngle', (t) => {
  const axes = [{ id: ax1, placeId: hubA, circularRepeaterId: r1, angle: 0 }];
  const placesAbs = [{ id: hubA, absX: 0, absY: 0, absWorldAngle: 0 }];
  const w = getRepeaterReferenceAxisWorldAngle(r1, axes, placesAbs);
  t.is(w, 0);
});

test('rotationSignForRepeaterHub: mirror partner negative', (t) => {
  t.is(rotationSignForRepeaterHub(hubA, hubA, hubB), 1);
  t.is(rotationSignForRepeaterHub(hubB, hubA, hubB), -1);
  t.is(rotationSignForRepeaterHub(hubA, hubA, null), 1);
});

test('rotationSignByRepeaterId: mirror echo pair opposite signs', (t) => {
  const rows = [
    { id: r1, placeId: hubA, repeaterEchoGroupId: r1 },
    { id: r2, placeId: hubB, repeaterEchoGroupId: r1 },
  ];
  const places = [
    { id: hubA, parentAxisId: null, repeaterEchoGroupId: null },
    { id: hubB, parentAxisId: null, repeaterEchoGroupId: null },
  ];
  const axes = [
    { id: ax1, placeId: hubA, circularRepeaterId: r1, angle: 0 },
    { id: ax2, placeId: hubB, circularRepeaterId: r2, angle: 0 },
  ];
  const signs = rotationSignByRepeaterId([r1, r2], r1, rows, places, axes);
  t.is(signs.get(r1), 1);
  t.is(signs.get(r2), -1);
});
