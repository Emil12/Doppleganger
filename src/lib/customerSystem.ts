import * as THREE from 'three';
import { createAnomalyAudio } from './anomalyAudio';
import { prepareAnomalyChase, updateAnomalyChase } from './anomalyChase';
import { disposeCustomerModel } from './customerModel';
import { disposeAnomalyMaterials, makeAnomalyHostile } from './anomalyModel';
import { disposeAnomalyVariantMaterials } from './anomalyVariants';
import { animateCustomerDeath, disposeCustomerMessAssets } from './customerMess';
import { disposeSharedCustomerGeometries } from './customerGeometry';
import { disposeCustomerMaterials } from './customerStyle';
import { createCustomerInteractions } from './customerInteractions';
import {
  createQueueDialogue,
} from './customerDialogue';
import {
  updateLeavingPhase,
  updateQueuePhase,
  updateShoppingPhase,
} from './customerPhases';
import { createAnomalySelector, randomCustomerDelay } from './customerRandomness';
import { createCustomerSpawner } from './customerSpawner';
import { type Customer } from './customerTypes';
import { type CustomerSystemOptions } from './customerSystemTypes';
import { spawnImmortalInspector } from './inspectorModel';
import { nightmareCustomerIsAnomaly } from './nightmareMode';

export { type CheckoutKind } from './customerTypes';

export function createCustomerSystem(
  scene: THREE.Scene,
  options: CustomerSystemOptions,
) {
  const {
    onPlayerHit,
    onAnomalyKilled,
    onInnocentShot,
    onDialogue,
    isBloodEnabled,
    isNightmareMode,
    getDifficultyMultiplier,
  } = options;
  const customers: Customer[] = [];
  const queue: Customer[] = [];
  const interactions = createCustomerInteractions(
    scene,
    customers,
    onAnomalyKilled,
    onInnocentShot,
    isBloodEnabled,
  );
  const anomalyAudio = createAnomalyAudio();
  const queueDialogue = createQueueDialogue(onDialogue);
  const selectAnomaly = createAnomalySelector();
  let started = false;
  let nextCustomerAt = Number.POSITIVE_INFINITY;
  let nextNightmareSpawnAt = Number.POSITIVE_INFINITY;
  let nightmareSpawnsRemaining = 0;
  let nightmareCustomerNumber = 0;
  const nextDelay = () => Math.max(
    isNightmareMode() ? 1_750 : 3_500,
    randomCustomerDelay() / getDifficultyMultiplier() / (isNightmareMode() ? 2 : 1),
  );
  const spawnCustomer = createCustomerSpawner(scene, customers, getDifficultyMultiplier);
  const selectNextAnomaly = () => {
    if (!isNightmareMode()) return selectAnomaly();
    const isAnomaly = nightmareCustomerIsAnomaly(nightmareCustomerNumber);
    nightmareCustomerNumber += 1;
    return isAnomaly;
  };

  const clearCustomers = () => {
    customers.forEach(({ model, splatter, bloodTrail }) => {
      model.root.removeFromParent();
      disposeCustomerModel(model);
      splatter?.removeFromParent();
      bloodTrail.forEach((drop) => drop.removeFromParent());
    });
    customers.length = 0;
  };

  const start = (time: number) => {
    anomalyAudio.enable();
    if (started) clearCustomers();
    started = true;
    queueDialogue.reset();
    nightmareSpawnsRemaining = 0;
    nightmareCustomerNumber = 0;
    nextNightmareSpawnAt = Number.POSITIVE_INFINITY;
    spawnCustomer(selectNextAnomaly());
    nextCustomerAt = time + nextDelay();
  };

  const startNightmareWave = (time: number) => {
    clearCustomers();
    started = true;
    nightmareSpawnsRemaining = 10;
    nextNightmareSpawnAt = time;
    nextCustomerAt = Number.POSITIVE_INFINITY;
  };

  const summonInspector = () => {
    spawnImmortalInspector(spawnCustomer);
    nightmareSpawnsRemaining = 0;
    nextNightmareSpawnAt = Number.POSITIVE_INFINITY;
    nextCustomerAt = Number.POSITIVE_INFINITY;
  };

  const attackAllAnomalies = () => {
    const time = performance.now();
    customers.forEach((customer) => {
      if (!customer.model.isAnomaly || customer.diedAt !== null) return;
      customer.phase = 'attacking';
      customer.model.idCard.visible = false;
      makeAnomalyHostile(customer.model);
      prepareAnomalyChase(customer, time);
    });
  };

  const update = (time: number, delta: number, camera: THREE.PerspectiveCamera) => {
    if (!started) return;
    if (nightmareSpawnsRemaining > 0 && time >= nextNightmareSpawnAt) {
      const waveIndex = 10 - nightmareSpawnsRemaining;
      const customer = spawnCustomer(true);
      customer.phase = 'attacking';
      customer.model.root.position.x += ((waveIndex % 3) - 1) * 0.72;
      customer.model.idCard.visible = false;
      makeAnomalyHostile(customer.model);
      prepareAnomalyChase(customer, time);
      nightmareSpawnsRemaining -= 1;
      nextNightmareSpawnAt = time + 650;
      if (nightmareSpawnsRemaining === 0) {
        nextCustomerAt = time + nextDelay();
      }
    }
    if (time >= nextCustomerAt) {
      spawnCustomer(selectNextAnomaly());
      nextCustomerAt = time + nextDelay();
    }
    queue.length = 0;
    for (const customer of customers) {
      if (customer.phase === 'queue' && customer.diedAt === null) queue.push(customer);
    }
    queue.forEach((customer, place) => updateQueuePhase(customer, place, time, delta));
    queueDialogue.update(queue, time);
    for (let index = customers.length - 1; index >= 0; index -= 1) {
      const customer = customers[index];
      if (customer.diedAt !== null) {
        if (customer.model.root.visible) {
          animateCustomerDeath(customer.model, time - customer.diedAt);
        }
      } else if (customer.phase === 'shopping') {
        updateShoppingPhase(customer, time, delta);
      } else if (customer.phase === 'leaving' && !updateLeavingPhase(customer, time, delta)) {
        customers.splice(index, 1);
      } else if (customer.phase === 'attacking') {
        updateAnomalyChase({
          scene,
          camera,
          customer,
          audio: anomalyAudio,
          time,
          delta,
          onPlayerHit,
          isBloodEnabled,
          difficultyMultiplier: getDifficultyMultiplier(),
        });
      }
    }
  };

  const dispose = () => {
    clearCustomers();
    started = false;
    nextCustomerAt = Number.POSITIVE_INFINITY;
    nextNightmareSpawnAt = Number.POSITIVE_INFINITY;
    nightmareSpawnsRemaining = 0;
    anomalyAudio.dispose();
    disposeSharedCustomerGeometries();
    disposeCustomerMaterials();
    disposeAnomalyMaterials();
    disposeAnomalyVariantMaterials();
    disposeCustomerMessAssets();
  };

  return {
    prepareAudio: anomalyAudio.prepare,
    start,
    startNightmareWave,
    attackAllAnomalies,
    summonInspector,
    update,
    ...interactions,
    dispose,
  };
}
