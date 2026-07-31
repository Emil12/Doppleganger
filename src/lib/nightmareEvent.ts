export const NIGHTMARE_SHIFT = 5;
export const NIGHTMARE_DURATION_MS = 5 * 60 * 1000;
export const NIGHTMARE_TRIGGER_MIN_DELAY_MS = 8_000;
export const NIGHTMARE_TRIGGER_MAX_DELAY_MS = 45_000;
export const NIGHTMARE_SHIFT_DURATION_MS =
  NIGHTMARE_DURATION_MS + NIGHTMARE_TRIGGER_MAX_DELAY_MS;

export function randomNightmareDelay() {
  const range = NIGHTMARE_TRIGGER_MAX_DELAY_MS - NIGHTMARE_TRIGGER_MIN_DELAY_MS;
  return NIGHTMARE_TRIGGER_MIN_DELAY_MS + Math.floor(Math.random() * (range + 1));
}

type MelodyNote = readonly [midi: number | null, beats: number];

const DAISY_CHORUS: MelodyNote[] = [
  [74, 3], [71, 3], [67, 3], [62, 3],
  [64, 1], [66, 1], [67, 1], [64, 2], [67, 1], [62, 3], [null, 1],
  [69, 3], [74, 3], [71, 3], [67, 3],
  [64, 1], [66, 1], [67, 1], [69, 2], [71, 1], [69, 3], [null, 1], [71, 1],
  [72, 1], [71, 1], [69, 1], [74, 2], [71, 1], [69, 1], [67, 2], [null, 1], [69, 1],
  [71, 2], [67, 1], [64, 2], [67, 1], [64, 1], [62, 2], [null, 1], [62, 1],
  [67, 2], [71, 1], [69, 1], [null, 2], [67, 2], [71, 1], [69, 1], [null, 1],
  [71, 0.5], [72, 0.5], [74, 1], [71, 1], [67, 1], [69, 2], [62, 1], [67, 3], [null, 2],
];

const BEAT_SECONDS = 1.05;

function frequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function createNightmareAudio() {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  const voices = new Set<OscillatorNode>();

  const enable = () => {
    if (!context) context = new AudioContext();
    if (context.state === 'suspended') void context.resume();
  };

  const stop = () => {
    voices.forEach((voice) => {
      try {
        voice.stop();
      } catch {
        // The voice may already have ended.
      }
    });
    voices.clear();
    master?.disconnect();
    master = null;
  };

  const scheduleVoice = (
    bus: AudioNode,
    midi: number,
    startAt: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    detune = 0,
  ) => {
    if (!context) return;
    const voice = context.createOscillator();
    const gain = context.createGain();
    voice.type = type;
    voice.frequency.value = frequency(midi);
    voice.detune.value = detune;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.06);
    gain.gain.setValueAtTime(volume, Math.max(startAt + 0.07, startAt + duration - 0.12));
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    voice.connect(gain).connect(bus);
    voice.onended = () => voices.delete(voice);
    voices.add(voice);
    voice.start(startAt);
    voice.stop(startAt + duration + 0.02);
  };

  const start = () => {
    enable();
    stop();
    if (!context || context.state !== 'running') return;

    master = context.createGain();
    const filter = context.createBiquadFilter();
    const delay = context.createDelay(1);
    const feedback = context.createGain();
    const limiter = context.createDynamicsCompressor();
    master.gain.value = 0.52;
    filter.type = 'lowpass';
    filter.frequency.value = 1_250;
    filter.Q.value = 3.2;
    delay.delayTime.value = 0.31;
    feedback.gain.value = 0.32;
    limiter.threshold.value = -10;
    limiter.knee.value = 8;
    limiter.ratio.value = 14;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.2;
    filter.connect(master);
    filter.connect(delay).connect(feedback).connect(delay);
    delay.connect(master);
    master.connect(limiter).connect(context.destination);

    const endAt = context.currentTime + NIGHTMARE_DURATION_MS / 1000;
    let cursor = context.currentTime + 0.2;
    while (cursor < endAt) {
      for (const [midi, beats] of DAISY_CHORUS) {
        const duration = beats * BEAT_SECONDS;
        if (midi !== null && cursor < endAt) {
          const noteDuration = Math.min(duration * 0.92, endAt - cursor);
          scheduleVoice(filter, midi - 12, cursor, noteDuration, 'triangle', 0.12);
          scheduleVoice(filter, midi, cursor, noteDuration, 'sine', 0.035, -13);
        }
        cursor += duration;
      }
      cursor += BEAT_SECONDS * 2;
    }
  };

  const dispose = () => {
    stop();
    if (context) void context.close();
    context = null;
  };

  return { enable, start, stop, dispose };
}
