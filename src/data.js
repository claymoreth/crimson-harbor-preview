// Crimson Harbor — every number, name and line of story in one place.
// City: Port Valen. Hero: Leo Marlow. Fixer: Mara Voss. Gangs: The Vipers,
// Harbor Kings, The Docksiders. All names are original to this game.
export const WORLD_W = 3600;
export const WORLD_H = 2700;
export const ROAD_STEP = 300;
export const ROAD_W = 64;
export const SAVE_KEY = 'crimson-harbor-save-v1';

// Port Valen is a 3x3 grid of districts, each 1200 x 900.
const DISTRICT_ROWS = [
  ['OLD PIER', 'Docks & warehouses', '#7a6a58'],
  ['MARINA BAY', 'Boats & boardwalk', '#4f7d8c'],
  ['PALM COURT', 'Quiet avenues', '#7d8c5a'],
  ['FOUNDRY ROW', 'Factories & yards', '#8a6f5c'],
  ['HARBOR VIEW', 'Downtown towers', '#5c6a8c'],
  ['CORAL ROW', 'Shops & neon', '#a06a7d'],
  ['THE SHALLOWS', 'Beach & surf', '#c2a05e'],
  ['SUNSET STRIP', 'Clubs & lights', '#c27a4e'],
  ['PORTSIDE', 'Harbor & cranes', '#6a8a7d'],
];
export const DISTRICTS = DISTRICT_ROWS.map(([name, desc, tint], i) => ({
  name, desc, tint,
  x: (i % 3) * 1200,
  y: Math.floor(i / 3) * 900,
  w: 1200,
  h: 900,
}));
export function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  }
  return DISTRICTS[4];
}

// Six drivers to pick from. Leo Marlow is the story lead (index 0).
// top/accel/sprint/aim are multipliers; hp is the on-foot health pool.
export const CHARACTERS = [
  { name: 'LEO MARLOW', role: 'GETAWAY DRIVER', top: 1.00, accel: 1.00, sprint: 1.00, aim: 1.00, hp: 100, color: '#e8b04b', bg: '#3a2f5e', shirt: '#c94f43', skin: '#e8b98a', hair: '#2b2118', shades: false, hat: null, blurb: 'Four years inside. Back to find who set him up.' },
  { name: 'DANA COLE', role: 'WHEELWOMAN', top: 1.10, accel: 1.08, sprint: 1.00, aim: 1.00, hp: 90, color: '#e86aa8', bg: '#123a4a', shirt: '#2f7d8c', skin: '#c98a5e', hair: '#14100c', shades: false, hat: null, blurb: 'Drove the fastest crew on the coast. Never caught.' },
  { name: 'MARCUS REED', role: 'ENFORCER', top: 0.94, accel: 0.95, sprint: 0.95, aim: 0.95, hp: 140, color: '#8a9aa8', bg: '#3a1f1f', shirt: '#4a4a55', skin: '#8a5a3a', hair: '#0c0a08', shades: true, hat: null, blurb: 'Built like a dock crane. Nobody pushes him around.' },
  { name: 'ANA SOLANO', role: 'RUNNER', top: 1.00, accel: 1.00, sprint: 1.22, aim: 1.05, hp: 90, color: '#7ddb8a', bg: '#1f3a2a', shirt: '#d8c94b', skin: '#e8c49a', hair: '#3a2410', shades: false, hat: null, blurb: 'On foot she outruns every siren in Port Valen.' },
  { name: 'TOMMY VALE', role: 'JOYRIDER', top: 1.06, accel: 1.12, sprint: 1.05, aim: 0.95, hp: 85, color: '#5aa8e8', bg: '#2a2a4a', shirt: '#e8e8e8', skin: '#f0c8a0', hair: '#c9a23a', shades: false, hat: '#c94f43', blurb: 'Young, reckless, and quicker than the cops.' },
  { name: 'PRIYA NAIR', role: 'SHARPSHOOTER', top: 1.00, accel: 1.00, sprint: 1.00, aim: 1.25, hp: 95, color: '#c98ae8', bg: '#3a1f3a', shirt: '#5e3a7d', skin: '#a06a3a', hair: '#0c0a08', shades: false, hat: null, blurb: 'Never misses. The Harbor Kings learned that twice.' },
];

export const GANGS = {
  vipers: { name: 'THE VIPERS', color: '#c94f43', desc: 'Rival street crew' },
  kings: { name: 'HARBOR KINGS', color: '#e8b04b', desc: 'The port runs through them' },
  docksiders: { name: 'THE DOCKSIDERS', color: '#5aa8e8', desc: 'Dockyard muscle' },
};

export const WEAPONS = [
  { name: 'FISTS', ammo: Infinity, reserve: Infinity, dmg: 12, rate: 0.32, spread: 0, auto: false, icon: 'fist' },
  { name: 'PISTOL', ammo: 12, reserve: 60, dmg: 26, rate: 0.22, spread: 0.05, auto: false, icon: 'pistol' },
  { name: 'STING SMG', ammo: 30, reserve: 150, dmg: 15, rate: 0.09, spread: 0.10, auto: true, icon: 'smg' },
  { name: 'DOCKSHOT', ammo: 6, reserve: 30, dmg: 20, rate: 0.7, spread: 0.16, auto: false, icon: 'shotgun', pellets: 5 },
  { name: 'LONGSHOT', ammo: 8, reserve: 40, dmg: 70, rate: 0.9, spread: 0.01, auto: false, icon: 'rifle' },
];

export const CARS = [
  { name: 'MARLIN GT', color: '#e84b6a', top: 1.00 },
  { name: 'HARBOR CRUISER', color: '#4b7de8', top: 0.92 },
  { name: 'SUNSET COUPE', color: '#e8a24b', top: 1.05 },
  { name: 'DOCK RUNNER', color: '#5aa87d', top: 0.95 },
  { name: 'MARINA SPORT', color: '#a84be8', top: 1.02 },
];
export const POLICE_NAMES = ['ANCHOR-12', 'TIDE-07', 'BUOY-23', 'PIER-09', 'GULL-31', 'REEF-18', 'SQUALL-44'];
export const POLICE_DEPT = 'PVPD RESPONSE'; // Port Valen Police Department

export const RADIOS = [
  { name: 'CRIMSON 88.1', show: 'Neon Drive', song: 'Midnight Harbor — The Breaklights' },
  { name: 'SUNSET ROCK 94.5', show: 'Tail Lights', song: 'Velvet Static — Tail Lights' },
  { name: 'PORTSIDE TALK 101.3', show: 'The Harbor Desk', song: 'Live from the pier' },
  { name: 'PALM FM 102.7', show: 'Salt Air', song: 'Coral Club — Salt Air' },
];

// Seven story jobs, all original to Crimson Harbor — rebuilt from scratch,
// nothing like Solmar City. Stage types: drive (reach the marker), pickup
// (press E), talk (press E at Mara), collect (press E at N points in order),
// follow (tail a courier van — stay in the band, too close is spotted,
// too far is lost), photo (on foot, press E, hold still to take the picture),
// activate (on foot, press E, hold still to light the beacon), swap (press E
// to exchange a package — only while clean), listen (on foot, stay in the
// listening ring — too close is spotted), distract (press E to set off a car
// alarm, opening a 30s window), grab (press E to take the ledger inside the
// window — if it closes, the guard returns and you distract again).
// A stage may carry extra.wanted to raise the heat when it begins, or
// extra.clean to fail the job if any heat appears during the stage.
function job(id, ch, title, reward, brief, stages) {
  return { id, ch, title, reward, brief, stages: stages.map(([type, x, y, text, next, extra]) => ({ type, x, y, text, next, ...(extra || {}) })) };
}
export const MISSIONS = [
  // M1 — a scavenger hunt, not a delivery: three envelopes Mara hid around
  // the city. No clock, no cargo, no fight — just find them all.
  job(1, 1, 'THREE ENVELOPES', 700, 'Mara stashed three envelopes around Port Valen — a new name, a clean plate, a way back in. Collect all three.', [
    ['collect', 1950, 450, 'Collect the envelopes — 0/3 (press E at each)', 'Take them to Mara', { points: [{ x: 1950, y: 450 }, { x: 1050, y: 750 }, { x: 2550, y: 450 }] }],
    ['talk', 1650, 1050, 'Take the envelopes to Mara in Harbor View', 'Job done'],
  ]),
  // M2 — surveillance, the opposite of a pursuit: tail a Kings courier van
  // and learn where the stash house is. Getting too close is what fails you.
  job(2, 2, 'THE LONG WAY HOME', 1400, 'A Kings courier is driving the night\'s take to a stash house. Tail him — don\'t get spotted, don\'t lose him — and Mara gets the address.', [
    ['drive', 2850, 1950, 'Drive to Portside — the courier leaves at dusk', 'Tail the courier'],
    ['follow', 2850, 1950, 'Tail the courier — stay close, don\'t get spotted', 'Report the stash address', { need: 25 }],
    ['talk', 1650, 1050, 'Report the stash address to Mara', 'Job done'],
  ]),
  // M3 — evidence, not a shootout: photograph a PVPD captain taking Kings
  // money. On foot, steady, unseen — the camera does the fighting.
  job(3, 3, 'PICTURE PROOF', 1800, 'A PVPD captain takes Kings money every night at the Coral Row garage. Get a photograph — on foot, steady, unseen.', [
    ['drive', 2850, 1350, 'Drive to the Coral Row garage', 'Get the photo'],
    ['photo', 2850, 1350, 'On foot — press E, hold still for the photo', 'Take the photo to Mara', { holdSecs: 3 }],
    ['talk', 1650, 1050, 'Take the photo to Mara in Harbor View', 'Job done'],
  ]),
  // M4 — a covert exchange, not a delivery: two dead drops, one clean swap.
  // Any heat at any point blows the deal — drive like a ghost.
  job(4, 4, 'THE CLEAN SWAP', 2000, 'A buyer wants Mara\'s goods and Mara wants his cash. Two dead drops, one clean swap — any heat and the deal is blown.', [
    ['drive', 750, 1350, 'Drive to the first dead drop in Foundry Row — stay clean', 'Leave the package', { clean: true }],
    ['swap', 750, 1350, 'Press E to leave the package — stay clean', 'Get the cash at the second drop', { clean: true }],
    ['drive', 1350, 2250, 'Drive to the second dead drop on Sunset Strip — stay clean', 'Pick up the cash', { clean: true }],
    ['swap', 1350, 2250, 'Press E to pick up the cash — stay clean', 'Report back', { clean: true }],
    ['talk', 1650, 1050, 'Report back to Mara', 'Job done'],
  ]),
  // M5 — eavesdropping, not combat: stay in the listening ring long enough
  // to hear the fleet's sailing time. Too close and you are spotted.
  job(5, 5, 'THE WIRE', 1600, 'The Kings are meeting at the marina tonight to set the fleet\'s sailing time. Get close enough to hear — not close enough to be seen.', [
    ['drive', 2250, 450, 'Drive to the marina in Marina Bay', 'Listen in'],
    ['listen', 1950, 450, 'Listen on foot — stay in the zone, don\'t get too close', 'Report what you heard', { inner: 120, outer: 280, need: 20 }],
    ['talk', 1650, 1050, 'Report the sailing time to Mara', 'Job done'],
  ]),
  // M6 — a timing puzzle, not a fight: set off a car alarm to pull the guard
  // away, then grab the ledger before the 30s window closes. Miss it and
  // the guard comes back — set the alarm off again.
  job(6, 6, 'THE LOUD DISTRACTION', 2500, 'The Kings keep their ledger in the Coral Row office, and a guard never leaves the door. Set off the car alarm across the street — while he\'s looking the other way, grab the ledger.', [
    ['drive', 2550, 1350, 'Drive to the Coral Row office', 'Set off the distraction'],
    ['distract', 2550, 1350, 'Press E to set off the car alarm', 'Grab the ledger — fast'],
    ['grab', 2850, 1350, 'Grab the ledger — 30s left', 'Get the ledger to Mara', { window: 30 }],
    ['talk', 1650, 1050, 'Take the ledger to Mara in Harbor View', 'Job done'],
  ]),
  // M7 — the finale is a light, not a gunfight: photograph the fleet, take
  // the lighthouse key, and light the old beacon so the whole harbor — and
  // the PVPD — sees the Kings' smuggling fleet sail.
  job(7, 7, 'LIGHT UP THE HARBOR', 4500, 'The Kings\' smuggling fleet sails tonight, dark and quiet. Light the old lighthouse and the whole harbor — and the PVPD — sees them.', [
    ['drive', 3150, 2250, 'Drive to the Portside pier — the fleet sails tonight', 'Photograph the fleet'],
    ['photo', 3150, 2250, 'On foot — press E, hold still to photograph the fleet', 'Get the lighthouse key', { holdSecs: 3 }],
    ['pickup', 450, 450, 'Press E to take the lighthouse key at Old Pier', 'Light the lighthouse'],
    ['activate', 150, 150, 'Press E and hold to light the beacon', 'Meet Mara', { holdSecs: 4 }],
    ['talk', 1650, 1050, 'Meet Mara one last time', 'Job done'],
  ]),
];

// Boss portraits — retained for import compatibility (entities.js imports
// BOSSES for spawnBoss). No current mission uses a 'boss' stage; the new
// seven jobs are won with a camera, a tail, a swap, an ear, an alarm and a
// lighthouse, not a boss fight.
export const BOSSES = {
  3: { name: 'BIG RAY CALLOWAY', role: 'HARBOR KINGS BOSS', line: 'Four years inside and you still think you\'re a driver? This harbor eats drivers. Boys — feed him to the water.', color: '#e8b04b', bg: '#6a5a30', shirt: '#8a6a2a', skin: '#d8a06a', hair: '#4a2a10', shades: false, hat: null, hp: 420, guards: 4 },
  6: { name: 'IVAN KROSS', role: 'DOCKMASTER OF THE LANTERNS', line: 'You want my lanterns dark? Then you go dark first. Boys — hold the line.', color: '#5aa8e8', bg: '#1f2a3a', shirt: '#2a4a6a', skin: '#c98a5e', hair: '#3a2a1a', shades: false, hat: '#e8b04b', hp: 380, guards: 2 },
  7: { name: 'DARIO VENN', role: 'THE MAN WHO SET LEO UP', line: 'You should have stayed in your cell, Marlow. I signed that paper once — I\'ll sign it again.', color: '#c94f43', bg: '#1f2a3a', shirt: '#2a3a55', skin: '#c98a5e', hair: '#e8e8e8', shades: false, hat: null, hp: 520, guards: 6 },
};

export const MARA = { name: 'MARA VOSS', role: 'FIXER', color: '#e86aa8', bg: '#2a1f3a', shirt: '#7d2a5e', skin: '#e8c49a', hair: '#14100c', shades: false, hat: null };
export const STORY_HOOK = 'Four years inside for a job that went sideways. Leo Marlow is back in Port Valen — and the man who set him up still owns the tide.';

export const LEGEND = [
  { icon: 'you', label: 'You are here' },
  { icon: 'contact', label: 'Story contact' },
  { icon: 'objective', label: 'Job objective' },
  { icon: 'safehouse', label: 'Safehouse' },
  { icon: 'weapons', label: 'Weapons' },
  { icon: 'respray', label: 'Respray (clears heat)' },
  { icon: 'race', label: 'Street race' },
  { icon: 'property', label: 'Property' },
  { icon: 'hospital', label: 'Hospital' },
  { icon: 'police', label: 'Police' },
  { icon: 'collectible', label: 'Collectible' },
];

// Fixed points of interest on the map.
export const POIS = [
  { type: 'safehouse', x: 2550, y: 1950, name: 'Safehouse' },
  { type: 'safehouse', x: 450, y: 450, name: 'Old Pier Safehouse' },
  { type: 'weapons', x: 1950, y: 750, name: 'Harbor Arms' },
  { type: 'respray', x: 2250, y: 1650, name: 'Crimson Respray' },
  { type: 'hospital', x: 1350, y: 1650, name: 'St. Marina Hospital' },
  { type: 'race', x: 750, y: 2250, name: 'Strip Race' },
  { type: 'property', x: 2850, y: 750, name: 'Palm Court Flat', price: 5000 },
  { type: 'property', x: 750, y: 1050, name: 'Foundry Loft', price: 8000 },
  { type: 'contact', x: 1650, y: 1050, name: 'Mara Voss' },
];
