/**
 * Index pairs for repeating line segments between two echo groups on a circular repeater,
 * after both lists are rotated so the user-selected origin and termination are at index 0.
 *
 * Coherence:
 * - Equal sizes: parallel pairing (i, i).
 * - Termination count is a multiple of origin count: (i, i * k) with k = Le / Lo.
 * - Origin count is a multiple of termination count: (i * k, i) with k = Lo / Le.
 * - Otherwise: single segment only (0, 0).
 */
export function getRepeaterEchoSegmentIndexPairs(
  Lo: number,
  Le: number,
): Array<[number, number]> {
  if (Lo <= 0 || Le <= 0) return [];
  if (Lo === Le) {
    return Array.from({ length: Lo }, (_, i) => [i, i] as [number, number]);
  }
  if (Le % Lo === 0) {
    const k = Le / Lo;
    return Array.from({ length: Lo }, (_, i) => [i, i * k] as [number, number]);
  }
  if (Lo % Le === 0) {
    const k = Lo / Le;
    return Array.from({ length: Le }, (_, i) => [i * k, i] as [number, number]);
  }
  return [[0, 0]];
}
