export type RadioScale = 'major' | 'minor' | 'dorian' | 'pentatonic' | 'whole';

export type RadioTune = {
  title: string;
  bpm: number;
  root: number;
  scale: RadioScale;
  seed: number;
  groove: 0 | 1 | 2 | 3 | 4;
  swing: number;
  wave: OscillatorType;
};

function defineTunes<T extends readonly RadioTune[] & { length: 25 }>(tunes: T) {
  return tunes;
}

// Every melody is invented at runtime from these seeds; no existing tune is encoded here.
export const COUNTER_RADIO_TUNES = defineTunes([
  { title: 'Checkout Goblin Bounce', bpm: 132, root: 43, scale: 'minor', seed: 1103, groove: 0, swing: 0.12, wave: 'square' },
  { title: 'Microwave Apology', bpm: 96, root: 48, scale: 'whole', seed: 2207, groove: 1, swing: 0.04, wave: 'triangle' },
  { title: 'Tax Frog Turbo', bpm: 158, root: 38, scale: 'dorian', seed: 3319, groove: 2, swing: 0.08, wave: 'sawtooth' },
  { title: 'Receipt Printer Rave', bpm: 144, root: 45, scale: 'pentatonic', seed: 4421, groove: 3, swing: 0.02, wave: 'square' },
  { title: 'Suspicious Banana Strut', bpm: 112, root: 41, scale: 'major', seed: 5531, groove: 4, swing: 0.16, wave: 'triangle' },
  { title: 'Tiny Cart Grand Prix', bpm: 168, root: 36, scale: 'minor', seed: 6653, groove: 2, swing: 0.05, wave: 'sawtooth' },
  { title: 'Coupon Wizard Picnic', bpm: 104, root: 46, scale: 'major', seed: 7757, groove: 1, swing: 0.14, wave: 'square' },
  { title: 'Pickle Alarm Deluxe', bpm: 150, root: 40, scale: 'whole', seed: 8861, groove: 3, swing: 0.03, wave: 'triangle' },
  { title: 'Manager Is A Pigeon', bpm: 118, root: 43, scale: 'dorian', seed: 9973, groove: 0, swing: 0.11, wave: 'sawtooth' },
  { title: 'Snack Aisle Moonwalk', bpm: 126, root: 37, scale: 'pentatonic', seed: 10177, groove: 4, swing: 0.17, wave: 'square' },
  { title: 'Bonk Before Breakfast', bpm: 172, root: 42, scale: 'minor', seed: 11287, groove: 2, swing: 0.01, wave: 'triangle' },
  { title: 'Emergency Cheese Meeting', bpm: 92, root: 49, scale: 'major', seed: 12391, groove: 1, swing: 0.13, wave: 'sine' },
  { title: 'Soda Machine Prophecy', bpm: 138, root: 39, scale: 'whole', seed: 13513, groove: 3, swing: 0.06, wave: 'square' },
  { title: 'Bread On The Run', bpm: 154, root: 44, scale: 'dorian', seed: 14621, groove: 0, swing: 0.09, wave: 'sawtooth' },
  { title: 'Unpaid Intern Disco', bpm: 122, root: 36, scale: 'pentatonic', seed: 15733, groove: 4, swing: 0.15, wave: 'triangle' },
  { title: 'Cursed Loyalty Card', bpm: 108, root: 47, scale: 'minor', seed: 16843, groove: 1, swing: 0.07, wave: 'square' },
  { title: 'Three AM Hotdog', bpm: 164, root: 41, scale: 'whole', seed: 17957, groove: 2, swing: 0.03, wave: 'sawtooth' },
  { title: 'Pocket Full Of Croutons', bpm: 116, root: 45, scale: 'major', seed: 18061, groove: 0, swing: 0.18, wave: 'triangle' },
  { title: 'Parking Lot Kazoo', bpm: 146, root: 38, scale: 'dorian', seed: 19181, groove: 3, swing: 0.1, wave: 'square' },
  { title: 'Cashier Crab Walk', bpm: 134, root: 42, scale: 'pentatonic', seed: 20287, groove: 4, swing: 0.14, wave: 'sawtooth' },
  { title: 'Freezer Door Philosophy', bpm: 88, root: 48, scale: 'minor', seed: 21391, groove: 1, swing: 0.05, wave: 'sine' },
  { title: 'Nacho Helmet Sprint', bpm: 176, root: 35, scale: 'major', seed: 22501, groove: 2, swing: 0.02, wave: 'square' },
  { title: 'The Mop Knows Too Much', bpm: 128, root: 44, scale: 'whole', seed: 23609, groove: 3, swing: 0.12, wave: 'triangle' },
  { title: 'Inventory Duck Parade', bpm: 110, root: 39, scale: 'dorian', seed: 24733, groove: 0, swing: 0.16, wave: 'sawtooth' },
  { title: 'Final Snack Boss', bpm: 160, root: 40, scale: 'pentatonic', seed: 25847, groove: 4, swing: 0.08, wave: 'square' },
] as const);

export const COUNTER_RADIO_TUNE_COUNT = COUNTER_RADIO_TUNES.length;

const SCALES: Record<RadioScale, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  pentatonic: [0, 3, 5, 7, 10],
  whole: [0, 2, 4, 6, 8, 10],
};

const LEAD_MASKS = [0xa6ad, 0x9295, 0xd2d5, 0xa949, 0xb6b5] as const;

function hash(seed: number) {
  let value = seed | 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return (value ^ (value >>> 16)) >>> 0;
}

export type RadioStep = {
  lead: number | null;
  bass: number | null;
  kick: boolean;
  snare: boolean;
  hat: boolean;
  slide: boolean;
};

export function makeRadioStep(tune: RadioTune, step: number): RadioStep {
  const beat = step % 16;
  const phrase = Math.floor(step / 16) % 4;
  const value = hash(tune.seed + step * 7919 + phrase * 104729);
  const scale = SCALES[tune.scale];
  const degree = value % scale.length;
  const octave = (value >>> 8) % 3;
  const hasLead = (LEAD_MASKS[tune.groove] & (1 << beat)) !== 0;
  const bassDegree = (phrase + tune.groove) % Math.min(4, scale.length);

  return {
    lead: hasLead ? tune.root + 12 + scale[degree] + octave * 12 : null,
    bass: beat % 4 === 0 ? tune.root - 12 + scale[bassDegree] : null,
    kick: beat === 0 || beat === 8 || (tune.groove > 1 && beat === 11),
    snare: beat === 4 || beat === 12,
    hat: beat % 2 === 0 || ((value >>> 12) & 3) === 0,
    slide: ((value >>> 18) & 7) === 0,
  };
}
