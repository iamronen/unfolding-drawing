import type { AxisId, CircularRepeaterId, PlaceId } from './evolu-db';

/** Minimal place shape for walking parent chain to find axis. */
export type EchoPlaceLike = {
  id: PlaceId;
  parentAxisId?: AxisId | null;
  parentId?: PlaceId | null;
};

/** Axis id for a place in a repeater echo group (the place or an ancestor has parentAxisId). */
export function getAxisIdForEcho(
  place: EchoPlaceLike,
  placesList: ReadonlyArray<EchoPlaceLike>,
): AxisId | null {
  if (place.parentAxisId != null) return place.parentAxisId;
  if (place.parentId == null) return null;
  const parent = placesList.find((p) => p.id === place.parentId);
  return parent ? getAxisIdForEcho(parent, placesList) : null;
}

/** Axis row enough to resolve the hub place for a circular repeater arm. */
export type AxisHubLike = {
  id: AxisId;
  placeId: PlaceId;
};

/**
 * Place id of the circular-repeater center (axis.placeId) for the repeater axis
 * this echo place sits on. Used to partition mirror arms when the same
 * repeaterEchoGroupId spans two hubs.
 */
export function getCircularRepeaterHubPlaceId(
  place: EchoPlaceLike,
  placesList: ReadonlyArray<EchoPlaceLike>,
  axesList: ReadonlyArray<AxisHubLike>,
): PlaceId | null {
  const axisId = getAxisIdForEcho(place, placesList);
  if (axisId == null) return null;
  const axis = axesList.find((a) => a.id === axisId);
  return axis?.placeId ?? null;
}

/**
 * Keep only echoes on the same circular-repeater hub as the anchor place.
 * If the anchor has no hub, returns a copy of echoes unchanged.
 */
export function filterEchoesBySameRepeaterHub<T extends EchoPlaceLike>(
  echoes: ReadonlyArray<T>,
  anchorPlaceId: PlaceId,
  placesList: ReadonlyArray<EchoPlaceLike>,
  axesList: ReadonlyArray<AxisHubLike>,
): T[] {
  const anchor = placesList.find((p) => p.id === anchorPlaceId);
  if (!anchor) return [...echoes];
  const hub = getCircularRepeaterHubPlaceId(anchor, placesList, axesList);
  if (hub == null) return [...echoes];
  return echoes.filter(
    (p) => getCircularRepeaterHubPlaceId(p, placesList, axesList) === hub,
  );
}

export type AxisWithRepeaterLike = AxisHubLike & {
  circularRepeaterId?: CircularRepeaterId | null;
  /** Used for stable ordering within one repeater (same as App circularRepeaterAxisNumber). */
  angle?: unknown;
};

/**
 * 1-based axis index for a place's repeater axis, using that axis's own
 * `circularRepeaterId`. Use when comparing echoes across mirror hubs where
 * each hub has a different repeater row id.
 */
export function circularRepeaterAxisNumberForPlace(
  placeId: PlaceId,
  placesList: ReadonlyArray<EchoPlaceLike>,
  axesList: ReadonlyArray<AxisWithRepeaterLike>,
): number {
  const place = placesList.find((p) => p.id === placeId);
  if (!place) return -1;
  const ax = getAxisIdForEcho(place, placesList);
  if (ax == null) return -1;
  const axisRow = axesList.find((a) => a.id === ax);
  const repId = axisRow?.circularRepeaterId;
  if (repId == null) return -1;
  const repAxes = axesList.filter((a) => a.circularRepeaterId === repId);
  const sorted = [...repAxes].sort((a, b) => Number(a.angle) - Number(b.angle));
  const idx = sorted.findIndex((a) => a.id === ax);
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * If exactly two distinct hub places host this circular repeater, return the
 * one that is not `hubPlaceId`. Used to mirror add-line-segment across a mirror pair.
 */
export function getOtherCircularRepeaterHubPlaceId(
  hubPlaceId: PlaceId,
  circularRepeaterId: CircularRepeaterId,
  axesList: ReadonlyArray<AxisWithRepeaterLike>,
): PlaceId | null {
  const hubs = new Set<PlaceId>();
  for (const a of axesList) {
    if (a.circularRepeaterId === circularRepeaterId) {
      hubs.add(a.placeId);
    }
  }
  if (hubs.size !== 2) return null;
  if (!hubs.has(hubPlaceId)) return null;
  for (const h of hubs) {
    if (h !== hubPlaceId) return h;
  }
  return null;
}

export type EchoPlaceWithGroupLike = EchoPlaceLike & {
  repeaterEchoGroupId?: PlaceId | null;
};

/** Row shape for pairing mirror repeaters (canonical + echo rows). */
export type CircularRepeaterRowLike = {
  id: CircularRepeaterId;
  placeId: PlaceId;
  repeaterEchoGroupId?: CircularRepeaterId | null;
};

/**
 * Repeater ids in the same mirror echo group: canonical id plus rows whose
 * repeaterEchoGroupId points at that canonical id. Each row has its own id
 * and axes use that id — so two hubs share a logical repeater but different
 * circularRepeaterId values on axes.
 */
export function getCircularRepeaterIdsInEchoGroup(
  repeaterId: CircularRepeaterId,
  rows: ReadonlyArray<CircularRepeaterRowLike>,
): CircularRepeaterId[] {
  const repeater = rows.find((r) => r.id === repeaterId);
  if (!repeater) return [repeaterId];
  const canonicalId = repeater.repeaterEchoGroupId ?? repeater.id;
  return rows
    .filter(
      (r) =>
        r.id === canonicalId || (r.repeaterEchoGroupId ?? null) === canonicalId,
    )
    .map((r) => r.id);
}

/**
 * Same as getOtherCircularRepeaterHubPlaceId when exactly two hub places host
 * the same circularRepeaterId on axes. Otherwise:
 * - If `circularRepeatersList` is provided, partner hub is the other
 *   `circularRepeater.placeId` in the same echo group (mirror repeaters).
 * - Else fall back to a place with the same `repeaterEchoGroupId` whose hub
 *   has a repeater axis (legacy same-id axes on sibling hub).
 */
export function getMirrorPartnerRepeaterHubPlaceId(
  hubPlaceId: PlaceId,
  circularRepeaterId: CircularRepeaterId,
  placesList: ReadonlyArray<EchoPlaceWithGroupLike>,
  axesList: ReadonlyArray<AxisWithRepeaterLike>,
  circularRepeatersList?: ReadonlyArray<CircularRepeaterRowLike> | null,
): PlaceId | null {
  const fromAxes = getOtherCircularRepeaterHubPlaceId(
    hubPlaceId,
    circularRepeaterId,
    axesList,
  );
  if (fromAxes != null) return fromAxes;

  const groupIds =
    circularRepeatersList != null && circularRepeatersList.length > 0
      ? new Set(
          getCircularRepeaterIdsInEchoGroup(
            circularRepeaterId,
            circularRepeatersList,
          ),
        )
      : null;

  if (groupIds != null) {
    const hubPlaceIds = new Set<PlaceId>();
    for (const rid of groupIds) {
      const row = circularRepeatersList?.find((r) => r.id === rid);
      if (row) hubPlaceIds.add(row.placeId);
    }
    if (hubPlaceIds.size === 2 && hubPlaceIds.has(hubPlaceId)) {
      for (const h of hubPlaceIds) {
        if (h !== hubPlaceId) return h;
      }
    }
  }

  const hubPlace = placesList.find((p) => p.id === hubPlaceId);
  const g = hubPlace?.repeaterEchoGroupId;
  if (g == null) return null;
  const siblings = placesList.filter(
    (p) => p.repeaterEchoGroupId === g && p.id !== hubPlaceId,
  );
  for (const s of siblings) {
    const hasRepAxis = axesList.some((a) => {
      if (a.placeId !== s.id || a.circularRepeaterId == null) return false;
      if (groupIds != null) return groupIds.has(a.circularRepeaterId);
      return a.circularRepeaterId === circularRepeaterId;
    });
    if (hasRepAxis) return s.id;
  }
  return null;
}
