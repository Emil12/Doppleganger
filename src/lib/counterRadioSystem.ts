import * as THREE from 'three';
import {
  createCounterRadioAudio,
  type RadioSelection,
} from './counterRadioAudio';
import {
  COUNTER_RADIO_POSITION,
  setCounterRadioActive,
} from './counterRadioModel';

type CounterRadioOptions = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  showNearby: (nearby: boolean) => void;
  showSelection: (selection: RadioSelection | null) => void;
};

const RADIO_RANGE = 3.2;
const AIM_THRESHOLD = 0.72;

export function createCounterRadioSystem(options: CounterRadioOptions) {
  const { scene, camera } = options;
  const audio = createCounterRadioAudio();
  const source = new THREE.Vector3(
    COUNTER_RADIO_POSITION[0],
    COUNTER_RADIO_POSITION[1] + 0.58,
    COUNTER_RADIO_POSITION[2],
  );
  const toRadio = new THREE.Vector3();
  const forward = new THREE.Vector3();
  let nearby = false;
  let selection: RadioSelection | null = null;

  const canInteract = () => {
    toRadio.copy(source).sub(camera.position);
    if (toRadio.lengthSq() > RADIO_RANGE * RADIO_RANGE) return false;
    camera.getWorldDirection(forward);
    return forward.dot(toRadio.normalize()) > AIM_THRESHOLD;
  };

  const update = () => {
    const nextNearby = canInteract();
    if (nextNearby !== nearby) {
      nearby = nextNearby;
      options.showNearby(nearby);
    }
    if (!selection) return;
    camera.getWorldDirection(forward);
    audio.updateSpatial(source, camera.position, forward, camera.up);
  };

  const interact = () => {
    if (!canInteract()) return false;
    selection = audio.nextTune();
    if (selection) {
      setCounterRadioActive(scene, true);
      options.showSelection(selection);
    }
    return true;
  };

  const reset = () => {
    audio.stop();
    selection = null;
    nearby = false;
    setCounterRadioActive(scene, false);
    options.showNearby(false);
    options.showSelection(null);
  };

  const dispose = () => {
    reset();
    audio.dispose();
  };

  return { interact, update, reset, dispose };
}
