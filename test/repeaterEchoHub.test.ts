import test from 'brittle';
import {
  circularRepeaterAxisNumberForPlace,
  filterEchoesBySameRepeaterHub,
  getCircularRepeaterHubPlaceId,
  getCircularRepeaterIdsInEchoGroup,
  getMirrorPartnerRepeaterHubPlaceId,
  getOtherCircularRepeaterHubPlaceId,
} from '../src/lib/echoPlaceAxis.ts';
import type {
  AxisId,
  CircularRepeaterId,
  PlaceId,
} from '../src/lib/evolu-db.ts';

const axL1 = 'axis-L-1' as AxisId;
const axL2 = 'axis-L-2' as AxisId;
const axR1 = 'axis-R-1' as AxisId;
const axR2 = 'axis-R-2' as AxisId;
const hubL = 'hub-left' as PlaceId;
const hubR = 'hub-right' as PlaceId;
const g = 'group-1' as PlaceId;

const axesList = [
  { id: axL1, placeId: hubL },
  { id: axL2, placeId: hubL },
  { id: axR1, placeId: hubR },
  { id: axR2, placeId: hubR },
];

test('getCircularRepeaterHubPlaceId: hub from axis.placeId', (t) => {
  const pL = {
    id: 'p-L1' as PlaceId,
    parentAxisId: axL1,
    parentId: null,
  };
  t.is(getCircularRepeaterHubPlaceId(pL, [pL], axesList), hubL);
  const pR = {
    id: 'p-R1' as PlaceId,
    parentAxisId: axR1,
    parentId: null,
  };
  t.is(getCircularRepeaterHubPlaceId(pR, [pR], axesList), hubR);
});

test('filterEchoesBySameRepeaterHub: splits two mirror arms', (t) => {
  const places = [
    { id: 'p-L1' as PlaceId, parentAxisId: axL1, repeaterEchoGroupId: g },
    { id: 'p-L2' as PlaceId, parentAxisId: axL2, repeaterEchoGroupId: g },
    { id: 'p-R1' as PlaceId, parentAxisId: axR1, repeaterEchoGroupId: g },
    { id: 'p-R2' as PlaceId, parentAxisId: axR2, repeaterEchoGroupId: g },
  ];
  const left = filterEchoesBySameRepeaterHub(
    places,
    'p-L1' as PlaceId,
    places,
    axesList,
  );
  t.is(left.length, 2);
  const leftIds = new Set(left.map((p) => p.id));
  t.ok(leftIds.has(places[0].id) && leftIds.has(places[1].id));
  const right = filterEchoesBySameRepeaterHub(
    places,
    'p-R2' as PlaceId,
    places,
    axesList,
  );
  t.is(right.length, 2);
  const rightIds = new Set(right.map((p) => p.id));
  t.ok(rightIds.has(places[2].id) && rightIds.has(places[3].id));
});

test('getOtherCircularRepeaterHubPlaceId: two hubs swap', (t) => {
  const rep = 'cr-1' as CircularRepeaterId;
  const axesWithRep = [
    { id: axL1, placeId: hubL, circularRepeaterId: rep },
    { id: axR1, placeId: hubR, circularRepeaterId: rep },
  ];
  t.is(getOtherCircularRepeaterHubPlaceId(hubL, rep, axesWithRep), hubR);
  t.is(getOtherCircularRepeaterHubPlaceId(hubR, rep, axesWithRep), hubL);
  t.absent(
    getOtherCircularRepeaterHubPlaceId(hubL, rep, [
      { id: axL1, placeId: hubL, circularRepeaterId: rep },
    ]),
  );
});

test('getMirrorPartnerRepeaterHubPlaceId: falls back to repeaterEchoGroupId sibling', (t) => {
  const rep = 'cr-2' as CircularRepeaterId;
  // Only one hub placeId on axes — getOther returns null
  const axesOneHubOnly = [
    { id: axL1, placeId: hubL, circularRepeaterId: rep },
    { id: axL2, placeId: hubL, circularRepeaterId: rep },
  ];
  t.absent(getOtherCircularRepeaterHubPlaceId(hubL, rep, axesOneHubOnly));
  const places = [
    { id: hubL, parentAxisId: null, repeaterEchoGroupId: g },
    { id: hubR, parentAxisId: null, repeaterEchoGroupId: g },
  ];
  const axesWithSibling = [
    ...axesOneHubOnly,
    { id: axR1, placeId: hubR, circularRepeaterId: rep },
  ];
  t.is(
    getMirrorPartnerRepeaterHubPlaceId(hubL, rep, places, axesWithSibling),
    hubR,
  );
  t.is(
    getMirrorPartnerRepeaterHubPlaceId(hubR, rep, places, axesWithSibling),
    hubL,
  );
});

test('getCircularRepeaterIdsInEchoGroup: canonical + echo rows', (t) => {
  const r1 = 'rep-a' as CircularRepeaterId;
  const r2 = 'rep-b' as CircularRepeaterId;
  const rows = [
    { id: r1, placeId: hubL, repeaterEchoGroupId: r1 },
    { id: r2, placeId: hubR, repeaterEchoGroupId: r1 },
  ];
  const g1 = getCircularRepeaterIdsInEchoGroup(r1, rows);
  const g2 = getCircularRepeaterIdsInEchoGroup(r2, rows);
  t.is(g1.length, 2);
  t.is(g2.length, 2);
  t.ok(new Set(g1).has(r1) && new Set(g1).has(r2));
});

test('getMirrorPartnerRepeaterHubPlaceId: distinct repeater ids per hub (mirror echo)', (t) => {
  const r1 = 'rep-a' as CircularRepeaterId;
  const r2 = 'rep-b' as CircularRepeaterId;
  const rows = [
    { id: r1, placeId: hubL, repeaterEchoGroupId: r1 },
    { id: r2, placeId: hubR, repeaterEchoGroupId: r1 },
  ];
  const axesMirror = [
    { id: axL1, placeId: hubL, circularRepeaterId: r1, angle: 0 },
    { id: axR1, placeId: hubR, circularRepeaterId: r2, angle: 0 },
  ];
  const placesNoPlaceGroup = [
    { id: hubL, parentAxisId: null, repeaterEchoGroupId: null },
    { id: hubR, parentAxisId: null, repeaterEchoGroupId: null },
  ];
  t.absent(getOtherCircularRepeaterHubPlaceId(hubL, r1, axesMirror));
  t.is(
    getMirrorPartnerRepeaterHubPlaceId(
      hubL,
      r1,
      placesNoPlaceGroup,
      axesMirror,
      rows,
    ),
    hubR,
  );
  t.is(
    getMirrorPartnerRepeaterHubPlaceId(
      hubR,
      r2,
      placesNoPlaceGroup,
      axesMirror,
      rows,
    ),
    hubL,
  );
});

test('circularRepeaterAxisNumberForPlace: per-hub repeater id', (t) => {
  const rL = 'rL' as CircularRepeaterId;
  const rR = 'rR' as CircularRepeaterId;
  const axes = [
    { id: axL1, placeId: hubL, circularRepeaterId: rL, angle: 0 },
    { id: axL2, placeId: hubL, circularRepeaterId: rL, angle: 1 },
    { id: axR1, placeId: hubR, circularRepeaterId: rR, angle: 0 },
    { id: axR2, placeId: hubR, circularRepeaterId: rR, angle: 1 },
  ];
  const pL1 = { id: 'p-L1' as PlaceId, parentAxisId: axL1, parentId: null };
  const pR1 = { id: 'p-R1' as PlaceId, parentAxisId: axR1, parentId: null };
  t.is(circularRepeaterAxisNumberForPlace(pL1.id, [pL1], axes), 1);
  t.is(circularRepeaterAxisNumberForPlace(pR1.id, [pR1], axes), 1);
});

test('filterEchoesBySameRepeaterHub: no hub returns full list', (t) => {
  const places = [{ id: 'p1' as PlaceId, parentAxisId: null, parentId: null }];
  const axes = [{ id: axL1, placeId: hubL }];
  const filtered = filterEchoesBySameRepeaterHub(
    places,
    'p1' as PlaceId,
    places,
    axes,
  );
  t.is(filtered.length, 1);
});
