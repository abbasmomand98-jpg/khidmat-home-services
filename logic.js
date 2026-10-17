/* ---------------------------------------------------------------------------
 * logic.js — Khidmat (pure logic, NO DOM code)
 *
 * Every function below takes plain values in and returns plain values out,
 * so the whole file runs in Node without a browser. app.js calls these
 * functions to power the UI; test.js covers them with assertions.
 * -------------------------------------------------------------------------*/

/**
 * Format a PKR amount: 5000 → "₨ 5,000". Non-numeric input → "₨ —".
 */
function formatPKR(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '₨ —';
  const grouped = String(Math.abs(Math.round(num))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (num < 0 ? '-₨ ' : '₨ ') + grouped;
}

/**
 * Parse a price field typed by the user. Empty / non-numeric / negative
 * → null so the UI can show one friendly error. 0 is a valid price.
 */
function parsePrice(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s === '') return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

/**
 * A pro's fixed price for one job: the job's standard price × the pro's
 * price multiplier, rounded to the nearest ₨ 50 (real pros quote in 50s).
 */
function proJobPrice(jobPrice, priceAdjust) {
  const adj = Number(priceAdjust) || 1;
  return Math.round((jobPrice * adj) / 50) * 50;
}

/**
 * Upfront booking estimate — the number the customer sees BEFORE confirming:
 *   total = visit fee + fixed labour price + optional parts estimate.
 * partsRaw may be '' (→ 0) or garbage (→ null, so the UI can flag it).
 */
function calcEstimate(visitFee, labourPrice, partsRaw) {
  const parts = partsRaw === '' || partsRaw === null || partsRaw === undefined
    ? 0
    : parsePrice(partsRaw);
  if (parts === null) return null;
  const vf = Number(visitFee) || 0;
  const lb = Number(labourPrice) || 0;
  return { visitFee: vf, labour: lb, parts: parts, total: vf + lb + parts };
}

/**
 * Insaf Meter verdict: is the quoted price fair against the market range?
 *
 *   quoted < low                → 'low'          (suspiciously cheap)
 *   low ≤ quoted ≤ high         → 'fair'
 *   high < quoted ≤ high × 1.25 → 'slightly-high'
 *   quoted > high × 1.25        → 'overpriced'
 *
 * Returns null when the quote is not a valid price.
 */
function fairPriceVerdict(quotedRaw, low, high) {
  const quoted = parsePrice(quotedRaw);
  if (quoted === null) return null;
  const lo = Number(low);
  const hi = Number(high);
  if (quoted < lo) {
    return {
      key: 'low',
      label: 'Suspiciously low',
      advice: 'Itna sasta? Saman halka ya kaam adhoora ho sakta hai — pro ki rating aur reviews zaroor check karein.'
    };
  }
  if (quoted <= hi) {
    return {
      key: 'fair',
      label: 'Fair price ✓',
      advice: 'Ye quote market range ke andar hai. Bila jhijhak kaam karwa lein.'
    };
  }
  if (quoted <= hi * 1.25) {
    return {
      key: 'slightly-high',
      label: 'Slightly high',
      advice: 'Market se thora zyada hai. Pro se ' + formatPKR(hi) + ' tak negotiate karein — ya Khidmat par verified pro book karein.'
    };
  }
  return {
    key: 'overpriced',
    label: 'Overpriced ✗',
    advice: 'Ye loot hai! Standard rate ' + formatPKR(lo) + '–' + formatPKR(hi) + ' hai. Ye rate dein ya kisi verified pro ko book karein.'
  };
}

/**
 * Find one job by id across all services. Returns { service, job } or null.
 */
function findJob(jobId, services) {
  for (const s of services || []) {
    for (const j of s.jobs || []) {
      if (j.id === jobId) return { service: s, job: j };
    }
  }
  return null;
}

/**
 * Filter pros by service ('all' = any), city ('all' = any), area
 * ('all' = any), and a free-text query matched against name, shop,
 * area and service name.
 */
function filterPros(pros, filters, services) {
  const serviceId = (filters && filters.serviceId) || 'all';
  const city = (filters && filters.city) || 'all';
  const area = (filters && filters.area) || 'all';
  const q = ((filters && filters.query) || '').trim().toLowerCase();
  const serviceName = (id) => {
    const s = (services || []).find((x) => x.id === id);
    return s ? s.name : '';
  };
  return (pros || []).filter((p) => {
    if (serviceId !== 'all' && p.serviceId !== serviceId) return false;
    if (city !== 'all' && p.city !== city) return false;
    if (area !== 'all' && p.area !== area) return false;
    if (q) {
      const hay = (p.name + ' ' + p.shop + ' ' + p.area + ' ' +
                   serviceName(p.serviceId)).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Sort a pro list. Keys: 'rating' (highest first), 'price' (visit fee,
 * cheapest first), 'distance' (nearest first). Unknown key → unchanged order.
 * Returns a NEW array; never mutates the input.
 */
function sortPros(pros, key) {
  const list = (pros || []).slice();
  if (key === 'rating') list.sort((a, b) => b.rating - a.rating || b.jobs - a.jobs);
  else if (key === 'price') list.sort((a, b) => a.visitFee - b.visitFee);
  else if (key === 'distance') list.sort((a, b) => a.distanceKm - b.distanceKm);
  return list;
}

/* The four daily slots offered for bookings. */
const DAY_SLOTS = [
  { id: 's1', label: '9:00 – 11:00 AM', startHour: 9 },
  { id: 's2', label: '11:00 AM – 1:00 PM', startHour: 11 },
  { id: 's3', label: '3:00 – 5:00 PM', startHour: 15 },
  { id: 's4', label: '5:00 – 7:00 PM', startHour: 17 }
];

/**
 * Booking slot days: today (only slots whose start hour hasn't passed),
 * tomorrow, and the day after. `now` is injectable for deterministic tests.
 * Each day: { dateLabel, slots: [ {id, label} ] }. Days with no open slots
 * are skipped.
 */
function genSlots(now) {
  const current = now instanceof Date ? now : new Date();
  const days = [];
  const fmt = (d) => d.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
  for (let offset = 0; offset < 3; offset++) {
    const d = new Date(current.getFullYear(), current.getMonth(), current.getDate() + offset);
    const open = DAY_SLOTS.filter((s) =>
      offset > 0 || current.getHours() < s.startHour
    );
    if (open.length === 0) continue;
    days.push({
      key: d.toISOString().slice(0, 10),
      dateLabel: (offset === 0 ? 'Today, ' : offset === 1 ? 'Tomorrow, ' : '') + fmt(d),
      slots: open.map((s) => ({ id: s.id, label: s.label }))
    });
  }
  return days;
}

/**
 * Booking ID like "KH-2026-4821". The random source is injectable so tests
 * can fix it; the UI passes Math.random by default.
 */
function bookingId(rand) {
  const r = typeof rand === 'function' ? rand : Math.random;
  const digits = String(Math.floor(1000 + r() * 9000));
  return 'KH-2026-' + digits;
}

/**
 * Booking status flow for "My bookings": Booked → On the way → Done.
 * Returns the next status, or null when already Done/Cancelled/unknown.
 */
function nextStatus(status) {
  if (status === 'Booked') return 'On the way';
  if (status === 'On the way') return 'Done';
  return null;
}

/* Escape text before injecting into HTML — defence-in-depth even though most
 * rendering in app.js uses textContent. */
function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* One namespace export: works as a browser global AND a Node module. */
const Khidmat = {
  formatPKR,
  parsePrice,
  proJobPrice,
  calcEstimate,
  fairPriceVerdict,
  findJob,
  filterPros,
  sortPros,
  genSlots,
  bookingId,
  nextStatus,
  escapeHTML,
  DAY_SLOTS
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Khidmat;
}
