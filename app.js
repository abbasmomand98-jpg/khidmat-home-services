/* ---------------------------------------------------------------------------
 * app.js — Khidmat UI layer
 *
 * Renders every view and wires every button. All business math comes from
 * logic.js (the Khidmat namespace); all content comes from data.js. This
 * file only touches the DOM.
 *
 * View map:
 *   view-home     → winter banner, search, city/area, category grid
 *   view-pros     → filtered + sorted pro list
 *   view-detail   → one pro's profile, reviews, price card
 *   view-book     → 3-step booking flow (job → details → estimate + slot)
 *   view-receipt  → digital receipt after confirming
 *   view-meter    → Insaf Meter fair-price checker
 *   view-bookings → bookings from localStorage with status flow
 * -------------------------------------------------------------------------*/

const LS_BOOKINGS = 'khidmat_bookings_v1';

const state = {
  serviceFilter: 'all',
  city: 'Lahore',
  area: 'all',
  query: '',
  sort: 'rating',
  proId: null,
  // booking draft, rebuilt each time the flow starts
  draft: null
};

const $ = (id) => document.getElementById(id);

/* ---------------- view switching ---------------- */

function showView(viewId) {
  document.querySelectorAll('.view').forEach((v) =>
    v.classList.toggle('active', v.id === viewId));
  document.querySelectorAll('.tab').forEach((t) =>
    t.classList.toggle('active', t.dataset.view === viewId));
  window.scrollTo(0, 0);
}

/* ---------------- small helpers ---------------- */

function serviceById(id) {
  return SERVICES.find((s) => s.id === id);
}
function proById(id) {
  return PROS.find((p) => p.id === id);
}
function stars(rating) {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}
function esc(s) {
  return Khidmat.escapeHTML(s);
}

function loadBookings() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_BOOKINGS) || '[]');
    if (!Array.isArray(raw)) return [];
    // validate shape so stale/corrupt entries can't break rendering
    return raw.filter((b) =>
      b && typeof b.id === 'string' && typeof b.proName === 'string');
  } catch (e) {
    return [];
  }
}
function saveBookings(list) {
  localStorage.setItem(LS_BOOKINGS, JSON.stringify(list));
}

/* ---------------- HOME ---------------- */

function renderWinterList() {
  $('winter-list').innerHTML =
    '<ul>' + WINTER_CHECKLIST.map((c) => '<li>' + esc(c) + '</li>').join('') + '</ul>';
}

function renderCityArea() {
  const citySel = $('city-select');
  citySel.innerHTML = CITIES.map((c) =>
    '<option value="' + esc(c.name) + '"' +
    (c.name === state.city ? ' selected' : '') + '>' + esc(c.name) + '</option>'
  ).join('');
  renderAreaOptions();
}

function renderAreaOptions() {
  const city = CITIES.find((c) => c.name === state.city);
  const areas = city ? city.areas : [];
  $('area-select').innerHTML =
    '<option value="all">All areas</option>' +
    areas.map((a) =>
      '<option value="' + esc(a) + '"' +
      (a === state.area ? ' selected' : '') + '>' + esc(a) + '</option>'
    ).join('');
}

function renderCategories() {
  $('category-grid').innerHTML = SERVICES.map((s) =>
    '<div class="cat-card" data-service="' + s.id + '">' +
      '<div class="cicon">' + s.icon + '</div>' +
      '<div class="cname">' + esc(s.name) + '</div>' +
      '<div class="ctag">' + esc(s.tagline) + '</div>' +
    '</div>'
  ).join('');
  document.querySelectorAll('.cat-card').forEach((card) => {
    card.addEventListener('click', () => {
      state.serviceFilter = card.dataset.service;
      $('service-filter').value = state.serviceFilter;
      renderPros();
      showView('view-pros');
    });
  });
}

/* ---------------- PRO LISTING ---------------- */

function renderServiceFilter() {
  $('service-filter').innerHTML =
    '<option value="all">All services</option>' +
    SERVICES.map((s) =>
      '<option value="' + s.id + '"' +
      (s.id === state.serviceFilter ? ' selected' : '') + '>' +
      s.icon + ' ' + esc(s.name) + '</option>'
    ).join('');
}

function currentFilters() {
  return {
    serviceId: state.serviceFilter,
    city: state.city,
    area: state.area,
    query: state.query
  };
}

function renderPros() {
  const filtered = Khidmat.filterPros(PROS, currentFilters(), SERVICES);
  const sorted = Khidmat.sortPros(filtered, state.sort);
  const where = state.area !== 'all'
    ? state.area + ', ' + state.city
    : state.city;
  $('pros-count').textContent =
    sorted.length + (sorted.length === 1 ? ' pro' : ' pros') +
    ' in ' + where + (state.query ? ' matching "' + state.query + '"' : '');

  if (sorted.length === 0) {
    $('pros-list').innerHTML =
      '<div class="empty">Koi pro nahi mila. 🔍<br>Try another service or clear the search.</div>';
    return;
  }

  $('pros-list').innerHTML = sorted.map((p) => {
    const svc = serviceById(p.serviceId);
    const badges =
      '<span class="badge">🪪 ID verified</span>' +
      (p.skillTested
        ? '<span class="badge">🧰 Skill tested</span>'
        : '<span class="badge pending">🧰 Test pending</span>');
    return (
      '<div class="pro-card" data-pro="' + p.id + '">' +
        '<div class="pro-top">' +
          '<div class="avatar">' + esc(p.name.charAt(0)) + '</div>' +
          '<div class="grow">' +
            '<div class="pro-name">' + esc(p.shop) + '</div>' +
            '<div class="pro-shop">' + esc(p.name) + ' · ' + esc(svc ? svc.name : '') + '</div>' +
            '<div class="pro-meta">📍 ' + esc(p.area) + ' · ' + p.distanceKm + ' km away · ' + p.jobs + ' jobs done</div>' +
            '<div class="badges">' + badges + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="pro-bottom">' +
          '<div class="stars">' + stars(p.rating) + ' <small>' + p.rating + '</small></div>' +
          '<div class="visit-fee"><small>Visit fee</small>' + Khidmat.formatPKR(p.visitFee) + '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  document.querySelectorAll('.pro-card').forEach((card) => {
    card.addEventListener('click', () => openDetail(card.dataset.pro));
  });
}

function openDetail(proId) {
  state.proId = proId;
  renderDetail();
  showView('view-detail');
}

/* ---------------- PRO DETAIL ---------------- */

function renderDetail() {
  const p = proById(state.proId);
  if (!p) { showView('view-pros'); return; }
  const svc = serviceById(p.serviceId);

  const badges =
    '<span class="badge">🪪 ID verified (CNIC checked)</span>' +
    (p.skillTested
      ? '<span class="badge">🧰 Skill tested — practical trade exam passed</span>'
      : '<span class="badge pending">🧰 Skill test pending</span>');

  const priceRows = svc.jobs.map((j) => {
    const price = Khidmat.proJobPrice(j.price, p.priceAdjust);
    return '<div class="price-row"><span>' + esc(j.name) + '</span>' +
           '<span class="p">' + Khidmat.formatPKR(price) + '</span></div>';
  }).join('');

  const reviewHtml = p.reviews.map((r) =>
    '<div class="review">' +
      '<div class="row space-between"><span class="rname">' + esc(r.name) + '</span>' +
      '<span class="stars">' + stars(r.stars) + '</span></div>' +
      '<div class="rtext">' + esc(r.text) + '</div>' +
    '</div>'
  ).join('');

  $('detail-body').innerHTML =
    '<div class="card">' +
      '<div class="pro-top">' +
        '<div class="avatar" style="width:64px;height:64px;font-size:26px;">' + esc(p.name.charAt(0)) + '</div>' +
        '<div class="grow">' +
          '<h2 style="margin:0;">' + esc(p.shop) + '</h2>' +
          '<div class="pro-shop">' + esc(p.name) + ' · ' + p.years + ' yrs experience</div>' +
          '<div class="pro-meta">📍 ' + esc(p.area) + ', ' + esc(p.city) + ' · ' + p.distanceKm + ' km away</div>' +
          '<div class="stars" style="margin-top:4px;">' + stars(p.rating) +
          ' <small>' + p.rating + ' · ' + p.jobs + ' jobs completed</small></div>' +
        '</div>' +
      '</div>' +
      '<div class="badges" style="margin-top:12px;">' + badges + '</div>' +
      '<p class="muted" style="margin-top:12px;">' + esc(p.bio) + '</p>' +
    '</div>' +

    '<div class="section-title">💰 Transparent price card</div>' +
    '<div class="card">' +
      '<div class="price-row"><span>Visit fee <small class="muted">(per visit, fixed)</small></span>' +
      '<span class="p">' + Khidmat.formatPKR(p.visitFee) + '</span></div>' +
      priceRows +
      '<p class="muted" style="margin-top:10px; font-size:12.5px;">Parts/material at market rate — pro shows the shop bill. Labour rates above are fixed before booking.</p>' +
    '</div>' +

    '<div class="section-title">⭐ Reviews (' + p.reviews.length + ')</div>' +
    '<div class="card">' + reviewHtml + '</div>' +

    '<button class="btn" id="book-pro-btn">Book ' + esc(p.name.split(' ')[0]) + ' →</button>' +
    '<div style="height:8px;"></div>';

  $('book-pro-btn').addEventListener('click', () => startBooking(p.id));
}

/* ---------------- BOOKING FLOW ---------------- */

function startBooking(proId) {
  state.draft = { proId: proId, jobId: null, problem: '', parts: '', dayKey: null, slotLabel: null };
  renderBookStep1();
  showView('view-book');
}

function bookStepPill(n) {
  return '<div class="step-pill">Step ' + n + ' of 3</div>';
}

function renderBookStep1() {
  const p = proById(state.draft.proId);
  const svc = serviceById(p.serviceId);
  const options = svc.jobs.map((j) => {
    const price = Khidmat.proJobPrice(j.price, p.priceAdjust);
    const sel = state.draft.jobId === j.id ? ' selected' : '';
    return '<div class="job-option' + sel + '" data-job="' + j.id + '">' +
             '<span>' + esc(j.name) + '</span>' +
             '<span class="p">' + Khidmat.formatPKR(price) + '</span>' +
           '</div>';
  }).join('');

  $('book-body').innerHTML =
    '<div class="card">' + bookStepPill(1) +
      '<h2>What needs fixing?</h2>' +
      '<p class="muted">' + esc(p.shop) + ' · visit fee ' + Khidmat.formatPKR(p.visitFee) + '</p>' +
      '<div style="margin-top:12px;">' + options + '</div>' +
      '<div style="margin-top:14px;"><button class="btn" id="bk-next1">Continue →</button></div>' +
    '</div>';

  document.querySelectorAll('.job-option').forEach((el) => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.job-option').forEach((x) => x.classList.remove('selected'));
      el.classList.add('selected');
      state.draft.jobId = el.dataset.job;
    });
  });
  $('bk-next1').addEventListener('click', () => {
    if (!state.draft.jobId) {
      alert('Pehle ek kaam select karein 🙂');
      return;
    }
    renderBookStep2();
  });
}

function renderBookStep2() {
  $('book-body').innerHTML =
    '<div class="card">' + bookStepPill(2) +
      '<h2>Describe the problem</h2>' +
      '<label for="bk-problem">Kya masla hai? (optional)</label>' +
      '<textarea id="bk-problem" placeholder="e.g. Bathroom ka tap leak kar raha hai, 2 din se…">' +
        esc(state.draft.problem) + '</textarea>' +
      '<label for="bk-parts">Parts budget — rough estimate (₨, optional)</label>' +
      '<input type="number" id="bk-parts" min="0" placeholder="e.g. 1500 (tap khud khareedna hai)" value="' + esc(state.draft.parts) + '">' +
      '<p class="muted" style="margin-top:8px;">Parts ka kharcha pro dukaandaar ka bill dikha kar lega — ye sirf aapke andazay ke liye hai.</p>' +
      '<div style="margin-top:14px;"><button class="btn" id="bk-next2">See upfront estimate →</button></div>' +
    '</div>';

  $('bk-next2').addEventListener('click', () => {
    state.draft.problem = $('bk-problem').value.trim();
    state.draft.parts = $('bk-parts').value.trim();
    renderBookStep3();
  });
}

function renderBookStep3() {
  const p = proById(state.draft.proId);
  const found = Khidmat.findJob(state.draft.jobId, SERVICES);
  const labour = Khidmat.proJobPrice(found.job.price, p.priceAdjust);
  const est = Khidmat.calcEstimate(p.visitFee, labour, state.draft.parts);

  if (!est) {
    $('book-body').innerHTML =
      '<div class="card"><h2>Estimate error</h2>' +
      '<p class="muted">Parts ka amount samajh nahi aaya — please wapas jaa kar sahi number likhein.</p>' +
      '<div style="margin-top:14px;"><button class="btn" id="bk-back2">← Back</button></div></div>';
    $('bk-back2').addEventListener('click', renderBookStep2);
    return;
  }

  const days = Khidmat.genSlots(new Date());
  const slotHtml = days.map((d) =>
    '<div class="slot-day">' + esc(d.dateLabel) + '</div>' +
    '<div class="slot-grid">' +
      d.slots.map((s) => {
        const sel = state.draft.dayKey === d.key && state.draft.slotLabel === s.label ? ' selected' : '';
        return '<button class="slot' + sel + '" data-day="' + d.key +
               '" data-label="' + esc(d.dateLabel) + '" data-slot="' + esc(s.label) + '">' +
               esc(s.label) + '</button>';
      }).join('') +
    '</div>'
  ).join('');

  $('book-body').innerHTML =
    '<div class="card">' + bookStepPill(3) +
      '<h2>Upfront estimate</h2>' +
      '<p class="muted">Ye total <strong>confirm karne se pehle</strong> — baad mein koi izafa nahi.</p>' +
      '<div class="est-table">' +
        '<div class="price-row"><span>Job: ' + esc(found.job.name) + '</span><span class="p">' + Khidmat.formatPKR(est.labour) + '</span></div>' +
        '<div class="price-row"><span>Visit fee (fixed)</span><span class="p">' + Khidmat.formatPKR(est.visitFee) + '</span></div>' +
        '<div class="price-row"><span>Parts (your estimate)</span><span class="p">' + Khidmat.formatPKR(est.parts) + '</span></div>' +
      '</div>' +
      '<div class="est-total"><span>Total</span><span>' + Khidmat.formatPKR(est.total) + '</span></div>' +
    '</div>' +

    '<div class="section-title">📅 Pick a time slot</div>' +
    '<div class="card">' + slotHtml + '</div>' +

    '<button class="btn" id="bk-confirm">Confirm booking — ' + Khidmat.formatPKR(est.total) + '</button>' +
    '<div style="height:8px;"></div>';

  document.querySelectorAll('.slot').forEach((el) => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.slot').forEach((x) => x.classList.remove('selected'));
      el.classList.add('selected');
      state.draft.dayKey = el.dataset.day;
      state.draft.slotLabel = el.dataset.label + ' · ' + el.dataset.slot;
    });
  });

  $('bk-confirm').addEventListener('click', () => {
    if (!state.draft.slotLabel) {
      alert('Pehle time slot select karein 🙂');
      return;
    }
    confirmBooking(est, found);
  });
}

function confirmBooking(est, found) {
  const p = proById(state.draft.proId);
  const booking = {
    id: Khidmat.bookingId(),
    proId: p.id,
    proName: p.shop,
    proPerson: p.name,
    serviceName: serviceById(p.serviceId).name,
    jobName: found.job.name,
    problem: state.draft.problem,
    parts: est.parts,
    visitFee: est.visitFee,
    labour: est.labour,
    total: est.total,
    slot: state.draft.slotLabel,
    status: 'Booked',
    createdAt: new Date().toISOString()
  };
  const list = loadBookings();
  list.unshift(booking);
  saveBookings(list);
  renderReceipt(booking);
  showView('view-receipt');
}

function renderReceipt(b) {
  $('receipt-body').innerHTML =
    '<div class="receipt">' +
      '<div class="check">✅</div>' +
      '<h2>Booking confirmed!</h2>' +
      '<p class="muted">' + esc(b.proName) + ' ko aapki request bhej di gayi hai.</p>' +
      '<div class="bid">' + esc(b.id) + '</div>' +
      '<div class="rrow"><span>Pro</span><span><strong>' + esc(b.proPerson) + '</strong></span></div>' +
      '<div class="rrow"><span>Job</span><span>' + esc(b.jobName) + '</span></div>' +
      '<div class="rrow"><span>Slot</span><span>' + esc(b.slot) + '</span></div>' +
      '<div class="rrow"><span>Visit fee</span><span>' + Khidmat.formatPKR(b.visitFee) + '</span></div>' +
      '<div class="rrow"><span>Labour</span><span>' + Khidmat.formatPKR(b.labour) + '</span></div>' +
      '<div class="rrow"><span>Parts (est.)</span><span>' + Khidmat.formatPKR(b.parts) + '</span></div>' +
      '<div class="rrow total"><span>Total</span><span>' + Khidmat.formatPKR(b.total) + '</span></div>' +
      '<p class="muted" style="margin-top:12px; font-size:13px;">Pro aanay se pehle call kar ke confirm karega. Payment kaam mukammal honay ke baad.</p>' +
    '</div>' +
    '<div style="margin-top:14px;"><button class="btn" id="rc-bookings">View my bookings →</button></div>' +
    '<div style="height:10px;"></div>' +
    '<button class="btn ghost" id="rc-home" style="width:100%;">Back to home</button>' +
    '<div style="height:8px;"></div>';

  $('rc-bookings').addEventListener('click', () => { renderBookings(); showView('view-bookings'); });
  $('rc-home').addEventListener('click', () => showView('view-home'));
}

/* ---------------- INSAF METER ---------------- */

function renderMeter() {
  $('meter-service').innerHTML = SERVICES.map((s) =>
    '<option value="' + s.id + '">' + s.icon + ' ' + esc(s.name) + '</option>'
  ).join('');
  renderMeterJobs();
}

function renderMeterJobs() {
  const svc = serviceById($('meter-service').value);
  $('meter-job').innerHTML = svc.jobs.map((j) =>
    '<option value="' + j.id + '">' + esc(j.name) + '</option>'
  ).join('');
  updateMeterRange();
}

function updateMeterRange() {
  const found = Khidmat.findJob($('meter-job').value, SERVICES);
  if (!found) return;
  $('meter-range').textContent =
    'Standard market range: ' + Khidmat.formatPKR(found.job.low) +
    ' – ' + Khidmat.formatPKR(found.job.high);
}

function checkMeter() {
  const err = $('meter-error');
  const found = Khidmat.findJob($('meter-job').value, SERVICES);
  const quote = $('meter-quote').value.trim();
  err.style.display = 'none';

  if (!found) return;
  const verdict = Khidmat.fairPriceVerdict(quote, found.job.low, found.job.high);
  if (!verdict) {
    err.textContent = 'Please enter a valid quoted price (numbers only).';
    err.style.display = 'block';
    $('meter-result-card').style.display = 'none';
    return;
  }

  const box = $('meter-verdict');
  box.className = 'verdict-box ' + verdict.key;
  box.innerHTML =
    '<div class="big">' + esc(verdict.label) + '</div>' +
    '<p><strong>Quote:</strong> ' + Khidmat.formatPKR(quote) +
    ' &nbsp;·&nbsp; <strong>Market:</strong> ' +
    Khidmat.formatPKR(found.job.low) + '–' + Khidmat.formatPKR(found.job.high) + '</p>' +
    '<p>' + esc(verdict.advice) + '</p>';
  $('meter-result-card').style.display = 'block';
}

/* ---------------- MY BOOKINGS ---------------- */

function statusClass(s) {
  if (s === 'Booked') return 'booked';
  if (s === 'On the way') return 'onway';
  if (s === 'Done') return 'done';
  return 'cancelled';
}

function renderBookings() {
  const list = loadBookings();
  if (list.length === 0) {
    $('bookings-list').innerHTML =
      '<div class="empty">Abhi koi booking nahi hai. 📋<br>Find a pro and book your first visit!</div>';
    return;
  }

  $('bookings-list').innerHTML = list.map((b) => {
    const next = Khidmat.nextStatus(b.status);
    return (
      '<div class="booking-card" data-bid="' + esc(b.id) + '">' +
        '<div class="row space-between">' +
          '<div><strong>' + esc(b.jobName) + '</strong>' +
          '<div class="muted">' + esc(b.proName) + ' · ' + esc(b.serviceName) + '</div></div>' +
          '<span class="status ' + statusClass(b.status) + '">' + esc(b.status) + '</span>' +
        '</div>' +
        '<div class="muted" style="margin-top:8px;">🆔 ' + esc(b.id) + '<br>📅 ' + esc(b.slot) +
        '<br>💰 Total: <strong>' + Khidmat.formatPKR(b.total) + '</strong></div>' +
        (b.status !== 'Done' && b.status !== 'Cancelled'
          ? '<div class="booking-actions">' +
            (next ? '<button class="btn small ghost" data-act="advance">Mark: ' + esc(next) + '</button>' : '') +
            '<button class="btn small danger" data-act="cancel">Cancel</button>' +
            '</div>'
          : '') +
      '</div>'
    );
  }).join('');

  document.querySelectorAll('.booking-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      const act = e.target.dataset && e.target.dataset.act;
      if (!act) return;
      const list2 = loadBookings();
      const b = list2.find((x) => x.id === card.dataset.bid);
      if (!b) return;
      if (act === 'cancel') {
        if (!confirm('Booking cancel karni hai?')) return;
        b.status = 'Cancelled';
      } else if (act === 'advance') {
        const nxt = Khidmat.nextStatus(b.status);
        if (nxt) b.status = nxt;
      }
      saveBookings(list2);
      renderBookings();
    });
  });
}

/* ---------------- init ---------------- */

function init() {
  renderWinterList();
  renderCityArea();
  renderCategories();
  renderServiceFilter();
  renderPros();
  renderMeter();

  // tab bar
  document.querySelectorAll('.tab').forEach((t) => {
    t.addEventListener('click', () => {
      const v = t.dataset.view;
      if (v === 'view-pros') renderPros();
      if (v === 'view-bookings') renderBookings();
      showView(v);
    });
  });

  // back buttons
  document.querySelectorAll('.back-btn').forEach((b) => {
    b.addEventListener('click', () => showView(b.dataset.goto));
  });

  // home: city / area / search
  $('city-select').addEventListener('change', (e) => {
    state.city = e.target.value;
    state.area = 'all';
    renderAreaOptions();
  });
  $('area-select').addEventListener('change', (e) => {
    state.area = e.target.value;
  });
  $('search').addEventListener('input', (e) => {
    state.query = e.target.value;
  });
  $('search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      state.query = e.target.value;
      renderPros();
      showView('view-pros');
    }
  });
  $('winter-cta').addEventListener('click', () => {
    state.serviceFilter = 'geyser';
    $('service-filter').value = 'geyser';
    renderPros();
    showView('view-pros');
  });

  // pros view: service filter + sort
  $('service-filter').addEventListener('change', (e) => {
    state.serviceFilter = e.target.value;
    renderPros();
  });
  $('sort-select').addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderPros();
  });

  // meter
  $('meter-service').addEventListener('change', renderMeterJobs);
  $('meter-job').addEventListener('change', updateMeterRange);
  $('meter-check').addEventListener('click', checkMeter);
}

document.addEventListener('DOMContentLoaded', init);
