export function createFootstepAudio() {
  let context: AudioContext | null = null;
  let noise: AudioBuffer | null = null;
  let nextStepAt = 0;
  let foot = 1;

  const enable = () => {
    if (!context) {
      context = new AudioContext();
      noise = context.createBuffer(1, context.sampleRate * 0.12, context.sampleRate);
      const samples = noise.getChannelData(0);
      for (let index = 0; index < samples.length; index += 1) {
        samples[index] = Math.random() * 2 - 1;
      }
    }
    if (context.state === 'suspended') void context.resume();
  };

  const playStep = () => {
    if (!context || !noise || context.state !== 'running') return;
    const now = context.currentTime;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const pan = context.createStereoPanner();

    source.buffer = noise;
    source.playbackRate.value = 0.88 + Math.random() * 0.18;
    filter.type = 'lowpass';
    filter.frequency.value = 650 + Math.random() * 180;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    pan.pan.value = foot * 0.08;
    foot *= -1;

    source.connect(filter).connect(gain).connect(pan).connect(context.destination);
    source.start(now);
    source.stop(now + 0.12);
  };

  const update = (time: number, moving: boolean, sprinting: boolean) => {
    if (!moving) {
      nextStepAt = 0;
      return;
    }
    if (nextStepAt === 0 || time >= nextStepAt) {
      playStep();
      nextStepAt = time + (sprinting ? 285 : 430);
    }
  };

  const dispose = () => {
    if (context) void context.close();
    context = null;
    noise = null;
  };

  return { enable, update, dispose };
}
