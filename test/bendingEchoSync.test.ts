import test from 'brittle';
import {
  bendCircleFromStoredRowAndChord,
  bendingOffsetsForSegmentEnd,
  getBendingSiblingFieldIds,
  getLineSegmentsInEchoGroup,
  resolveBendCircleForSegmentEnd,
} from '../src/lib/bendingEchoSync.ts';
import type {
  BendingCircularFieldId,
  LineSegmentEndId,
  LineSegmentId,
} from '../src/lib/evolu-db.ts';

const sid = (n: string) => n as LineSegmentId;
const eid = (n: string) => n as LineSegmentEndId;
const bid = (n: string) => n as BendingCircularFieldId;

test('getLineSegmentsInEchoGroup: canonical and echoes', (t) => {
  const s1 = sid('s1');
  const s2 = sid('s2');
  const segs = [
    {
      id: s1,
      endAId: eid('a1'),
      endBId: eid('b1'),
      repeaterLineSegmentEchoGroupId: s1,
    },
    {
      id: s2,
      endAId: eid('a2'),
      endBId: eid('b2'),
      repeaterLineSegmentEchoGroupId: s1,
    },
  ];
  const g = getLineSegmentsInEchoGroup(s2, segs);
  t.is(g.length, 2);
});

test('getBendingSiblingFieldIds: all endA in group', (t) => {
  const s1 = sid('s1');
  const s2 = sid('s2');
  const a1 = eid('ea1');
  const a2 = eid('ea2');
  const b1 = eid('eb1');
  const b2 = eid('eb2');
  const segs = [
    { id: s1, endAId: a1, endBId: b1, repeaterLineSegmentEchoGroupId: s1 },
    { id: s2, endAId: a2, endBId: b2, repeaterLineSegmentEchoGroupId: s1 },
  ];
  const bends = [
    { id: bid('bf1'), lineSegmentEndId: a1 },
    { id: bid('bf2'), lineSegmentEndId: a2 },
  ];
  const ids = getBendingSiblingFieldIds(a1, segs, bends);
  t.is(ids.length, 2);
  t.ok(ids.includes(bid('bf1')));
  t.ok(ids.includes(bid('bf2')));
});

test('getBendingSiblingFieldIds: endB only', (t) => {
  const s1 = sid('s1');
  const s2 = sid('s2');
  const a1 = eid('ea1');
  const a2 = eid('ea2');
  const b1 = eid('eb1');
  const b2 = eid('eb2');
  const segs = [
    { id: s1, endAId: a1, endBId: b1, repeaterLineSegmentEchoGroupId: s1 },
    { id: s2, endAId: a2, endBId: b2, repeaterLineSegmentEchoGroupId: s1 },
  ];
  const bends = [
    { id: bid('bfa'), lineSegmentEndId: a1 },
    { id: bid('bfb1'), lineSegmentEndId: b1 },
    { id: bid('bfb2'), lineSegmentEndId: b2 },
  ];
  const ids = getBendingSiblingFieldIds(b1, segs, bends);
  t.is(ids.length, 2);
  t.ok(ids.includes(bid('bfb1')));
  t.ok(ids.includes(bid('bfb2')));
});

test('bendingOffsetsForSegmentEnd matches toggle formulas', (t) => {
  const dx = 3;
  const dy = 4;
  const L = 5;
  const r = 10;
  const a = bendingOffsetsForSegmentEnd(dx, dy, r, true);
  t.is(a.offsetX, r * (-dy / L));
  t.is(a.offsetY, r * (dx / L));
  const b = bendingOffsetsForSegmentEnd(dx, dy, r, false);
  t.is(b.offsetX, r * (dy / L));
  t.is(b.offsetY, r * (-dx / L));
});

test('resolveBendCircleForSegmentEnd: fallback from sibling endA when echo missing in map', (t) => {
  const s1 = sid('s1');
  const s2 = sid('s2');
  const a1 = eid('ea1');
  const a2 = eid('ea2');
  const b1 = eid('eb1');
  const b2 = eid('eb2');
  const segs = [
    { id: s1, endAId: a1, endBId: b1, repeaterLineSegmentEchoGroupId: s1 },
    { id: s2, endAId: a2, endBId: b2, repeaterLineSegmentEchoGroupId: s1 },
  ];
  const r = 10;
  const off = bendingOffsetsForSegmentEnd(30, 40, r, true);
  const bendRowByEndId = new Map([[a1, { offsetX: off.offsetX, offsetY: off.offsetY, radius: r }]]);
  const segPos = { x1: 0, y1: 0, x2: 30, y2: 40 };
  const resolved = resolveBendCircleForSegmentEnd(
    s2,
    a2,
    b2,
    true,
    segPos,
    segs,
    bendRowByEndId,
  );
  t.ok(resolved != null);
  t.is(resolved!.endX, 0);
  t.is(resolved!.endY, 0);
  t.is(resolved!.radius, r);
  t.is(resolved!.centerX, 0 + off.offsetX);
  t.is(resolved!.centerY, 0 + off.offsetY);
});

test('resolveBendCircleForSegmentEnd: direct row is projected onto chord', (t) => {
  const s1 = sid('s1');
  const s2 = sid('s2');
  const a1 = eid('ea1');
  const a2 = eid('ea2');
  const b1 = eid('eb1');
  const b2 = eid('eb2');
  const segs = [
    { id: s1, endAId: a1, endBId: b1, repeaterLineSegmentEchoGroupId: s1 },
    { id: s2, endAId: a2, endBId: b2, repeaterLineSegmentEchoGroupId: s1 },
  ];
  const r = 12;
  const rowA2 = { offsetX: 3, offsetY: 4, radius: r };
  const seg = { x1: 99, y1: 99, x2: 1, y2: 1 };
  const bendRowByEndId = new Map([[a2, rowA2]]);
  const out = resolveBendCircleForSegmentEnd(
    s2,
    a2,
    b2,
    true,
    seg,
    segs,
    bendRowByEndId,
  );
  const expected = bendCircleFromStoredRowAndChord(rowA2, seg, true);
  t.is(out?.centerX, expected.centerX);
  t.is(out?.centerY, expected.centerY);
  t.is(out?.endX, expected.endX);
  t.is(out?.endY, expected.endY);
  t.is(out?.radius, expected.radius);
});

test('bendCircleFromStoredRowAndChord: normalizes drifted offset to radius', (t) => {
  const seg = { x1: 0, y1: 0, x2: 30, y2: 40 };
  const r = 10;
  const bc = bendCircleFromStoredRowAndChord(
    { offsetX: -16, offsetY: 12, radius: r },
    seg,
    true,
  );
  const dist = Math.hypot(bc.centerX - bc.endX, bc.centerY - bc.endY);
  t.ok(Math.abs(dist - r) < 1e-9);
});
