import test from 'brittle';
import { getRepeaterEchoSegmentIndexPairs } from '../src/lib/repeaterLineSegmentPairs.ts';

test('equal sizes: parallel indices', (t) => {
  t.alike(getRepeaterEchoSegmentIndexPairs(3, 3), [
    [0, 0],
    [1, 1],
    [2, 2],
  ]);
});

test('termination multiple of origin: stride k', (t) => {
  t.alike(getRepeaterEchoSegmentIndexPairs(3, 6), [
    [0, 0],
    [1, 2],
    [2, 4],
  ]);
});

test('origin multiple of termination: stride on origin', (t) => {
  t.alike(getRepeaterEchoSegmentIndexPairs(6, 3), [
    [0, 0],
    [2, 1],
    [4, 2],
  ]);
});

test('incoherent sizes: single pair at selection', (t) => {
  t.alike(getRepeaterEchoSegmentIndexPairs(4, 6), [[0, 0]]);
});

test('empty inputs', (t) => {
  t.alike(getRepeaterEchoSegmentIndexPairs(0, 3), []);
  t.alike(getRepeaterEchoSegmentIndexPairs(3, 0), []);
});
