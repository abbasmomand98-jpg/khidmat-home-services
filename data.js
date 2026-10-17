/* ---------------------------------------------------------------------------
 * data.js — Khidmat (Verified Home Services Finder)
 *
 * All content lives here: service categories with their standard market
 * price ranges, the city/area map, and the pro profiles (names, ratings,
 * reviews, fees). Editing a price or adding a pro means editing ONLY this
 * file — logic.js and app.js never hard-code business facts.
 *
 * Notes on realism (demo data):
 *  - Prices are realistic PKR estimates for Oct 2026; every job carries a
 *    low/high "market range" so the Insaf Meter can judge any quote.
 *  - A pro's listed price = job's standard price × that pro's priceAdjust
 *    (rounded to the nearest ₨ 50), so the same job costs a little more or
 *    less depending on the pro — exactly like the real market.
 *  - Visit fee is charged once per visit and is shown BEFORE booking.
 * -------------------------------------------------------------------------*/

/* City → neighbourhood areas shown in the area selector. */
const CITIES = [
  {
    name: 'Lahore',
    areas: ['DHA Phase 5', 'Gulberg', 'Model Town', 'Johar Town', 'Cantt']
  },
  {
    name: 'Karachi',
    areas: ['DHA Phase 6', 'Gulshan-e-Iqbal', 'Bahria Town Karachi', 'North Nazimabad']
  },
  {
    name: 'Islamabad',
    areas: ['F-10', 'G-13', 'Bahria Town Phase 4', 'Blue Area']
  },
  {
    name: 'Peshawar',
    areas: ['Hayatabad Phase 2', 'University Town', 'Gulbahar', 'Cantt']
  },
  {
    name: 'Rawalpindi',
    areas: ['Satellite Town', 'Bahria Town Phase 8', 'Westridge', 'Chaklala']
  }
];

/* Service categories. Each job has:
 *   id, name, price (standard market price), low/high (fair market range). */
const SERVICES = [
  {
    id: 'electrician',
    name: 'Electrician',
    icon: '⚡',
    tagline: 'Wiring, fans, switch boards & UPS',
    jobs: [
      { id: 'el-wiring',  name: 'Wiring repair (per point)',   price: 800,  low: 650,  high: 950  },
      { id: 'el-fan',     name: 'Ceiling fan installation',    price: 1200, low: 950,  high: 1400 },
      { id: 'el-board',   name: 'Switch board replacement',    price: 1500, low: 1200, high: 1800 },
      { id: 'el-ups',     name: 'UPS / inverter wiring',       price: 3500, low: 2800, high: 4200 }
    ]
  },
  {
    id: 'plumber',
    name: 'Plumber',
    icon: '🔧',
    tagline: 'Taps, leakages, tanks & drains',
    jobs: [
      { id: 'pl-tap',     name: 'Tap replacement',             price: 900,  low: 700,  high: 1100 },
      { id: 'pl-leak',    name: 'Leakage repair',              price: 1400, low: 1100, high: 1700 },
      { id: 'pl-sanitary',name: 'Sanitary fitting',            price: 2000, low: 1600, high: 2400 },
      { id: 'pl-tank',    name: 'Water tank cleaning (1000 gal)', price: 2500, low: 2000, high: 3000 },
      { id: 'pl-drain',   name: 'Drain unclogging',             price: 1200, low: 900,  high: 1500 }
    ]
  },
  {
    id: 'ac-tech',
    name: 'AC Technician',
    icon: '❄️',
    tagline: 'Service, gas refill & installation',
    jobs: [
      { id: 'ac-service', name: 'AC general service (split)',  price: 2500, low: 2000, high: 3000 },
      { id: 'ac-gas',     name: 'Gas refill (R22)',            price: 6000, low: 5000, high: 7500 },
      { id: 'ac-install', name: 'AC installation',             price: 4500, low: 3500, high: 5500 },
      { id: 'ac-check',   name: 'Compressor health check',     price: 1500, low: 1200, high: 1800 }
    ]
  },
  {
    id: 'geyser',
    name: 'Geyser & Heater',
    icon: '🔥',
    tagline: 'Geyser service, heaters & gas safety',
    jobs: [
      { id: 'gy-service', name: 'Geyser servicing (descaling)',price: 1800, low: 1500, high: 2200 },
      { id: 'gy-install', name: 'Geyser installation',         price: 2500, low: 2000, high: 3000 },
      { id: 'gy-thermo',  name: 'Thermostat replacement',      price: 1300, low: 1000, high: 1600 },
      { id: 'gy-heater',  name: 'Electric heater repair',      price: 1200, low: 900,  high: 1500 },
      { id: 'gy-safety',  name: 'Gas pipeline safety check',   price: 2000, low: 1600, high: 2400 }
    ]
  },
  {
    id: 'carpenter',
    name: 'Carpenter',
    icon: '🪚',
    tagline: 'Doors, furniture & cabinets',
    jobs: [
      { id: 'cp-door',    name: 'Door hinge / lock repair',    price: 1000, low: 800,  high: 1300 },
      { id: 'cp-polish',  name: 'Furniture polishing (per piece)', price: 3000, low: 2200, high: 3800 },
      { id: 'cp-wardrobe',name: 'Wardrobe sliding repair',     price: 1800, low: 1400, high: 2200 },
      { id: 'cp-cabinet', name: 'Kitchen cabinet fitting',     price: 4000, low: 3200, high: 5000 }
    ]
  },
  {
    id: 'painter',
    name: 'Painter',
    icon: '🎨',
    tagline: 'Rooms, exteriors & wood polish',
    jobs: [
      { id: 'pt-room',    name: 'Room painting 10×12 (labour)',price: 6000, low: 5000, high: 7500 },
      { id: 'pt-ext',     name: 'Weather-shield exterior (per wall)', price: 4500, low: 3500, high: 5500 },
      { id: 'pt-putty',   name: 'Putty + primer (per room)',   price: 3500, low: 2800, high: 4200 },
      { id: 'pt-wood',    name: 'Wooden door polish',          price: 2500, low: 1800, high: 3000 }
    ]
  }
];

/* Pro profiles. priceAdjust multiplies the service's standard job prices
 * (rounded to nearest ₨ 50 in app.js). Badges: idVerified + skillTested. */
const PROS = [
  {
    id: 'imran-electric',
    name: 'Imran Shah',
    shop: 'Imran Electrician',
    serviceId: 'electrician',
    city: 'Lahore',
    area: 'DHA Phase 5',
    rating: 4.8,
    jobs: 342,
    visitFee: 500,
    distanceKm: 2.1,
    priceAdjust: 1.0,
    years: 9,
    idVerified: true,
    skillTested: true,
    bio: 'WAPDA-trained electrician. Neat wiring, no jugaar — I label every breaker so you know what is what.',
    reviews: [
      { name: 'Ayesha R.', stars: 5, text: 'Bohat safai se kaam kiya. Fan lagaya aur purani wiring bhi check kar di — rate wahi jo app mein likha tha.' },
      { name: 'Usman G.', stars: 5, text: 'Time par aaya, kaam 1 ghantay mein khatam. UPS wiring ab perfect chal rahi hai.' },
      { name: 'Fatima S.', stars: 4, text: 'Acha kaam, bas thora late aaya tha traffic ki wajah se. Overall satisfied.' }
    ]
  },
  {
    id: 'sajid-plumber',
    name: 'Sajid Mehmood',
    shop: 'Sajid Plumber',
    serviceId: 'plumber',
    city: 'Lahore',
    area: 'Model Town',
    rating: 4.7,
    jobs: 518,
    visitFee: 400,
    distanceKm: 3.4,
    priceAdjust: 0.95,
    years: 12,
    idVerified: true,
    skillTested: true,
    bio: '12 saal ka tajurba. Leakage ho ya tanki ki safai — pehle masla samjhata hoon, phir rate batata hoon.',
    reviews: [
      { name: 'Bilal A.', stars: 5, text: 'Bathroom leakage 2 din mein theek kar di. Pehle 3 mistri dekh chukay thay, yehi asal kaam wala nikla.' },
      { name: 'Hira K.', stars: 5, text: 'Tanki saaf karwai, bohat mehnat se ki. Pani ab saaf aa raha hai.' },
      { name: 'Danish M.', stars: 4, text: 'Kaam acha, rate munasib. Bas saman khud laana para.' }
    ]
  },
  {
    id: 'tariq-ac',
    name: 'Tariq Aziz',
    shop: 'Tariq AC Services',
    serviceId: 'ac-tech',
    city: 'Karachi',
    area: 'DHA Phase 6',
    rating: 4.9,
    jobs: 410,
    visitFee: 600,
    distanceKm: 1.8,
    priceAdjust: 1.05,
    years: 8,
    idVerified: true,
    skillTested: true,
    bio: 'Split & inverter AC specialist. Gas refill sirf weighing scale par — andaza nahi, guarantee.',
    reviews: [
      { name: 'Mahnoor S.', stars: 5, text: 'AC ki cooling wapas aa gayi. Gas scale par tol kar bhari, receipt bhi di. Professional banda hai.' },
      { name: 'Kamran J.', stars: 5, text: 'Do AC service karwaye, dono ab naye jaisay chal rahay hain.' }
    ]
  },
  {
    id: 'rashid-geyser',
    name: 'Rashid Khan',
    shop: 'Rashid Geyser Service',
    serviceId: 'geyser',
    city: 'Lahore',
    area: 'Gulberg',
    rating: 4.8,
    jobs: 275,
    visitFee: 400,
    distanceKm: 2.6,
    priceAdjust: 1.0,
    years: 10,
    idVerified: true,
    skillTested: true,
    bio: 'Sardi se pehle geyser ki service karwa lein — descaling se gas bhi bachti hai aur pani jaldi garam hota hai.',
    reviews: [
      { name: 'Sana F.', stars: 5, text: 'Geyser service karwai, ab 10 minute mein garam pani. Sardi mein bohat kaam aaya.' },
      { name: 'Imran T.', stars: 5, text: 'Thermostat badla, purana wala sath le gaya aur naya lagaya. Saf suthra kaam.' },
      { name: 'Rabia N.', stars: 4, text: 'Kaam theek tha, rate thora zyada laga lekin quality achi thi.' }
    ]
  },
  {
    id: 'aslam-carpenter',
    name: 'Aslam Masih',
    shop: 'Aslam Carpenter',
    serviceId: 'carpenter',
    city: 'Islamabad',
    area: 'F-10',
    rating: 4.6,
    jobs: 190,
    visitFee: 500,
    distanceKm: 4.2,
    priceAdjust: 1.1,
    years: 15,
    idVerified: true,
    skillTested: true,
    bio: '15 saal se lakri ka kaam. Wardrobe, darwazay, kitchen — finishing meri pehchan hai.',
    reviews: [
      { name: 'Faisal H.', stars: 5, text: 'Wardrobe ka sliding theek kiya, ab makhan jaisa chalta hai. Finishing dekh kar khushi hui.' },
      { name: 'Nadia P.', stars: 4, text: 'Darwazay ka lock lagaya, mazboot kaam. Time thora zyada liya.' }
    ]
  },
  {
    id: 'javed-painter',
    name: 'Javed Iqbal',
    shop: 'Javed Painter',
    serviceId: 'painter',
    city: 'Rawalpindi',
    area: 'Satellite Town',
    rating: 4.7,
    jobs: 233,
    visitFee: 500,
    distanceKm: 3.0,
    priceAdjust: 0.95,
    years: 11,
    idVerified: true,
    skillTested: true,
    bio: 'Asian Paints & Berger certified colour consultant. Diwar ki tayyari (putty/primer) mein kanjoosi nahi karta.',
    reviews: [
      { name: 'Saad R.', stars: 5, text: 'Poora ghar paint karwaya. Putty se lekar final coat tak har step bataya. Colour bhi unhi ne suggest kiya — bohat khubsurat laga.' },
      { name: 'Mehwish A.', stars: 5, text: 'Kamray ka paint 2 din mein mukammal. Safai ka khayal rakha, furniture cover kar ke kaam kiya.' }
    ]
  },
  {
    id: 'kamran-electric',
    name: 'Kamran Sheikh',
    shop: 'Kamran Electric Works',
    serviceId: 'electrician',
    city: 'Karachi',
    area: 'Gulshan-e-Iqbal',
    rating: 4.5,
    jobs: 388,
    visitFee: 450,
    distanceKm: 5.1,
    priceAdjust: 0.9,
    years: 7,
    idVerified: true,
    skillTested: true,
    bio: 'Budget-friendly bijli ka kaam. Rate pehle, kaam baad mein — koi chhupa kharcha nahi.',
    reviews: [
      { name: 'Adnan V.', stars: 5, text: 'Sasta aur acha — 4 fan lagwaye, sab perfect. Rate sab se kam tha market mein.' },
      { name: 'Zoya M.', stars: 4, text: 'Switch board badla, kaam theek. Bas apna samaan (switches) khud khareednay paray.' }
    ]
  },
  {
    id: 'farooq-plumber',
    name: 'Farooq Ahmed',
    shop: 'Farooq Plumbing Co.',
    serviceId: 'plumber',
    city: 'Islamabad',
    area: 'G-13',
    rating: 4.9,
    jobs: 301,
    visitFee: 550,
    distanceKm: 2.2,
    priceAdjust: 1.1,
    years: 14,
    idVerified: true,
    skillTested: true,
    bio: 'Premium plumbing — PPRC, concealed fitting, aur lifetime leakage warranty meri har fitting par.',
    reviews: [
      { name: 'Hassan Q.', stars: 5, text: 'Naye ghar ki sari plumbing inhone ki. 6 mahinay ho gaye, ek boond leakage nahi. Thora mehnga, lekin paisa vasool.' },
      { name: 'Areeba Z.', stars: 5, text: 'Bathroom fittings lagwain, design bhi inhone suggest kiya. Bohat khubsurat result.' },
      { name: 'Omar D.', stars: 5, text: 'Emergency mein raat ko aaya aur pipe burst theek kiya. Zindabad!' }
    ]
  },
  {
    id: 'naveed-ac',
    name: 'Naveed Akhtar',
    shop: 'Naveed Cool Care',
    serviceId: 'ac-tech',
    city: 'Lahore',
    area: 'Johar Town',
    rating: 4.4,
    jobs: 512,
    visitFee: 500,
    distanceKm: 3.9,
    priceAdjust: 0.9,
    years: 6,
    idVerified: true,
    skillTested: false,
    bio: 'Fast AC service — same-day slots. Skill test pending, lekin 500+ gharo ka tajurba bolta hai.',
    reviews: [
      { name: 'Taha B.', stars: 4, text: 'Service jaldi ho gayi, cooling behtar hui. Rate sab se munasib.' },
      { name: 'Iqra L.', stars: 5, text: 'Garmi mein AC band ho gaya tha, 2 ghantay mein theek kar diya. Shukriya!' }
    ]
  },
  {
    id: 'shakeel-geyser',
    name: 'Shakeel Ahmad',
    shop: 'Shakeel Geyser & Heater',
    serviceId: 'geyser',
    city: 'Peshawar',
    area: 'Hayatabad Phase 2',
    rating: 4.8,
    jobs: 264,
    visitFee: 350,
    distanceKm: 1.5,
    priceAdjust: 0.95,
    years: 9,
    idVerified: true,
    skillTested: true,
    bio: 'Peshawar ki sardi mein geyser band? Gas safety check ke sath mukammal service — ek visit mein sab set.',
    reviews: [
      { name: 'Waqas Y.', stars: 5, text: 'Gas geyser ki service aur safety check dono karwaye. Ab befikar hain sardi mein.' },
      { name: 'Shazia U.', stars: 5, text: 'Heater repair karwaya, ab kamray mein garmi rehti hai. Imaandar banda hai.' }
    ]
  },
  {
    id: 'arshad-carpenter',
    name: 'Arshad Ali',
    shop: 'Arshad Wood Works',
    serviceId: 'carpenter',
    city: 'Peshawar',
    area: 'University Town',
    rating: 4.7,
    jobs: 176,
    visitFee: 450,
    distanceKm: 2.8,
    priceAdjust: 1.0,
    years: 13,
    idVerified: true,
    skillTested: true,
    bio: 'Sheesham aur deodar ka mahir. Furniture repair ho ya naya banwana — mazbooti ki guarantee.',
    reviews: [
      { name: 'Noman E.', stars: 5, text: 'Purani almari ko naya bana diya. Polish aisi ke mehmaan poochtay hain kahan se li!' },
      { name: 'Kiran W.', stars: 4, text: 'Kitchen cabinet lagwaye, mazboot kaam. Design mein thori apni marzi chalai.' }
    ]
  },
  {
    id: 'waqas-painter',
    name: 'Waqas Anwar',
    shop: 'Waqas Paint House',
    serviceId: 'painter',
    city: 'Karachi',
    area: 'Bahria Town Karachi',
    rating: 4.6,
    jobs: 208,
    visitFee: 550,
    distanceKm: 6.3,
    priceAdjust: 1.05,
    years: 8,
    idVerified: true,
    skillTested: true,
    bio: 'Bahria aur DHA ke 200+ ghar paint kar chuka. Weather-shield exterior mera speciality hai.',
    reviews: [
      { name: 'Sadia O.', stars: 5, text: 'Bahir ki dewar weather-shield karwai, barish mein ab seelan nahi aati.' },
      { name: 'Fahad I.', stars: 4, text: 'Drawing room paint karwaya, finish achi. Bas 1 din late shuru kiya.' }
    ]
  },
  {
    id: 'danish-electric',
    name: 'Danish Raza',
    shop: 'Danish Electrician',
    serviceId: 'electrician',
    city: 'Islamabad',
    area: 'Bahria Town Phase 4',
    rating: 4.9,
    jobs: 145,
    visitFee: 600,
    distanceKm: 4.8,
    priceAdjust: 1.15,
    years: 5,
    idVerified: true,
    skillTested: true,
    bio: 'Smart-home aur inverter AC wiring ka specialist. Kaam mehnga, lekin ek dafa — dobara bulaana nahi paray ga.',
    reviews: [
      { name: 'Ali C.', stars: 5, text: 'Smart switches lagwaye puray ghar mein. Wiring itni neat ke electrician dost bhi hairan.' },
      { name: 'Mariam X.', stars: 5, text: 'Rate zyada tha lekin kaam dekh kar laga paisa vasool. Highly recommended.' }
    ]
  }
];

/* Winter-prep checklist shown on the home banner (seasonal: Oct → winter). */
const WINTER_CHECKLIST = [
  'Geyser servicing (descaling) — garam pani jaldi, gas ki bachat',
  'Gas pipeline safety check — leakage se bachao',
  'Room heater repair — sardi se pehle test karwa lein',
  'Water tank cleaning — sardi mein pani ka istemal barhta hai'
];

/* Node export for test.js; in the browser these stay top-level globals. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CITIES, SERVICES, PROS, WINTER_CHECKLIST };
}
