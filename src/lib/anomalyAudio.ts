import { type AnomalyKind } from './anomalyTypes';

type Tone = OscillatorType;

export function createAnomalyAudio() {
  let context: AudioContext | null = null;
  let noise: AudioBuffer | null = null;

  const ensureAudio = () => {
    if (!context) context = new AudioContext();
    if (!noise) {
      noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const channel = noise.getChannelData(0);
      for (let index = 0; index < channel.length; index += 1) {
        channel[index] = Math.random() * 2 - 1;
      }
    }
    return context;
  };

  const tone = (
    start: number,
    duration: number,
    from: number,
    to: number,
    volume: number,
    type: Tone,
  ) => {
    const audio = ensureAudio();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  };

  const breath = (start: number, duration: number, volume: number, frequency: number) => {
    const audio = ensureAudio();
    if (!noise) return;
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = noise;
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = 2.8;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + duration * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start(start);
    source.stop(start + duration);
  };

  const playScream = (start: number, volume: number) => {
    breath(start, 1.15, volume * 0.55, 1_900);
    tone(start, 1.05, 720, 105, volume, 'sawtooth');
    tone(start + 0.05, 0.9, 530, 82, volume * 0.55, 'square');
  };

  const playSob = (start: number, volume: number) => {
    for (let burst = 0; burst < 2; burst += 1) {
      const at = start + burst * 0.28;
      breath(at, 0.32, volume * 0.7, 720);
      tone(at, 0.3, 235 - burst * 20, 145, volume * 0.38, 'sine');
    }
  };

  const playClicks = (start: number, volume: number) => {
    for (let click = 0; click < 4; click += 1) {
      tone(start + click * 0.075, 0.055, 180, 68, volume * 0.55, 'square');
    }
  };

  const playWhisper = (start: number, volume: number) => {
    breath(start, 1.4, volume * 0.42, 420);
    tone(start, 1.3, 72, 44, volume * 0.18, 'sine');
  };

  const vocalize = (kind: AnomalyKind, distance: number) => {
    const audio = ensureAudio();
    if (audio.state !== 'running') return 500;
    const volume = Math.max(0.025, Math.min(0.34, (1 - distance / 24) * 0.34));
    const start = audio.currentTime + 0.01;
    if (kind === 'screamer') playScream(start, volume);
    if (kind === 'crier') playSob(start, volume);
    if (kind === 'crawler') playClicks(start, volume);
    if (kind === 'stalker') playWhisper(start, volume);
    if (kind === 'screamer') return 2_400 + Math.random() * 2_200;
    if (kind === 'crier') return 700 + Math.random() * 500;
    if (kind === 'crawler') return 1_100 + Math.random() * 850;
    return 2_000 + Math.random() * 1_800;
  };

  const enable = () => {
    const audio = ensureAudio();
    if (audio.state === 'suspended') void audio.resume();
  };

  const dispose = () => {
    if (context) void context.close();
    context = null;
    noise = null;
  };

  return { enable, vocalize, dispose };
}

export type AnomalyAudio = ReturnType<typeof createAnomalyAudio>;
