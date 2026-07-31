import * as THREE from 'three';

export const BREAKABLE_GLASS_PREFIX = 'breakable-glass-';

type GlassShard = {
  age: number;
  mesh: THREE.Mesh;
  spin: THREE.Vector3;
  velocity: THREE.Vector3;
};

function findGlass(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current && !current.name.startsWith(BREAKABLE_GLASS_PREFIX)) {
    current = current.parent;
  }
  return current instanceof THREE.Mesh ? current : null;
}

export function createBreakableGlassSystem(scene: THREE.Scene, onBreak: () => void) {
  const panes: THREE.Mesh[] = [];
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.name.startsWith(BREAKABLE_GLASS_PREFIX)) {
      panes.push(object);
    }
  });
  const shardGeometry = new THREE.PlaneGeometry(0.18, 0.25);
  const shardMaterial = new THREE.MeshBasicMaterial({
    color: 0x9bc8c2,
    transparent: true,
    opacity: 0.58,
    side: THREE.DoubleSide,
  });
  const shards: GlassShard[] = [];

  const scatterShards = (pane: THREE.Mesh) => {
    const origin = pane.getWorldPosition(new THREE.Vector3());
    for (let index = 0; index < 10; index += 1) {
      const mesh = new THREE.Mesh(shardGeometry, shardMaterial);
      mesh.position.copy(origin).add(new THREE.Vector3(
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 0.16,
      ));
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(mesh);
      shards.push({
        age: 0,
        mesh,
        spin: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          1.5 + Math.random() * 2.5,
          1 + Math.random() * 2,
        ),
      });
    }
  };

  const hit = (objects: readonly THREE.Object3D[]) => {
    const hitPanes = new Set(objects.map(findGlass).filter((pane) => pane !== null));
    hitPanes.forEach((pane) => {
      if (pane.userData.broken === true) return;
      pane.userData.broken = true;
      pane.visible = false;
      scatterShards(pane);
      onBreak();
    });
  };

  const clearShards = () => {
    shards.splice(0).forEach((shard) => scene.remove(shard.mesh));
  };

  const update = (delta: number) => {
    for (let index = shards.length - 1; index >= 0; index -= 1) {
      const shard = shards[index];
      shard.age += delta;
      shard.velocity.y -= 7.5 * delta;
      shard.mesh.position.addScaledVector(shard.velocity, delta);
      shard.mesh.rotation.x += shard.spin.x * delta;
      shard.mesh.rotation.y += shard.spin.y * delta;
      shard.mesh.rotation.z += shard.spin.z * delta;
      if (shard.age < 1.25) continue;
      scene.remove(shard.mesh);
      shards.splice(index, 1);
    }
  };

  const reset = () => {
    clearShards();
    panes.forEach((pane) => {
      pane.userData.broken = false;
      pane.visible = true;
    });
  };

  const dispose = () => {
    clearShards();
    shardGeometry.dispose();
    shardMaterial.dispose();
  };

  return { hit, update, reset, dispose };
}
