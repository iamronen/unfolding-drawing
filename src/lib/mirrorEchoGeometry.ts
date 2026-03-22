import type { AxisId, CircularRepeaterId, PlaceId } from './evolu-db';

export type AxisLike = {
  id: AxisId;
  isMirror?: number | null;
  circularRepeaterId?: CircularRepeaterId | null;
};

export type PlaceEchoLike = {
  id: PlaceId;
  parentAxisId?: AxisId | null;
  repeaterEchoGroupId?: PlaceId | null;
};

/**
 * Mirror-only echo: same-axis mirror pair, not a circular repeater echo group.
 */
export function isMirrorOnlyEchoPlace(
  place: PlaceEchoLike,
  axesList: ReadonlyArray<AxisLike>,
): boolean {
  if (place.repeaterEchoGroupId == null) return false;
  if (place.parentAxisId == null) return false;
  const axis = axesList.find((a) => a.id === place.parentAxisId);
  if (!axis) return false;
  if (axis.isMirror !== 1) return false;
  if (axis.circularRepeaterId != null) return false;
  return true;
}

/**
 * Local `place.angle` offsets (radians) so world orientation is perpendicular to the axis,
 * pointing toward the mirror line: opposite signs on the two sides (π apart in world space).
 */
export function mirrorEchoPlaceAngles(distanceFromAxis: number): {
  first: number;
  echo: number;
} {
  const perp = distanceFromAxis;
  return {
    first: perp > 0 ? -Math.PI / 2 : Math.PI / 2,
    echo: perp > 0 ? Math.PI / 2 : -Math.PI / 2,
  };
}

/**
 * Local angle (radians) of the first circular-repeater axis relative to the hub place,
 * before the `+ 2πk/n` stepping. Mirrors the intent of {@link mirrorEchoPlaceAngles}:
 * on mirror-only echo hubs, hub `place.angle` already orients the place toward the mirror
 * line; the first spoke uses `0` so it aligns with that orientation (paired hubs still
 * face each other because their hub world angles differ by π). Elsewhere the default
 * `-π/2` matches the usual screen-up convention when the hub angle is 0.
 */
export function mirrorEchoCircularRepeaterFirstAxisLocalAngle(
  place: PlaceEchoLike,
  axesList: ReadonlyArray<AxisLike>,
): number {
  if (isMirrorOnlyEchoPlace(place, axesList)) return 0;
  return -Math.PI / 2;
}
