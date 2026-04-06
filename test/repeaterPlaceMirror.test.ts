import test from 'brittle';
import type {
  LineSegmentEndId,
  LineSegmentId,
  PlaceId,
} from '../src/lib/evolu-db.ts';
import {
  collectLineSegmentIdsForPlaces,
  repeaterMirrorCanEnable,
  repeaterMirrorPlaceAngles,
} from '../src/lib/repeaterPlaceMirror.ts';

test('repeaterMirrorCanEnable: finite perpendicular offset', (t) => {
  t.ok(repeaterMirrorCanEnable(0));
  t.ok(repeaterMirrorCanEnable(16));
  t.ok(repeaterMirrorCanEnable(-50));
  t.ok(repeaterMirrorCanEnable(0.001));
});

test('repeaterMirrorCanEnable: null, undefined, or non-finite', (t) => {
  t.absent(repeaterMirrorCanEnable(null));
  t.absent(repeaterMirrorCanEnable(undefined));
  t.absent(repeaterMirrorCanEnable(Number.NaN));
});

test('repeaterMirrorPlaceAngles: opposite signs for pair', (t) => {
  const a = repeaterMirrorPlaceAngles(5);
  t.is(a.primary, -a.mirror);
  const b = repeaterMirrorPlaceAngles(-3);
  t.is(b.primary, -b.mirror);
});

test('collectLineSegmentIdsForPlaces expands echo group', (t) => {
  const p1 = 'p1' as PlaceId;
  const p2 = 'p2' as PlaceId;
  const e1 = 'e1' as LineSegmentEndId;
  const e2 = 'e2' as LineSegmentEndId;
  const e3 = 'e3' as LineSegmentEndId;
  const e4 = 'e4' as LineSegmentEndId;
  const s1 = 's1' as LineSegmentId;
  const s2 = 's2' as LineSegmentId;
  const segments = [
    { id: s1, endAId: e1, endBId: e2, repeaterLineSegmentEchoGroupId: s1 },
    { id: s2, endAId: e3, endBId: e4, repeaterLineSegmentEchoGroupId: s1 },
  ];
  const ends = [
    { id: e1, placeId: p1 },
    { id: e2, placeId: p2 },
    { id: e3, placeId: p1 },
    { id: e4, placeId: p2 },
  ];
  const ids = collectLineSegmentIdsForPlaces(new Set([p1]), segments, ends);
  t.ok(ids.has(s1));
  t.ok(ids.has(s2));
});
