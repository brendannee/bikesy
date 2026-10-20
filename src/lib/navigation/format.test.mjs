import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  bannerText,
  formatClock,
  formatDistance,
  formatDuration,
  formatSpeed,
  stepList,
  thenInstruction,
} from './format.js';

const FEET = 0.3048;
const MILE = 1609.344;

test('formatDistance: under 0.1 mi rounds to 10 ft below 100, 25 ft below 300, else 50 ft', () => {
  assert.equal(formatDistance(0), '10 ft'); // never "0 ft"
  assert.equal(formatDistance(4 * FEET), '10 ft');
  assert.equal(formatDistance(14 * FEET), '10 ft');
  assert.equal(formatDistance(16 * FEET), '20 ft');
  assert.equal(formatDistance(98 * FEET), '100 ft');
  assert.equal(formatDistance(110 * FEET), '100 ft');
  assert.equal(formatDistance(120 * FEET), '125 ft');
  assert.equal(formatDistance(299 * FEET), '300 ft');
  assert.equal(formatDistance(320 * FEET), '300 ft');
  assert.equal(formatDistance(380 * FEET), '400 ft');
});

test('formatDistance: from 0.1 mi up it shows miles, one decimal below 10 mi', () => {
  assert.equal(formatDistance(528 * FEET), '0.1 mi');
  assert.equal(formatDistance(0.5 * MILE), '0.5 mi');
  assert.equal(formatDistance(MILE), '1.0 mi');
  assert.equal(formatDistance(2.46 * MILE), '2.5 mi');
  assert.equal(formatDistance(9.94 * MILE), '9.9 mi');
});

test('formatDistance: 10 mi and over rounds to whole miles', () => {
  assert.equal(formatDistance(10 * MILE), '10 mi');
  assert.equal(formatDistance(12.4 * MILE), '12 mi');
  assert.equal(formatDistance(12.6 * MILE), '13 mi');
});

test('formatDistance spoken: feet and miles as words, singular for exactly 1.0 mile', () => {
  assert.equal(formatDistance(120 * FEET, { spoken: true }), '125 feet');
  assert.equal(formatDistance(800 * FEET, { spoken: true }), '0.2 miles');
  assert.equal(formatDistance(MILE, { spoken: true }), '1 mile');
  assert.equal(formatDistance(1.5 * MILE, { spoken: true }), '1.5 miles');
  assert.equal(formatDistance(12 * MILE, { spoken: true }), '12 miles');
  assert.equal(formatDistance(0, { spoken: true }), '10 feet');
});

test('formatDuration: at least a minute, then minutes, then hours and minutes', () => {
  assert.equal(formatDuration(0), '1 min');
  assert.equal(formatDuration(29), '1 min');
  assert.equal(formatDuration(90), '2 min');
  assert.equal(formatDuration(59 * 60), '59 min');
  assert.equal(formatDuration(59.6 * 60), '1 h 0 min');
  assert.equal(formatDuration(3600), '1 h 0 min');
  assert.equal(formatDuration(5400), '1 h 30 min');
  assert.equal(formatDuration(7384), '2 h 3 min');
});

test('formatClock: hour and two-digit minutes', () => {
  assert.match(formatClock(new Date(2026, 9, 20, 15, 5)), /3.*05/);
});

test('formatSpeed: metres per second as mph with one decimal', () => {
  assert.equal(formatSpeed(0), '0.0 mph');
  assert.equal(formatSpeed(5), '11.2 mph');
  assert.equal(formatSpeed(MILE / 3600), '1.0 mph');
});

test('bannerText: drops the trailing period Valhalla puts on generic instructions', () => {
  assert.equal(bannerText('Bear left.'), 'Bear left');
  assert.equal(bannerText('Continue on the cycleway.'), 'Continue on the cycleway');
  assert.equal(bannerText('Sussex Avenue'), 'Sussex Avenue');
  assert.equal(bannerText('St. Mary'), 'St. Mary');
  assert.equal(bannerText(undefined), '');
});

const content = (maneuverType, maneuverModifier, text) => ({
  primaryContent: { text, maneuverType, maneuverModifier },
});

test('thenInstruction: shows the following maneuver only when it comes within 150 m', () => {
  const navigating = (nextDistance, current = 'turn') => ({
    visualInstruction: content(current, 'right', 'Dunlap Drive'),
    remainingSteps: [
      { distance: 297, visualInstructions: [content(current, 'right', 'Dunlap Drive')] },
      {
        distance: nextDistance,
        visualInstructions: [content('new name', 'left', 'Patricia Lane')],
      },
    ],
  });
  assert.equal(thenInstruction(navigating(68)).text, 'Patricia Lane');
  assert.equal(thenInstruction(navigating(149.9)).text, 'Patricia Lane');
  assert.equal(thenInstruction(navigating(150)), null);
  // Nothing follows the arrival.
  assert.equal(thenInstruction(navigating(10, 'arrive')), null);
});

test('thenInstruction: null when there is no following step or no current instruction', () => {
  assert.equal(thenInstruction(null), null);
  assert.equal(
    thenInstruction({
      visualInstruction: content('turn', 'left', 'A'),
      remainingSteps: [{}],
    }),
    null,
  );
  assert.equal(
    thenInstruction({
      remainingSteps: [
        {},
        { distance: 10, visualInstructions: [content('turn', 'left', 'B')] },
      ],
    }),
    null,
  );
});

test('stepList: icons come from the previous step banner, zero-length steps are skipped but arrival stays', () => {
  const steps = [
    {
      distance: 101,
      roadName: 'Lake Tahoe Boulevard',
      instruction: 'Bike south.',
      visualInstructions: [content('turn', 'right', 'Los Angeles Avenue')],
    },
    {
      distance: 0,
      roadName: 'Los Angeles Avenue',
      instruction: 'Turn right.',
      visualInstructions: [content('turn', 'left', 'X')],
    },
    {
      distance: 23,
      roadName: 'Los Angeles Avenue',
      instruction: 'Turn right onto Los Angeles Avenue.',
      visualInstructions: [content('turn', 'left', 'El Dorado')],
    },
    {
      distance: 803,
      roadName: undefined,
      instruction: 'Turn left.',
      visualInstructions: [content('arrive', 'right', 'Done')],
    },
    {
      distance: 0,
      roadName: 'Patricia Lane',
      instruction: 'Arrive.',
      visualInstructions: [],
    },
  ];
  assert.deepEqual(stepList(steps), [
    {
      type: 'depart',
      modifier: undefined,
      text: 'Bike south.',
      distance: 101,
      unnamed: false,
    },
    {
      type: 'turn',
      modifier: 'left',
      text: 'Turn right onto Los Angeles Avenue.',
      distance: 23,
      unnamed: false,
    },
    { type: 'turn', modifier: 'left', text: 'Turn left.', distance: 803, unnamed: true },
    { type: 'arrive', modifier: 'right', text: 'Arrive.', distance: 0, unnamed: false },
  ]);
});

test('stepList: upcoming skips the step the rider is already on', () => {
  const steps = [
    {
      distance: 50,
      roadName: 'A',
      instruction: 'Current',
      visualInstructions: [content('turn', 'left', 'B')],
    },
    {
      distance: 80,
      roadName: 'B',
      instruction: 'Turn left onto B.',
      visualInstructions: [content('arrive', null, 'Done')],
    },
    { distance: 0, roadName: 'B', instruction: 'Arrive.', visualInstructions: [] },
  ];
  const rows = stepList(steps, { upcoming: true });
  assert.deepEqual(
    rows.map((r) => r.text),
    ['Turn left onto B.', 'Arrive.'],
  );
  assert.equal(rows[0].type, 'turn');
  assert.equal(rows[1].type, 'arrive');
});
