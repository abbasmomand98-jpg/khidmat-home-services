/* ---------------------------------------------------------------------------
 * test.js — Node smoke test for Khidmat's pure logic (logic.js) and data.
 * Run: node test.js
 * Exits non-zero on the first failure so CI/shell scripts catch problems.
 * -------------------------------------------------------------------------*/

const data = require('./data.js');
const K = require('./logic.js');

let passed = 0;
let failed = 0;

function ok(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log('  ✓ ' + name);
  } else {
    failed++;
    console.log('  ✗ FAIL ' + name + ' → got ' + a + ', expected ' + e);
  }
}

console.log('\n--- formatPKR ---');
ok('5000 → ₨ 5,000', K.formatPKR(5000), '₨ 5,000');
ok('0 → ₨ 0', K.formatPKR(0), '₨ 0');
ok('600000 → ₨ 600,000', K.formatPKR(600000), '₨ 600,000');
ok('non-numeric → ₨ —', K.formatPKR('abc'), '₨ —');
ok('rounds 1250.7 → ₨ 1,251', K.formatPKR(1250.7), '₨ 1,251');

console.log('\n--- parsePrice ---');
ok('plain number', K.parsePrice('2500'), 2500);
ok('empty → null', K.parsePrice(''), null);
ok('non-numeric → null', K.parsePrice('abc'), null);
ok('negative → null', K.parsePrice('-100'), null);
ok('zero is valid', K.parsePrice('0'), 0);
ok('rounds decimals', K.parsePrice('1499.6'), 1500);

console.log('\n--- proJobPrice ---');
ok('1200 × 1.0 → 1200', K.proJobPrice(1200, 1.0), 1200);
ok('1200 × 0.9 → 1100 (nearest 50)', K.proJobPrice(1200, 0.9), 1100);
ok('2500 × 1.05 → 2650 (nearest 50)', K.proJobPrice(2500, 1.05), 2650);
ok('900 × 0.95 → 850 (nearest 50)', K.proJobPrice(900, 0.95), 850);

console.log('\n--- calcEstimate ---');
const est1 = K.calcEstimate(500, 1200, '');
ok('visit 500 + labour 1200, no parts → 1700', est1.total, 1700);
ok('breakdown parts default 0', est1.parts, 0);
const est2 = K.calcEstimate(400, 900, '1500');
ok('visit 400 + labour 900 + parts 1500 → 2800', est2.total, 2800);
ok('garbage parts → null', K.calcEstimate(400, 900, 'abc'), null);
ok('negative parts → null', K.calcEstimate(400, 900, '-50'), null);

console.log('\n--- fairPriceVerdict (market 1500–2200) ---');
ok('1800 → fair', K.fairPriceVerdict('1800', 1500, 2200).key, 'fair');
ok('1500 (low edge) → fair', K.fairPriceVerdict('1500', 1500, 2200).key, 'fair');
ok('2200 (high edge) → fair', K.fairPriceVerdict('2200', 1500, 2200).key, 'fair');
ok('2500 → slightly-high', K.fairPriceVerdict('2500', 1500, 2200).key, 'slightly-high');
ok('2750 (1.25× edge) → slightly-high', K.fairPriceVerdict('2750', 1500, 2200).key, 'slightly-high');
ok('3000 → overpriced', K.fairPriceVerdict('3000', 1500, 2200).key, 'overpriced');
ok('1000 → low (suspicious)', K.fairPriceVerdict('1000', 1500, 2200).key, 'low');
ok('empty quote → null', K.fairPriceVerdict('', 1500, 2200), null);
ok('overpriced advice names the range', K.fairPriceVerdict('5000', 1500, 2200).advice.includes('₨ 1,500'), true);

console.log('\n--- findJob ---');
const fj = K.findJob('gy-service', data.SERVICES);
ok('gy-service found', fj && fj.job.name, 'Geyser servicing (descaling)');
ok('gy-service belongs to geyser service', fj && fj.service.id, 'geyser');
ok('bogus id → null', K.findJob('nope', data.SERVICES), null);

console.log('\n--- filterPros ---');
const pros = data.PROS;
const all = K.filterPros(pros, { serviceId: 'all', city: 'all', area: 'all', query: '' }, data.SERVICES);
ok('no filters → all 13 pros', all.length, 13);
ok('electrician filter → 3', K.filterPros(pros, { serviceId: 'electrician' }, data.SERVICES).length, 3);
ok('Lahore filter → 4', K.filterPros(pros, { city: 'Lahore' }, data.SERVICES).length, 4);
ok('Lahore + electrician → 1 (Imran)', K.filterPros(pros, { serviceId: 'electrician', city: 'Lahore' }, data.SERVICES)[0].id, 'imran-electric');
ok('area filter Model Town → 1 (Sajid)', K.filterPros(pros, { area: 'Model Town' }, data.SERVICES)[0].id, 'sajid-plumber');
ok('query "geyser" → 2', K.filterPros(pros, { query: 'geyser' }, data.SERVICES).length, 2);
ok('query "Imran" → 1', K.filterPros(pros, { query: 'Imran' }, data.SERVICES).length, 1);
ok('query "xyz-no-match" → 0', K.filterPros(pros, { query: 'xyz-no-match' }, data.SERVICES).length, 0);

console.log('\n--- sortPros ---');
const byRating = K.sortPros(pros, 'rating');
ok('top rated first (4.9)', byRating[0].rating, 4.9);
ok('sorted desc', byRating.every((p, i, a) => i === 0 || a[i - 1].rating >= p.rating), true);
const byPrice = K.sortPros(pros, 'price');
ok('cheapest visit first (350)', byPrice[0].visitFee, 350);
ok('input array not mutated', pros[0].id, 'imran-electric');
const byDist = K.sortPros(pros, 'distance');
ok('nearest first (1.5 km)', byDist[0].distanceKm, 1.5);
ok('unknown key → order kept', K.sortPros(pros, 'bogus')[0].id, 'imran-electric');

console.log('\n--- genSlots (now = Sat 2026-10-17 10:00) ---');
const sat10 = new Date(2026, 9, 17, 10, 0);
const slots = K.genSlots(sat10);
ok('3 days offered', slots.length, 3);
ok('today keeps 3 slots after 10am', slots[0].slots.length, 3);
ok('first label mentions Today', slots[0].dateLabel.startsWith('Today'), true);
const sat18 = new Date(2026, 9, 17, 18, 30);
const late = K.genSlots(sat18);
ok('after 5:30pm today is skipped → 2 days', late.length, 2);
ok('first day is tomorrow', late[0].dateLabel.startsWith('Tomorrow'), true);
ok('tomorrow has all 4 slots', late[0].slots.length, 4);

console.log('\n--- bookingId ---');
const bid = K.bookingId(() => 0.4821);
ok('fixed rand → KH-2026-5338', bid, 'KH-2026-5338');
ok('real id matches format', /^KH-2026-\d{4}$/.test(K.bookingId()), true);

console.log('\n--- nextStatus ---');
ok('Booked → On the way', K.nextStatus('Booked'), 'On the way');
ok('On the way → Done', K.nextStatus('On the way'), 'Done');
ok('Done → null', K.nextStatus('Done'), null);
ok('Cancelled → null', K.nextStatus('Cancelled'), null);

console.log('\n--- data sanity ---');
ok('6 services', data.SERVICES.length, 6);
ok('13 pros', data.PROS.length, 13);
ok('5 cities', data.CITIES.length, 5);
ok('every pro references a real service', pros.every((p) => data.SERVICES.some((s) => s.id === p.serviceId)), true);
ok('every pro city exists in CITIES', pros.every((p) => data.CITIES.some((c) => c.name === p.city)), true);
ok('every pro has 2–3 reviews', pros.every((p) => p.reviews.length >= 2 && p.reviews.length <= 3), true);
ok('every job range is sane (low ≤ price ≤ high)', data.SERVICES.every((s) =>
  s.jobs.every((j) => j.low <= j.price && j.price <= j.high)), true);
ok('visit fees 350–600', pros.every((p) => p.visitFee >= 350 && p.visitFee <= 600), true);

console.log('\n====================================');
console.log('PASSED: ' + passed + '   FAILED: ' + failed);
console.log('====================================\n');
process.exit(failed === 0 ? 0 : 1);
