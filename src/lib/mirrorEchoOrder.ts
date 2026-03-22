import { type EchoPlaceLike, getAxisIdForEcho } from './echoPlaceAxis.ts';
import type { AxisId, PlaceId } from './evolu-db';

type MirrorEchoRow = EchoPlaceLike & {
  distanceFromAxis?: number | null;
  repeaterEchoGroupId?: PlaceId | null;
};

/**
 * Echoes in the same repeater echo group on a mirror-only axis, sorted by
 * distanceFromAxis (nulls last), then id for stability.
 */
export function getEchoesInMirrorAxisOrder<T extends MirrorEchoRow>(
  groupId: PlaceId,
  mirrorAxisId: AxisId,
  placesList: ReadonlyArray<T>,
): T[] {
  const echoes = placesList.filter(
    (p) => (p as MirrorEchoRow).repeaterEchoGroupId === groupId,
  ) as T[];
  const filtered = echoes.filter(
    (p) => getAxisIdForEcho(p, placesList) === mirrorAxisId,
  );
  return [...filtered].sort((a, b) => {
    const da = a.distanceFromAxis;
    const db = b.distanceFromAxis;
    const na = da == null ? Number.POSITIVE_INFINITY : Number(da);
    const nb = db == null ? Number.POSITIVE_INFINITY : Number(db);
    if (na !== nb) return na - nb;
    return String(a.id).localeCompare(String(b.id));
  });
}

/** Mirror axis id for a place that lives on a mirror echo, or null if not mirror. */
export function getMirrorAxisIdForEchoPlace<T extends EchoPlaceLike>(
  placeId: PlaceId,
  placesList: ReadonlyArray<T>,
  axesList: ReadonlyArray<{ id: AxisId; isMirror?: number | null }>,
): AxisId | null {
  const place = placesList.find((p) => p.id === placeId);
  if (!place) return null;
  const axisId = getAxisIdForEcho(place, placesList);
  if (!axisId) return null;
  const axis = axesList.find((a) => a.id === axisId);
  if (!axis || (axis as { isMirror?: number | null }).isMirror !== 1)
    return null;
  return axisId;
}
