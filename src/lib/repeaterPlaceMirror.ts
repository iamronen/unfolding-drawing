import type { LineSegmentEndId, LineSegmentId, PlaceId } from './evolu-db';
import { mirrorEchoPlaceAngles } from './mirrorEchoGeometry.ts';

/**
 * Whether repeater mirror is allowed for a given perpendicular offset from the axis.
 * On-axis (0) and off-axis both allow mirror; only unknown/null distance disables it.
 */
export function repeaterMirrorCanEnable(
  distanceFromAxis: number | null | undefined,
): boolean {
  if (distanceFromAxis == null) return false;
  return Number.isFinite(distanceFromAxis);
}

/**
 * Local place.angle for primary vs mirror row across a repeater arm (same convention as mirror-axis echo).
 */
export function repeaterMirrorPlaceAngles(perp: number): {
  primary: number;
  mirror: number;
} {
  const { first, echo } = mirrorEchoPlaceAngles(perp);
  return { primary: first, mirror: echo };
}

export type LineSegmentRow = {
  id: LineSegmentId;
  endAId: LineSegmentEndId | null;
  endBId: LineSegmentEndId | null;
  repeaterLineSegmentEchoGroupId?: LineSegmentId | null;
};

export type LineSegmentEndRow = {
  id: LineSegmentEndId;
  placeId: PlaceId | null;
};

/**
 * Collect segment ids to soft-delete: any segment touching `placeIds`, expanded by repeater line echo group.
 */
export function collectLineSegmentIdsForPlaces(
  placeIds: ReadonlySet<PlaceId>,
  segmentsList: ReadonlyArray<LineSegmentRow>,
  endsList: ReadonlyArray<LineSegmentEndRow>,
): Set<LineSegmentId> {
  const touching = new Set<LineSegmentId>();
  for (const seg of segmentsList) {
    if (seg.endAId == null || seg.endBId == null) continue;
    const a = endsList.find((e) => e.id === seg.endAId);
    const b = endsList.find((e) => e.id === seg.endBId);
    if (
      (a?.placeId != null && placeIds.has(a.placeId)) ||
      (b?.placeId != null && placeIds.has(b.placeId))
    ) {
      touching.add(seg.id);
    }
  }
  const expanded = new Set<LineSegmentId>();
  for (const id of touching) {
    const seg = segmentsList.find((s) => s.id === id);
    if (!seg) continue;
    const groupId =
      (seg as { repeaterLineSegmentEchoGroupId?: LineSegmentId | null })
        .repeaterLineSegmentEchoGroupId ?? seg.id;
    for (const s of segmentsList) {
      const g =
        (s as { repeaterLineSegmentEchoGroupId?: LineSegmentId | null })
          .repeaterLineSegmentEchoGroupId ?? s.id;
      if (s.id === groupId || g === groupId) expanded.add(s.id);
    }
  }
  return expanded;
}
