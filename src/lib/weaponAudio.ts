import { type WeaponKind } from './weaponTypes';

export function createWeaponAudio() {
  let context: AudioContext | null = null;
  let blastNoise: AudioBuffer | null = null;

  const enable = () => {
    if (!context) {
      context = new AudioContext();
      blastNoise = context.createBuffer(1, context.sampleRate * 0.32, context.sampleRate);
      const samples = blastNoise.getChannelData(0);
      for (let index = 0; index < samples.length; index += 1) {
        const decay = Math.exp((-index / samples.length) * 8);
        samples[index] = (Math.random() * 2 - 1) * decay;
      }
    }
    if (context.state === 'suspended') void context.resume();
  };

  const fire = (weapon: WeaponKind) => {
    if (!context || !blastNoise || context.state !== 'running') return;
    const profile = {
      shotgun: { rate: 0.75, filter: 2_100, thump: 78, gain: 1.15 },
      revolver: { rate: 1.18, filter: 3_600, thump: 105, gain: 0.72 },
      rifle: { rate: 1.42, filter: 4_200, thump: 92, gain: 1.05 },
      double_barrel: { rate: 0.58, filter: 1_750, thump: 62, gain: 1.35 },
    }[weapon];
    const now = context.currentTime;
    const blast = context.createBufferSource();
    const blastFilter = context.createBiquadFilter();
    const blastGain = context.createGain();
    const thump = context.createOscillator();
    const thumpGain = context.createGain();
    const compressor = context.createDynamicsCompressor();

    blast.buffer = blastNoise;
    blast.playbackRate.value = profile.rate + Math.random() * 0.08;
    blastFilter.type = 'lowpass';
    blastFilter.frequency.setValueAtTime(profile.filter, now);
    blastFilter.frequency.exponentialRampToValueAtTime(280, now + 0.22);
    blastGain.gain.setValueAtTime(profile.gain, now);
    blastGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    thump.type = 'triangle';
    thump.frequency.setValueAtTime(profile.thump, now);
    thump.frequency.exponentialRampToValueAtTime(32, now + 0.13);
    thumpGain.gain.setValueAtTime(0.85, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    compressor.threshold.value = -12;
    compressor.ratio.value = 8;
    blast.connect(blastFilter).connect(blastGain).connect(compressor);
    thump.connect(thumpGain).connect(compressor);
    compressor.connect(context.destination);
    blast.start(now);
    blast.stop(now + 0.32);
    thump.start(now);
    thump.stop(now + 0.15);
  };

  const empty = () => {
    if (!context || context.state !== 'running') return;
    const now = context.currentTime;
    const click = context.createOscillator();
    const gain = context.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(1200, now);
    click.frequency.exponentialRampToValueAtTime(350, now + 0.035);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    click.connect(gain).connect(context.destination);
    click.start(now);
    click.stop(now + 0.045);
  };

  const jumpscare = () => {
    if (!context || !blastNoise || context.state !== 'running') return;
    const now = context.currentTime;
    const impact = now + 0.2;
    const noise = context.createBufferSource();
    const noiseFilter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    const scream = context.createOscillator();
    const screamGain = context.createGain();
    const shriek = context.createOscillator();
    const shriekGain = context.createGain();
    const thump = context.createOscillator();
    const thumpGain = context.createGain();
    const growl = context.createOscillator();
    const growlGain = context.createGain();
    const limiter = context.createDynamicsCompressor();

    noise.buffer = blastNoise;
    noise.loop = true;
    noise.playbackRate.value = 0.55;
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(320, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(1_900, impact);
    noiseFilter.frequency.exponentialRampToValueAtTime(210, impact + 0.88);
    noiseFilter.Q.value = 2.5;
    noiseGain.gain.setValueAtTime(0.015, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.05, impact - 0.02);
    noiseGain.gain.setValueAtTime(0.95, impact);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, impact + 0.9);

    scream.type = 'sawtooth';
    scream.frequency.setValueAtTime(430, impact);
    scream.frequency.exponentialRampToValueAtTime(48, impact + 0.82);
    screamGain.gain.setValueAtTime(0.52, impact);
    screamGain.gain.exponentialRampToValueAtTime(0.0001, impact + 0.9);

    shriek.type = 'square';
    shriek.frequency.setValueAtTime(1_450, impact);
    shriek.frequency.exponentialRampToValueAtTime(95, impact + 0.52);
    shriekGain.gain.setValueAtTime(0.19, impact);
    shriekGain.gain.exponentialRampToValueAtTime(0.0001, impact + 0.6);

    thump.type = 'sine';
    thump.frequency.setValueAtTime(78, impact);
    thump.frequency.exponentialRampToValueAtTime(24, impact + 0.34);
    thumpGain.gain.setValueAtTime(0.78, impact);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, impact + 0.4);

    growl.type = 'sawtooth';
    growl.frequency.setValueAtTime(118, impact);
    growl.frequency.exponentialRampToValueAtTime(31, impact + 1.05);
    growlGain.gain.setValueAtTime(0.34, impact);
    growlGain.gain.exponentialRampToValueAtTime(0.0001, impact + 1.08);

    limiter.threshold.value = -16;
    limiter.ratio.value = 14;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.18;
    noise.connect(noiseFilter).connect(noiseGain).connect(limiter);
    scream.connect(screamGain).connect(limiter);
    shriek.connect(shriekGain).connect(limiter);
    thump.connect(thumpGain).connect(limiter);
    growl.connect(growlGain).connect(limiter);
    limiter.connect(context.destination);
    noise.start(now);
    noise.stop(impact + 0.92);
    scream.start(impact);
    scream.stop(impact + 0.92);
    shriek.start(impact);
    shriek.stop(impact + 0.62);
    thump.start(impact);
    thump.stop(impact + 0.42);
    growl.start(impact);
    growl.stop(impact + 1.1);
  };

  const dispose = () => {
    if (context) void context.close();
    context = null;
    blastNoise = null;
  };

  return { enable, fire, empty, jumpscare, dispose };
}
