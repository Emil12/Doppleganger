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

function defineTunes<T extends readonly RadioTune[] & { length: 1 }>(tunes: T) {
  return tunes;
}

// Every melody is invented at runtime from these seeds; no existing tune is encoded here.
export const COUNTER_RADIO_TUNES = defineTunes([
  { title: 'I Need a Hero', bpm: 150, root: 41, scale: 'minor', seed: 48151, groove: 4, swing: 0.08, wave: 'sawtooth' },
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
