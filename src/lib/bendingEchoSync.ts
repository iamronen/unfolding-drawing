import type {
  BendingCircularFieldId,
  LineSegmentEndId,
  LineSegmentId,
} from './evolu-db';
import type { BendCircle } from './bentSegmentPath';

export type LineSegmentEchoRow = {
  id: LineSegmentId;
  endAId: LineSegmentEndId | null;
  endBId: LineSegmentEndId | null;
  repeaterLineSegmentEchoGroupId?: LineSegmentId | null;
};

export type BendingFieldEchoRow = {
  id: BendingCircularFieldId;
  lineSegmentEndId: LineSegmentEndId | null;
};

/** Same membership rule as App `getLineSegmentsInEchoGroup`. */
export function getLineSegmentsInEchoGroup(
  segmentId: LineSegmentId,
  segmentsList: ReadonlyArray<LineSegmentEchoRow>,
): LineSegmentEchoRow[] {
  const seg = segmentsList.find((s) => s.id === segmentId);
  if (!seg) return [];
  const groupId =
    (seg as { repeaterLineSegmentEchoGroupId?: LineSegmentId | null })
      .repeaterLineSegmentEchoGroupId ?? seg.id;
  return segmentsList.filter(
    (s) =>
      s.id === groupId ||
      (s as { repeaterLineSegmentEchoGroupId?: LineSegmentId | null })
        .repeaterLineSegmentEchoGroupId === groupId,
  ) as LineSegmentEchoRow[];
}

/**
 * All bending field ids on the same logical end (all endA or all endB) across a line-segment echo group.
 */
export function getBendingSiblingFieldIds(
  lineSegmentEndId: LineSegmentEndId,
  segmentsList: ReadonlyArray<LineSegmentEchoRow>,
  bendingFields: ReadonlyArray<BendingFieldEchoRow>,
): BendingCircularFieldId[] {
  const seg = segmentsList.find(
    (s) => s.endAId === lineSegmentEndId || s.endBId === lineSegmentEndId,
  );
  if (!seg) return [];
  const atEndA = seg.endAId === lineSegmentEndId;
  const group = getLineSegmentsInEchoGroup(seg.id, segmentsList);
  const endIds = new Set<LineSegmentEndId>();
  for (const s of group) {
    const eid = atEndA ? s.endAId : s.endBId;
    if (eid != null) endIds.add(eid);
  }
  const out: BendingCircularFieldId[] = [];
  for (const b of bendingFields) {
    if (b.lineSegmentEndId != null && endIds.has(b.lineSegmentEndId))
      out.push(b.id);
  }
  return out;
}

/** Match `onToggleBendAtA` / `onToggleBendAtB` in App.tsx. */
export function bendingOffsetsForSegmentEnd(
  dx: number,
  dy: number,
  radius: number,
  atEndA: boolean,
): { offsetX: number; offsetY: number } {
  const L = Math.hypot(dx, dy) || 1;
  if (atEndA) {
    return {
      offsetX: radius * (-dy / L),
      offsetY: radius * (dx / L),
    };
  }
  return {
    offsetX: radius * (dy / L),
    offsetY: radius * (-dx / L),
  };
}

/** Stored bending field geometry (from `bendingCircularField` rows). */
export type BendingFieldOffsetRow = {
  offsetX: number;
  offsetY: number;
  radius: number;
};

/**
 * Build a {@link BendCircle} for path rendering using **this segment's chord** endpoints
 * plus stored DB offsets. Normalizes the offset vector to length `radius` so the endpoint
 * lies exactly on the circle — `buildBentSegmentPath` uses `circleIntersectsSegment`,
 * which fails when place-based end coords drift from the drawn chord (common on echoes).
 */
export function bendCircleFromStoredRowAndChord(
  row: BendingFieldOffsetRow,
  seg: { x1: number; y1: number; x2: number; y2: number },
  atEndA: boolean,
): BendCircle {
  const endX = atEndA ? seg.x1 : seg.x2;
  const endY = atEndA ? seg.y1 : seg.y2;
  const r = Number(row.radius);
  let ox = Number(row.offsetX);
  let oy = Number(row.offsetY);
  const len = Math.hypot(ox, oy);
  if (len > 1e-10) {
    ox = (ox / len) * r;
    oy = (oy / len) * r;
  } else {
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;
    const fb = bendingOffsetsForSegmentEnd(dx, dy, r, atEndA);
    ox = fb.offsetX;
    oy = fb.offsetY;
  }
  return {
    endX,
    endY,
    centerX: endX + ox,
    centerY: endY + oy,
    radius: r,
  };
}

/**
 * Bend circle for one end of a line segment, for rendering / hit-testing.
 * Uses raw `bendingCircularField` offset rows keyed by `lineSegmentEndId` (not
 * place-derived {@link BendCircle}s), then {@link bendCircleFromStoredRowAndChord}.
 * If no row for this end, falls back to any sibling in the repeater echo group with the
 * same end role (all endA or all endB), matching `syncBendingFieldSiblingsRadius`.
 */
export function resolveBendCircleForSegmentEnd(
  segmentId: LineSegmentId,
  endAId: LineSegmentEndId | null,
  endBId: LineSegmentEndId | null,
  atEndA: boolean,
  segPos: { x1: number; y1: number; x2: number; y2: number },
  segmentsList: ReadonlyArray<LineSegmentEchoRow>,
  bendRowByEndId: ReadonlyMap<LineSegmentEndId, BendingFieldOffsetRow>,
): BendCircle | undefined {
  const endId = atEndA ? endAId : endBId;
  if (endId == null) return undefined;
  const direct = bendRowByEndId.get(endId);
  if (direct) return bendCircleFromStoredRowAndChord(direct, segPos, atEndA);

  const group = getLineSegmentsInEchoGroup(segmentId, segmentsList);
  if (group.length <= 1) return undefined;

  let refRow: BendingFieldOffsetRow | undefined;
  if (atEndA) {
    for (const s of group) {
      if (s.endAId == null) continue;
      const row = bendRowByEndId.get(s.endAId);
      if (row) {
        refRow = row;
        break;
      }
    }
  } else {
    for (const s of group) {
      if (s.endBId == null) continue;
      const row = bendRowByEndId.get(s.endBId);
      if (row) {
        refRow = row;
        break;
      }
    }
  }
  if (!refRow) return undefined;

  const dx = segPos.x2 - segPos.x1;
  const dy = segPos.y2 - segPos.y1;
  const r = refRow.radius;
  const { offsetX, offsetY } = bendingOffsetsForSegmentEnd(dx, dy, r, atEndA);
  return bendCircleFromStoredRowAndChord(
    { offsetX, offsetY, radius: r },
    segPos,
    atEndA,
  );
}
