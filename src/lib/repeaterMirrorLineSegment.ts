import type { PlaceId } from './evolu-db';

/** Place row with repeater echo + optional repeater mirror link. */
export type RepeaterEchoPlaceLike = {
  id: PlaceId;
  repeaterEchoGroupId?: PlaceId | null;
  repeaterMirrorOfPlaceId?: PlaceId | null;
};

/**
 * Reflect termination axis index E across origin arm O on a circular repeater with N arms (1-based indices).
 * Mirror segment from mirror(origin@O) should end at the primary place on arm E′.
 */
export function reflectRepeaterMirrorEndAxisIndex(
  o: number,
  e: number,
  n: number,
): number {
  if (n <= 0) return e;
  const raw = 2 * o - e - 1;
  const mod = ((raw % n) + n) % n;
  return mod + 1;
}

export function getMirrorPlaceForRepeaterPrimary(
  primaryId: PlaceId,
  placesList: ReadonlyArray<RepeaterEchoPlaceLike>,
): PlaceId | null {
  const row = placesList.find((p) => p.repeaterMirrorOfPlaceId === primaryId);
  return row?.id ?? null;
}

/** Primary rows in a repeater echo group (not the mirror copy across an arm). */
export function filterRepeaterEchoPrimaries<T extends RepeaterEchoPlaceLike>(
  echoes: ReadonlyArray<T>,
  groupId: PlaceId,
): T[] {
  return echoes.filter(
    (p) =>
      p.repeaterEchoGroupId === groupId && p.repeaterMirrorOfPlaceId == null,
  );
}
