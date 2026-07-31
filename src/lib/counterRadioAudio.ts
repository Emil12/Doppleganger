import { scheduleRadioStep } from './counterRadioSynth';
import {
  COUNTER_RADIO_TUNE_COUNT,
  COUNTER_RADIO_TUNES,
} from './counterRadioTunes';

type Point3 = { x: number; y: number; z: number };

export type RadioSelection = {
  index: number;
  title: string;
  total: number;
};

export function createCounterRadioAudio() {
  let context: AudioContext | null = null;
  let mix: GainNode | null = null;
  let panner: PannerNode | null = null;
  let master: GainNode | null = null;
  let schedulerTimer: number | null = null;
  let tuneIndex = -1;
  let stepIndex = 0;
  let nextStepAt = 0;
  let disposed = false;
  const voices = new Set<AudioScheduledSourceNode>();

  const remember = (voice: AudioScheduledSourceNode) => {
    voices.add(voice);
    voice.onended = () => voices.delete(voice);
  };

  const stopVoices = () => {
    voices.forEach((voice) => {
      try {
        voice.stop();
      } catch {
        // A voice that already ended needs no further cleanup.
      }
    });
    voices.clear();
  };

  const prepare = () => {
    if (context || disposed || typeof AudioContext === 'undefined') return;
    context = new AudioContext();
    mix = context.createGain();
    const compressor = context.createDynamicsCompressor();
    panner = context.createPanner();
    master = context.createGain();
    mix.gain.value = 0.72;
    compressor.threshold.value = -18;
    compressor.ratio.value = 6;
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1.4;
    panner.maxDistance = 18;
    panner.rolloffFactor = 1.15;
    master.gain.value = 0.42;
    mix.connect(compressor).connect(panner).connect(master).connect(context.destination);
  };

  const schedule = () => {
    if (!context || !mix || context.state !== 'running' || tuneIndex < 0) return;
    const now = context.currentTime;
    if (nextStepAt < now - 0.1) nextStepAt = now + 0.025;
    const horizon = now + 0.22;
    const tune = COUNTER_RADIO_TUNES[tuneIndex];
    const baseDuration = 60 / tune.bpm / 4;

    for (let scheduled = 0; nextStepAt < horizon && scheduled < 8; scheduled += 1) {
      const swing = stepIndex % 2 === 0 ? 1 + tune.swing : 1 - tune.swing;
      const duration = baseDuration * swing;
      scheduleRadioStep(context, mix, tune, stepIndex, nextStepAt, duration, remember);
      nextStepAt += duration;
      stepIndex = (stepIndex + 1) % 64;
    }
  };

  const nextTune = (): RadioSelection | null => {
    prepare();
    if (!context || disposed) return null;
    tuneIndex = (tuneIndex + 1) % COUNTER_RADIO_TUNE_COUNT;
    stepIndex = 0;
    nextStepAt = context.currentTime + 0.035;
    stopVoices();
    if (schedulerTimer === null) schedulerTimer = window.setInterval(schedule, 70);
    if (context.state === 'suspended') {
      void context.resume().then(schedule).catch(() => undefined);
    } else {
      schedule();
    }
    return {
      index: tuneIndex,
      title: COUNTER_RADIO_TUNES[tuneIndex].title,
      total: COUNTER_RADIO_TUNE_COUNT,
    };
  };

  const updateSpatial = (
    source: Point3,
    listenerPosition: Point3,
    forward: Point3,
    up: Point3,
  ) => {
    if (!context || !panner) return;
    const time = context.currentTime;
    panner.positionX.setValueAtTime(source.x, time);
    panner.positionY.setValueAtTime(source.y, time);
    panner.positionZ.setValueAtTime(source.z, time);
    const listener = context.listener;
    listener.positionX.setValueAtTime(listenerPosition.x, time);
    listener.positionY.setValueAtTime(listenerPosition.y, time);
    listener.positionZ.setValueAtTime(listenerPosition.z, time);
    listener.forwardX.setValueAtTime(forward.x, time);
    listener.forwardY.setValueAtTime(forward.y, time);
    listener.forwardZ.setValueAtTime(forward.z, time);
    listener.upX.setValueAtTime(up.x, time);
    listener.upY.setValueAtTime(up.y, time);
    listener.upZ.setValueAtTime(up.z, time);
  };

  const stop = () => {
    tuneIndex = -1;
    if (schedulerTimer !== null) window.clearInterval(schedulerTimer);
    schedulerTimer = null;
    stopVoices();
  };

  const dispose = () => {
    disposed = true;
    stop();
    mix?.disconnect();
    panner?.disconnect();
    master?.disconnect();
    if (context) void context.close();
    context = null;
    mix = null;
    panner = null;
    master = null;
  };

  return { nextTune, updateSpatial, stop, dispose };
}
