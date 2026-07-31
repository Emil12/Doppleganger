import { makeRadioStep, type RadioTune } from './counterRadioTunes';

type RememberVoice = (voice: AudioScheduledSourceNode) => void;

function midiFrequency(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

function oscillatorVoice(
  context: AudioContext,
  output: AudioNode,
  time: number,
  frequency: number,
  duration: number,
  volume: number,
  wave: OscillatorType,
  remember: RememberVoice,
  slide = false,
) {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(slide ? frequency * 1.7 : frequency, time);
  oscillator.frequency.exponentialRampToValueAtTime(frequency, time + Math.min(0.07, duration / 2));
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(5_500, frequency * 8), time);
  filter.frequency.exponentialRampToValueAtTime(Math.max(280, frequency * 2), time + duration);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(filter).connect(gain).connect(output);
  remember(oscillator);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.01);
}

function scheduleKick(
  context: AudioContext,
  output: AudioNode,
  time: number,
  remember: RememberVoice,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(125, time);
  oscillator.frequency.exponentialRampToValueAtTime(42, time + 0.11);
  gain.gain.setValueAtTime(0.26, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.13);
  oscillator.connect(gain).connect(output);
  remember(oscillator);
  oscillator.start(time);
  oscillator.stop(time + 0.14);
}

function scheduleSnare(
  context: AudioContext,
  output: AudioNode,
  time: number,
  remember: RememberVoice,
) {
  oscillatorVoice(context, output, time, 185, 0.09, 0.075, 'square', remember, true);
  oscillatorVoice(context, output, time, 2_200, 0.045, 0.025, 'sawtooth', remember);
}

function scheduleHat(
  context: AudioContext,
  output: AudioNode,
  time: number,
  remember: RememberVoice,
) {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = 6_400;
  filter.type = 'highpass';
  filter.frequency.value = 4_900;
  gain.gain.setValueAtTime(0.026, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025);
  oscillator.connect(filter).connect(gain).connect(output);
  remember(oscillator);
  oscillator.start(time);
  oscillator.stop(time + 0.03);
}

export function scheduleRadioStep(
  context: AudioContext,
  output: AudioNode,
  tune: RadioTune,
  stepIndex: number,
  time: number,
  stepDuration: number,
  remember: RememberVoice,
) {
  const step = makeRadioStep(tune, stepIndex);
  if (step.lead !== null) {
    oscillatorVoice(
      context,
      output,
      time,
      midiFrequency(step.lead),
      stepDuration * 0.82,
      0.075,
      tune.wave,
      remember,
      step.slide,
    );
  }
  if (step.bass !== null) {
    oscillatorVoice(
      context,
      output,
      time,
      midiFrequency(step.bass),
      stepDuration * 1.6,
      0.11,
      'triangle',
      remember,
    );
  }
  if (step.kick) scheduleKick(context, output, time, remember);
  if (step.snare) scheduleSnare(context, output, time, remember);
  if (step.hat) scheduleHat(context, output, time, remember);
}
