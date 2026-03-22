import { getAxisWorldGeometry } from './axisGeometry.ts';
import {
  type AxisWithRepeaterLike,
  type CircularRepeaterRowLike,
  type EchoPlaceWithGroupLike,
  getMirrorPartnerRepeaterHubPlaceId,
} from './echoPlaceAxis.ts';
import type { AxisId, CircularRepeaterId, PlaceId } from './evolu-db.ts';

export type AxisRowLike = {
  id: AxisId;
  placeId: PlaceId;
  angle: unknown;
  circularRepeaterId?: CircularRepeaterId | null;
};

/**
 * Axes belonging to this repeater, sorted by local angle (same as repeater axis index order).
 */
export function getRepeaterAxesSorted(
  circularRepeaterId: CircularRepeaterId,
  axesList: ReadonlyArray<AxisRowLike>,
): AxisRowLike[] {
  return axesList
    .filter((a) => a.circularRepeaterId === circularRepeaterId)
    .sort((a, b) => Number(a.angle) - Number(b.angle));
}

/**
 * World angle of the first (reference) axis of a circular repeater.
 */
export function getRepeaterReferenceAxisWorldAngle(
  circularRepeaterId: CircularRepeaterId,
  axesList: ReadonlyArray<AxisRowLike>,
  placesWithAbs: ReadonlyArray<{
    id: PlaceId;
    absX: number;
    absY: number;
    absWorldAngle: number;
  }>,
): number | null {
  const sorted = getRepeaterAxesSorted(circularRepeaterId, axesList);
  const first = sorted[0];
  if (!first) return null;
  return getAxisWorldGeometry(
    {
      id: first.id,
      placeId: first.placeId,
      angle: Number(first.angle),
    },
    placesWithAbs,
  ).worldAngle;
}

/**
 * +1 for same hub as selected or non-mirror echo hubs; -1 for mirror-partner hub.
 */
export function rotationSignForRepeaterHub(
  hubPlaceId: PlaceId,
  selectedHubPlaceId: PlaceId,
  mirrorPartnerHubPlaceId: PlaceId | null,
): number {
  if (hubPlaceId === selectedHubPlaceId) return 1;
  if (
    mirrorPartnerHubPlaceId != null &&
    hubPlaceId === mirrorPartnerHubPlaceId
  ) {
    return -1;
  }
  return 1;
}

/**
 * Mirror partner hub for the selected repeater hub (null if none).
 */
export function getMirrorPartnerHubForRepeater(
  selectedHubPlaceId: PlaceId,
  circularRepeaterId: CircularRepeaterId,
  placesList: ReadonlyArray<EchoPlaceWithGroupLike>,
  axesList: ReadonlyArray<AxisWithRepeaterLike>,
  circularRepeatersList: ReadonlyArray<CircularRepeaterRowLike>,
): PlaceId | null {
  return getMirrorPartnerRepeaterHubPlaceId(
    selectedHubPlaceId,
    circularRepeaterId,
    placesList,
    axesList,
    circularRepeatersList,
  );
}

/**
 * Per-repeater-id sign for applying rotation delta to all axes of that repeater.
 */
export function rotationSignByRepeaterId(
  groupRepeaterIds: ReadonlyArray<CircularRepeaterId>,
  selectedRepeaterId: CircularRepeaterId,
  circularRepeatersList: ReadonlyArray<{
    id: CircularRepeaterId;
    placeId: PlaceId;
    repeaterEchoGroupId?: CircularRepeaterId | null;
  }>,
  placesList: ReadonlyArray<EchoPlaceWithGroupLike>,
  axesList: ReadonlyArray<AxisWithRepeaterLike>,
): Map<CircularRepeaterId, number> {
  const selectedRow = circularRepeatersList.find(
    (r) => r.id === selectedRepeaterId,
  );
  const selectedHub = selectedRow?.placeId;
  if (selectedHub == null) {
    return new Map(groupRepeaterIds.map((id) => [id, 1]));
  }
  const partnerHub = getMirrorPartnerHubForRepeater(
    selectedHub,
    selectedRepeaterId,
    placesList,
    axesList,
    circularRepeatersList,
  );
  const m = new Map<CircularRepeaterId, number>();
  for (const rid of groupRepeaterIds) {
    const row = circularRepeatersList.find((r) => r.id === rid);
    const hub = row?.placeId;
    if (hub == null) {
      m.set(rid, 1);
      continue;
    }
    m.set(rid, rotationSignForRepeaterHub(hub, selectedHub, partnerHub));
  }
  return m;
}
