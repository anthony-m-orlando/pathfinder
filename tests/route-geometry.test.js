import test from 'node:test';
import assert from 'node:assert/strict';
import { getRouteCoordinateLines } from '../scripts/route-geometry.js';

const stops = [
  { lat: 40.6, lon: -75.5 },
  { lat: 40.8, lon: -75.7 },
];

test('uses GeoJSON longitude-latitude coordinate order', () => {
  assert.deepEqual(
    getRouteCoordinateLines([[-75.5, 40.6], [-75.6, 40.7], [-75.7, 40.8]], stops),
    [[[40.6, -75.5], [40.7, -75.6], [40.8, -75.7]]],
  );
});

test('corrects latitude-longitude coordinates when they better match the stop endpoints', () => {
  assert.deepEqual(
    getRouteCoordinateLines([[40.6, -75.5], [40.7, -75.6], [40.8, -75.7]], stops),
    [[[40.6, -75.5], [40.7, -75.6], [40.8, -75.7]]],
  );
});

test('preserves GeoJSON MultiLineString segments', () => {
  assert.deepEqual(
    getRouteCoordinateLines([[[-75.5, 40.6], [-75.6, 40.7]], [[-75.6, 40.7], [-75.7, 40.8]]], stops),
    [
      [[40.6, -75.5], [40.7, -75.6]],
      [[40.7, -75.6], [40.8, -75.7]],
    ],
  );
});

test('rejects coordinates outside valid latitude/longitude ranges', () => {
  assert.throws(
    () => getRouteCoordinateLines([[200, 300], [400, 500]], stops),
    /outside valid latitude\/longitude ranges/,
  );
});
