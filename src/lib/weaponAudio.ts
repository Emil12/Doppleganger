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
    const now = context.currentTime;
    const blast = context.createBufferSource();
    const blastFilter = context.createBiquadFilter();
    const blastGain = context.createGain();
    const thump = context.createOscillator();
    const thumpGain = context.createGain();
    const compressor = context.createDynamicsCompressor();

    blast.buffer = blastNoise;
    const isShotgun = weapon === 'shotgun';
    blast.playbackRate.value = (isShotgun ? 0.72 : 0.92) + Math.random() * 0.1;
    blastFilter.type = 'lowpass';
    blastFilter.frequency.setValueAtTime(isShotgun ? 2_100 : 2_800, now);
    blastFilter.frequency.exponentialRampToValueAtTime(isShotgun ? 280 : 450, now + 0.22);
    blastGain.gain.setValueAtTime(isShotgun ? 1.15 : 0.8, now);
    blastGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    thump.type = 'triangle';
    thump.frequency.setValueAtTime(isShotgun ? 78 : 105, now);
    thump.frequency.exponentialRampToValueAtTime(isShotgun ? 32 : 42, now + 0.13);
    thumpGain.gain.setValueAtTime(isShotgun ? 0.85 : 0.55, now);
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

  const dispose = () => {
    if (context) void context.close();
    context = null;
    blastNoise = null;
  };

  return { enable, fire, empty, dispose };
}
