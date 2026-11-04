import test from 'node:test';
import assert from 'node:assert/strict';
import { isShortGoogleMapsLink, parseRouteInput } from '../scripts/route-input.js';

test('parses a Google Maps directions API URL', () => {
  assert.deepEqual(
    parseRouteInput('https://www.google.com/maps/dir/?api=1&origin=Boston%2C%20MA&destination=New%20York%2C%20NY&waypoints=Hartford%2C%20CT%7CNew%20Haven%2C%20CT'),
    ['Boston, MA', 'Hartford, CT', 'New Haven, CT', 'New York, NY'],
  );
});

test('parses a Google Maps directions path', () => {
  assert.deepEqual(
    parseRouteInput('https://www.google.com/maps/dir/Boston,+MA/Providence,+RI/New+York,+NY/@42.1,-71.2,8z'),
    ['Boston, MA', 'Providence, RI', 'New York, NY'],
  );
});

test('parses stops entered one per line', () => {
  assert.deepEqual(parseRouteInput(' Boston, MA \n\nNew York, NY '), ['Boston, MA', 'New York, NY']);
});

test('identifies short Google Maps links for server-side expansion', () => {
  assert.equal(isShortGoogleMapsLink('https://maps.app.goo.gl/example'), true);
  assert.throws(
    () => parseRouteInput('https://maps.app.goo.gl/example'),
    /Could not expand that short Google Maps link/,
  );
});

test('rejects a non-Google URL', () => {
  assert.throws(
    () => parseRouteInput('https://example.com/maps/dir/a/b'),
    /Paste a Google Maps directions link/,
  );
});
