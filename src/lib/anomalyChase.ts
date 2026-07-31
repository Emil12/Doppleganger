import * as THREE from 'three';
import { type AnomalyAudio } from './anomalyAudio';
import { ANOMALY_PROFILES } from './anomalyTypes';
import { type Customer } from './customerTypes';
import { createBloodDrop, MAX_BLOOD_MARKS_PER_CUSTOMER } from './customerMess';
import { moveCustomer } from './customerRoute';
import { isHiddenInRestroom } from './gasStationRestroom';

type ChaseOptions = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  customer: Customer;
  audio: AnomalyAudio;
  time: number;
  delta: number;
  onPlayerHit: (instantKill: boolean) => void;
  isBloodEnabled: () => boolean;
  difficultyMultiplier: number;
};

export function updateAnomalyChase(options: ChaseOptions) {
  const { scene, camera, customer, audio, time, delta, onPlayerHit } = options;
  const kind = customer.model.anomalyKind;
  if (!kind || (!customer.immortal && isHiddenInRestroom(scene, camera.position))) return;
  const profile = ANOMALY_PROFILES[kind];
  const speedScale = 1 + Math.max(0, options.difficultyMultiplier - 1) * 0.3;
  const speed = customer.immortal ? 4.9 : profile.speed * speedScale;
  const distance = Math.hypot(
    customer.model.root.position.x - camera.position.x,
    customer.model.root.position.z - camera.position.z,
  );

  if (distance > 0.9) {
    moveCustomer(
      customer.model,
      { x: camera.position.x, z: camera.position.z },
      time,
      delta * (speed / 1.15),
    );
  }
  if (distance < (customer.immortal ? 1.6 : 1.25) && time >= customer.nextAttackAt) {
    customer.nextAttackAt = time + (
      customer.immortal
        ? 700
        : profile.attackCooldown / Math.sqrt(options.difficultyMultiplier)
    );
    customer.damagedPlayer = true;
    onPlayerHit(customer.immortal);
  }
  if (time >= customer.nextVocalAt) {
    customer.nextVocalAt = time + audio.vocalize(kind, distance);
  }
  if (options.isBloodEnabled() && time >= customer.nextBloodDropAt) {
    customer.nextBloodDropAt = time + profile.bloodDropInterval;
    customer.bloodTrail.push(createBloodDrop(scene, customer.model.root.position));
    while (customer.bloodTrail.length > MAX_BLOOD_MARKS_PER_CUSTOMER) {
      customer.bloodTrail.shift()?.removeFromParent();
    }
  }
}
