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
  { name: 'FALCON GT', color: '#e84b6a', top: 1.00 },
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

// Seven story jobs. A stage is one of: drive (reach the marker), pickup (press
// E), shoot (drop N of a gang), boss (dialog, then drop the boss + guards),
// escape (reach the safehouse, then lose the heat), deliver (drive, on a clock),
// talk (press E at Mara). The mission ends after its last stage.
function job(id, ch, title, reward, brief, stages) {
  return { id, ch, title, reward, brief, stages: stages.map(([type, x, y, text, next, extra]) => ({ type, x, y, text, next, ...(extra || {}) })) };
}
export const MISSIONS = [
  job(1, 1, 'FIRST LIGHT', 800, 'Mara needs a driver tonight. Pick up her package, then bring it home.', [
    ['drive', 1050, 450, 'Drive to Mara\'s pickup on Marina Bay', 'Pick up the package'],
    ['pickup', 1050, 450, 'Press E to take the package', 'Cops are coming — run'],
    ['escape', 2550, 1950, 'Lose the cops, then reach the safehouse', 'Break line of sight'],
    ['escape', 2550, 1950, 'Reach the safehouse on Sunset Strip', 'Job done'],
  ]),
  job(2, 2, 'DOCKSIDE DEBT', 1200, 'The Vipers owe Mara money. Collect it — loudly, on foot.', [
    ['drive', 450, 1650, 'Drive to the docks in Old Pier', 'Get out and settle it'],
    ['shoot', 450, 1650, 'Take out the Vipers crew', 'Lose any heat', { count: 6, gang: 'vipers' }],
    ['escape', 2550, 1950, 'Lose the heat, then reach the safehouse', 'Report back'],
    ['talk', 1650, 1050, 'Report back to Mara in Harbor View', 'Job done'],
  ]),
  job(3, 3, 'KING OF THE HARBOR', 2000, 'Big Ray Calloway runs the Harbor Kings. End his run tonight.', [
    ['drive', 2850, 1950, 'Drive to the Kings warehouse in Portside', 'Face Big Ray'],
    ['boss', 2850, 1950, 'Take down Big Ray Calloway', 'Lose any heat'],
    ['escape', 2550, 1950, 'Lose the heat, then reach the safehouse', 'Report back'],
    ['talk', 1650, 1050, 'Report back to Mara in Harbor View', 'Job done'],
  ]),
  job(4, 4, 'THE LONG HAUL', 1500, 'A truck full of cargo has to cross the city before dawn. Fast.', [
    ['drive', 450, 450, 'Drive to the truck in Old Pier', 'Take the wheel'],
    ['deliver', 2850, 450, 'Haul the cargo to Palm Court — keep it moving', 'Drop it off'],
    ['deliver', 2850, 1950, 'Deliver the cargo to Portside', 'Lose any heat'],
    ['escape', 2550, 1950, 'Lose the heat, then reach the safehouse', 'Job done'],
  ]),
  job(5, 5, 'SAFEHOUSE RUN', 1800, 'Mara\'s runner is exposed. Drive him home while the Vipers chase you.', [
    ['drive', 1650, 450, 'Drive to the runner in Marina Bay', 'Pick him up'],
    ['pickup', 1650, 450, 'Press E to pick up the runner', 'Drive — they are coming'],
    ['escape', 2550, 1950, 'Outrun the Vipers to the safehouse', 'Lose any heat'],
    ['escape', 2550, 1950, 'Reach the safehouse on Sunset Strip', 'Job done'],
  ]),
  job(6, 6, 'HARBOR HEIST', 2500, 'The Docksiders guard a shipment at the port. Take it. All of it.', [
    ['drive', 2850, 1650, 'Drive to the port in Portside', 'Clear the dock'],
    ['shoot', 2850, 1650, 'Take out the Docksiders crew', 'Grab the shipment', { count: 8, gang: 'docksiders' }],
    ['pickup', 2850, 1650, 'Press E to grab the shipment', 'Run — cops are coming'],
    ['escape', 2550, 1950, 'Escape to the safehouse on Sunset Strip', 'Job done'],
  ]),
  job(7, 7, 'THE RECKONING', 4000, 'Dario Venn set Leo up four years ago. Tonight Leo collects.', [
    ['drive', 1650, 1350, 'Drive to Venn\'s tower in Harbor View', 'Go in loud'],
    ['boss', 1650, 1350, 'Take down Dario Venn and his crew', 'Lose any heat'],
    ['escape', 2550, 1950, 'Lose the heat, then reach the safehouse', 'Finish it'],
    ['talk', 1650, 1050, 'Meet Mara one last time', 'Job done'],
  ]),
];

export const BOSSES = {
  3: { name: 'BIG RAY CALLOWAY', role: 'HARBOR KINGS BOSS', line: 'You picked the wrong harbor, kid. Boys — wash him out.', color: '#e8b04b', bg: '#6a5a30', shirt: '#8a6a2a', skin: '#d8a06a', hair: '#4a2a10', shades: false, hat: null, hp: 420, guards: 4 },
  7: { name: 'DARIO VENN', role: 'THE MAN WHO SET LEO UP', line: 'Four years, and you still come crawling back. Finish him.', color: '#c94f43', bg: '#1f2a3a', shirt: '#2a3a55', skin: '#c98a5e', hair: '#e8e8e8', shades: false, hat: null, hp: 520, guards: 6 },
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
