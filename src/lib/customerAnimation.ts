import * as THREE from 'three';
import { type CustomerModel } from './customerModel';

function easeRotation(object: THREE.Object3D, axis: 'x' | 'y' | 'z', target: number, amount = 0.2) {
  object.rotation[axis] = THREE.MathUtils.lerp(object.rotation[axis], target, amount);
}

export function animateCustomer(model: CustomerModel, time: number, walking: boolean) {
  const hostile = model.root.userData.hostile === true;
  const twitching = hostile || model.anomalyClue === 'twitch';
  const phase = time * (hostile ? 0.032 : twitching ? 0.016 : 0.008);
  const stride = walking ? Math.sin(phase) : 0;
  const strideAmount = hostile ? 0.96 : 0.48;

  easeRotation(model.leftArm, 'x', stride * strideAmount);
  easeRotation(model.rightArm, 'x', -stride * strideAmount);
  easeRotation(model.leftLeg, 'x', -stride * strideAmount);
  easeRotation(model.rightLeg, 'x', stride * strideAmount);
  easeRotation(model.torso, 'y', walking ? Math.sin(phase) * 0.055 : 0);
  easeRotation(model.torso, 'z', walking ? Math.cos(phase * 2) * 0.018 : 0);

  const bob = walking
    ? Math.abs(Math.sin(phase)) * (hostile ? 0.065 : 0.018)
    : Math.sin(time * 0.0015) * 0.004;
  model.torso.position.y = 1.23 + bob;
  model.head.position.y = 1.78 + bob * 0.7;

  if (twitching) {
    model.head.rotation.z = Math.sin(time * 0.024) * (hostile ? 0.27 : 0.025);
    model.head.rotation.y = Math.sin(time * 0.017) * (hostile ? 0.38 : 0.04);
    model.leftArm.rotation.z = hostile
      ? 0.3 + Math.sin(time * 0.03) * 0.22
      : Math.sin(time * 0.012) * 0.025;
    if (hostile) {
      model.head.rotation.x = -0.28 + Math.sin(time * 0.057) * 0.38;
      model.head.rotation.z = 0.22 + Math.sin(time * 0.046) * 0.34;
      model.torso.rotation.x = -0.34 + Math.sin(time * 0.041) * 0.08;
      model.torso.rotation.z = Math.sin(time * 0.052) * 0.16;
      model.leftArm.rotation.z = 0.62 + Math.sin(time * 0.061) * 0.35;
      model.rightArm.rotation.z = -0.52 + Math.sin(time * 0.047) * 0.38;
      model.anomalyFeatures.rotation.y = Math.sin(time * 0.028) * 0.11;
      model.anomalyFeatures.rotation.z = Math.sin(time * 0.063) * 0.055;
      if (model.anomalyKind === 'screamer') {
        model.head.rotation.x = -0.72 + Math.sin(time * 0.032) * 0.16;
        model.leftArm.rotation.z = 1.1 + Math.sin(time * 0.04) * 0.25;
        model.rightArm.rotation.z = -1.1 - Math.sin(time * 0.04) * 0.25;
      }
      if (model.anomalyKind === 'crier') {
        model.head.rotation.x = 0.48 + Math.sin(time * 0.019) * 0.12;
        model.torso.rotation.z = Math.sin(time * 0.031) * 0.24;
        model.leftArm.rotation.z = 0.18;
        model.rightArm.rotation.z = -0.18;
      }
      if (model.anomalyKind === 'crawler') {
        model.torso.rotation.x = 0.72 + Math.sin(time * 0.045) * 0.12;
        model.head.rotation.x = -0.58;
        model.leftArm.rotation.z = 0.86;
        model.rightArm.rotation.z = -0.86;
      }
      if (model.anomalyKind === 'stalker') {
        model.head.rotation.y = Math.sin(time * 0.006) * 0.75;
        model.head.rotation.z = Math.sin(time * 0.009) * 0.12;
        model.torso.rotation.z = Math.sin(time * 0.007) * 0.06;
      }
    }
    return;
  }
  easeRotation(model.head, 'x', 0);
  easeRotation(model.head, 'y', walking ? -Math.sin(phase) * 0.035 : 0);
  easeRotation(model.head, 'z', 0);
  easeRotation(model.leftArm, 'z', 0);
  easeRotation(model.rightArm, 'z', 0);
}
