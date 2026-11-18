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

// Seven story jobs, all original to Crimson Harbor. A stage is one of: drive
// (reach the marker), pickup (press E), shoot (drop N of a gang), boss
// (dialog, then drop the boss + guards), escape (reach the safehouse, then
// lose the heat), deliver (drive, on a clock), talk (press E at Mara).
// A stage may carry extra.wanted to raise the heat when it begins.
function job(id, ch, title, reward, brief, stages) {
  return { id, ch, title, reward, brief, stages: stages.map(([type, x, y, text, next, extra]) => ({ type, x, y, text, next, ...(extra || {}) })) };
}
export const MISSIONS = [
  // M1 — Leo walks out of Port Valen Penitentiary and the PVPD is already
  // waiting. No package, no plan: break the cordon and vanish.
  job(1, 1, 'GATES OPEN', 800, 'Leo walks out of prison and the PVPD is already waiting. No plan — just run.', [
    ['drive', 450, 450, 'Cut through Old Pier — the cordon is behind you', 'Break the cordon', { wanted: 4 }],
    ['escape', 2550, 1950, 'Break line of sight, then reach the safehouse', 'Mara is waiting'],
    ['talk', 1650, 1050, 'Mara is waiting in Harbor View', 'Job done'],
  ]),
  // M2 — on-foot cleanup at the Vipers pit on Sunset Strip.
  job(2, 2, 'VIPER PIT', 1200, 'The Vipers torched Mara\'s stash on the Strip. Go in on foot and clear the pit.', [
    ['drive', 750, 2250, 'Drive to the Vipers pit on Sunset Strip', 'Get out and settle it'],
    ['shoot', 750, 2250, 'Clear the pit — 6 Vipers down', 'Lose any heat', { count: 6, gang: 'vipers' }],
    ['escape', 2550, 1950, 'Lose the heat, then reach the safehouse', 'Report back'],
    ['talk', 1650, 1050, 'Report back to Mara in Harbor View', 'Job done'],
  ]),
  // M3 — boss Big Ray Calloway + his guards at the Kings dock.
  job(3, 3, 'RAY\'S LAST TIDE', 2000, 'Big Ray Calloway thinks the harbor is his. Prove him wrong — at the Kings\' own dock.', [
    ['drive', 2850, 1650, 'Drive to the Kings dock in Portside', 'Face Big Ray'],
    ['boss', 2850, 1650, 'Take down Big Ray Calloway', 'Lose any heat'],
    ['escape', 2550, 1950, 'Lose the heat, then reach the safehouse', 'Report back'],
    ['talk', 1650, 1050, 'Report back to Mara in Harbor View', 'Job done'],
  ]),
  // M4 — sabotage: burn the Kings' pirate radio relay, no cargo, no kills.
  job(4, 4, 'STATIC BURN', 1500, 'The Harbor Kings run a pirate relay that snitches on every crew in the city. Mara wants it dark.', [
    ['drive', 1950, 750, 'Drive to the relay tower in Harbor View', 'Plant the charge'],
    ['pickup', 1950, 750, 'Press E to plant the charge', 'The tower is burning'],
    ['escape', 2550, 1950, 'Lose the heat, then reach the safehouse', 'Report back'],
    ['talk', 1650, 1050, 'Report back to Mara in Harbor View', 'Job done'],
  ]),
  // M5 — rescue the ferryman from the Docksiders and drive him out.
  job(5, 5, 'FERRYMAN\'S DUE', 1800, 'A ferryman who owes Mara is being squeezed by the Docksiders on the east pier. Get him out.', [
    ['drive', 2850, 750, 'Drive to the ferryman on the east pier', 'Get him in the car'],
    ['pickup', 2850, 750, 'Press E to get the ferryman in the car', 'Drive — they are coming'],
    ['escape', 2550, 1950, 'Outrun the Docksiders to the safehouse', 'Report back'],
    ['talk', 1650, 1050, 'Report back to Mara in Harbor View', 'Job done'],
  ]),
  // M6 — five of the lantern crew, then the Dockmaster himself.
  job(6, 6, 'FIVE LANTERNS', 2500, 'The Docksiders light five signal lanterns along the south port to guide their smugglers in. Mara wants them dark.', [
    ['drive', 2850, 2250, 'Drive to the lanterns at the south port', 'Drop the lantern crew'],
    ['shoot', 2850, 2250, 'Drop the lantern crew — 5 down', 'The Dockmaster is next', { count: 5, gang: 'docksiders' }],
    ['boss', 2850, 2250, 'Take down the Dockmaster', 'Lose any heat'],
    ['escape', 2550, 1950, 'Lose the heat, then reach the safehouse', 'Job done'],
  ]),
  // M7 — boss Dario Venn at his Palm Court penthouse.
  job(7, 7, 'THE MAN WHO SIGNED', 4000, 'Dario Venn signed the paper that put Leo inside four years ago. Tonight, at his own penthouse, Leo makes him unsign it.', [
    ['drive', 2850, 450, 'Drive to Venn\'s penthouse in Palm Court', 'Go in loud'],
    ['boss', 2850, 450, 'Take down Dario Venn and his crew', 'Lose any heat'],
    ['escape', 2550, 1950, 'Lose the heat, then reach the safehouse', 'Finish it'],
    ['talk', 1650, 1050, 'Meet Mara one last time', 'Job done'],
  ]),
];

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
