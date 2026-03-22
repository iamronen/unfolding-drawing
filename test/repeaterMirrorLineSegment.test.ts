import test from 'brittle';
import {
  filterRepeaterEchoPrimaries,
  getMirrorPlaceForRepeaterPrimary,
  reflectRepeaterMirrorEndAxisIndex,
} from '../src/lib/repeaterMirrorLineSegment.ts';

test('reflectRepeaterMirrorEndAxisIndex: O=2 E=1 N=10 → 3', (t) => {
  t.is(reflectRepeaterMirrorEndAxisIndex(2, 1, 10), 3);
});

test('reflectRepeaterMirrorEndAxisIndex: O=2 E=3 N=10 → 1', (t) => {
  t.is(reflectRepeaterMirrorEndAxisIndex(2, 3, 10), 1);
});

test('reflectRepeaterMirrorEndAxisIndex: symmetric O=1 E=10 N=10', (t) => {
  t.is(reflectRepeaterMirrorEndAxisIndex(1, 10, 10), 2);
});

test('reflectRepeaterMirrorEndAxisIndex: identity when E=O', (t) => {
  t.is(reflectRepeaterMirrorEndAxisIndex(5, 5, 10), 5);
});

test('getMirrorPlaceForRepeaterPrimary', (t) => {
  const gid = 'g' as import('../src/lib/evolu-db.ts').PlaceId;
  const p1 = 'p1' as import('../src/lib/evolu-db.ts').PlaceId;
  const m1 = 'm1' as import('../src/lib/evolu-db.ts').PlaceId;
  const places = [
    { id: p1, repeaterEchoGroupId: gid, repeaterMirrorOfPlaceId: null },
    { id: m1, repeaterEchoGroupId: gid, repeaterMirrorOfPlaceId: p1 },
  ];
  t.is(getMirrorPlaceForRepeaterPrimary(p1, places), m1);
  t.is(getMirrorPlaceForRepeaterPrimary(m1, places), null);
});

test('filterRepeaterEchoPrimaries', (t) => {
  const gid = 'g' as import('../src/lib/evolu-db.ts').PlaceId;
  const p1 = 'p1' as import('../src/lib/evolu-db.ts').PlaceId;
  const m1 = 'm1' as import('../src/lib/evolu-db.ts').PlaceId;
  const places = [
    { id: p1, repeaterEchoGroupId: gid, repeaterMirrorOfPlaceId: null },
    { id: m1, repeaterEchoGroupId: gid, repeaterMirrorOfPlaceId: p1 },
  ];
  const prim = filterRepeaterEchoPrimaries(places, gid);
  t.is(prim.length, 1);
  const p0 = prim[0];
  t.ok(p0);
  t.is(p0.id, p1);
});
