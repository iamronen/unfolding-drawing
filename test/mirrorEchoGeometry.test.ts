import test from 'brittle';
import type {
  AxisId,
  CircularRepeaterId,
  PlaceId,
} from '../src/lib/evolu-db.ts';
import {
  isMirrorOnlyEchoPlace,
  mirrorEchoCircularRepeaterFirstAxisLocalAngle,
  mirrorEchoPlaceAngles,
} from '../src/lib/mirrorEchoGeometry.ts';

const axMirror = 'axis-m' as AxisId;
const axRepeater = 'axis-r' as AxisId;
const pid = 'place-1' as PlaceId;

test('isMirrorOnlyEchoPlace: mirror axis without circular repeater', (t) => {
  const place = {
    id: pid,
    parentAxisId: axMirror,
    repeaterEchoGroupId: pid,
  };
  const axes = [{ id: axMirror, isMirror: 1, circularRepeaterId: null }];
  t.ok(isMirrorOnlyEchoPlace(place, axes));
});

test('isMirrorOnlyEchoPlace: false when no echo group', (t) => {
  const place = { id: pid, parentAxisId: axMirror, repeaterEchoGroupId: null };
  const axes = [{ id: axMirror, isMirror: 1, circularRepeaterId: null }];
  t.absent(isMirrorOnlyEchoPlace(place, axes));
});

test('isMirrorOnlyEchoPlace: false when axis is circular repeater', (t) => {
  const place = {
    id: pid,
    parentAxisId: axRepeater,
    repeaterEchoGroupId: pid,
  };
  const axes = [
    {
      id: axRepeater,
      isMirror: 1,
      circularRepeaterId: 'cr-1' as CircularRepeaterId,
    },
  ];
  t.absent(isMirrorOnlyEchoPlace(place, axes));
});

test('isMirrorOnlyEchoPlace: false when not mirror', (t) => {
  const place = {
    id: pid,
    parentAxisId: axMirror,
    repeaterEchoGroupId: pid,
  };
  const axes = [{ id: axMirror, isMirror: 0, circularRepeaterId: null }];
  t.absent(isMirrorOnlyEchoPlace(place, axes));
});

test('mirrorEchoPlaceAngles: first and echo are opposite (π apart)', (t) => {
  const pos = mirrorEchoPlaceAngles(5);
  t.is(pos.first, -pos.echo);
  const neg = mirrorEchoPlaceAngles(-3);
  t.is(neg.first, -neg.echo);
});

test('mirrorEchoPlaceAngles: sign by side of axis', (t) => {
  const pos = mirrorEchoPlaceAngles(1);
  t.is(pos.first, -Math.PI / 2);
  t.is(pos.echo, Math.PI / 2);
  const neg = mirrorEchoPlaceAngles(-1);
  t.is(neg.first, Math.PI / 2);
  t.is(neg.echo, -Math.PI / 2);
});

test('mirrorEchoCircularRepeaterFirstAxisLocalAngle: mirror-only echo hub uses 0', (t) => {
  const place = {
    id: pid,
    parentAxisId: axMirror,
    repeaterEchoGroupId: pid,
  };
  const axes = [{ id: axMirror, isMirror: 1, circularRepeaterId: null }];
  t.is(mirrorEchoCircularRepeaterFirstAxisLocalAngle(place, axes), 0);
});

test('mirrorEchoCircularRepeaterFirstAxisLocalAngle: default -π/2 on repeater arm', (t) => {
  const place = {
    id: pid,
    parentAxisId: axRepeater,
    repeaterEchoGroupId: pid,
  };
  const axes = [
    {
      id: axRepeater,
      isMirror: 1,
      circularRepeaterId: 'cr-1' as CircularRepeaterId,
    },
  ];
  t.is(
    mirrorEchoCircularRepeaterFirstAxisLocalAngle(place, axes),
    -Math.PI / 2,
  );
});
