import test from 'brittle';
import type { AxisId, PlaceId } from '../src/lib/evolu-db.ts';
import { getEchoesInMirrorAxisOrder } from '../src/lib/mirrorEchoOrder.ts';

const ax = 'axis-mirror-1' as AxisId;
const g = 'group-1' as PlaceId;

test('getEchoesInMirrorAxisOrder sorts by distanceFromAxis', (t) => {
  const pNeg = {
    id: 'p-neg' as PlaceId,
    parentId: null,
    parentAxisId: ax,
    repeaterEchoGroupId: g,
    distanceFromAxis: -10,
    x: 0,
    y: 0,
  };
  const pPos = {
    id: 'p-pos' as PlaceId,
    parentId: null,
    parentAxisId: ax,
    repeaterEchoGroupId: g,
    distanceFromAxis: 10,
    x: 0,
    y: 0,
  };
  const places = [pPos, pNeg];
  const ordered = getEchoesInMirrorAxisOrder(g, ax, places);
  t.is(ordered.length, 2);
  const o0 = ordered[0];
  const o1 = ordered[1];
  t.ok(o0 && o1);
  if (o0 && o1) {
    t.is(o0.id, pNeg.id);
    t.is(o1.id, pPos.id);
  }
});

test('getEchoesInMirrorAxisOrder: null distanceFromAxis last', (t) => {
  const pNum = {
    id: 'p-num' as PlaceId,
    parentId: null,
    parentAxisId: ax,
    repeaterEchoGroupId: g,
    distanceFromAxis: 0,
    x: 0,
    y: 0,
  };
  const pNull = {
    id: 'p-null' as PlaceId,
    parentId: null,
    parentAxisId: ax,
    repeaterEchoGroupId: g,
    distanceFromAxis: null,
    x: 0,
    y: 0,
  };
  const ordered = getEchoesInMirrorAxisOrder(g, ax, [pNull, pNum]);
  const o0 = ordered[0];
  const o1 = ordered[1];
  t.ok(o0 && o1);
  if (o0 && o1) {
    t.is(o0.id, pNum.id);
    t.is(o1.id, pNull.id);
  }
});

test('getEchoesInMirrorAxisOrder: tie-break by id', (t) => {
  const pB = {
    id: 'p-b' as PlaceId,
    parentId: null,
    parentAxisId: ax,
    repeaterEchoGroupId: g,
    distanceFromAxis: 5,
    x: 0,
    y: 0,
  };
  const pA = {
    id: 'p-a' as PlaceId,
    parentId: null,
    parentAxisId: ax,
    repeaterEchoGroupId: g,
    distanceFromAxis: 5,
    x: 0,
    y: 0,
  };
  const ordered = getEchoesInMirrorAxisOrder(g, ax, [pB, pA]);
  const o0 = ordered[0];
  const o1 = ordered[1];
  t.ok(o0 && o1);
  if (o0 && o1) {
    t.is(o0.id, pA.id);
    t.is(o1.id, pB.id);
  }
});
