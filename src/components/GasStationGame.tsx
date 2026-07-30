import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Direction, isInsideShop, updatePlayer } from '../lib/firstPerson';
import {
  createGameActions,
  INITIAL_DOOR_STATE,
  INITIAL_WEAPON_STATE,
} from '../lib/gameActions';
import { createGameRenderer } from '../lib/gameRenderer';
import { attachGameSessionInput } from '../lib/gameSessionInput';
import { updateWeaponEffects } from '../lib/gameWeapon';
import { createWeaponAudio } from '../lib/weaponAudio';
import { buildGasStationScene } from '../lib/gasStationScene';
import { updateAtmosphere } from '../lib/gasStationAtmosphere';
import { createFootstepAudio } from '../lib/footstepAudio';
import { createCustomerSystem, type CheckoutKind } from '../lib/customerSystem';
import { createDaylightCycle } from '../lib/daylightCycle';
import { createShiftStats, type ShiftStats } from '../lib/gameShift';
import {
  staffDoorBlocks,
  updateStaffDoors,
} from '../lib/staffDoor';
import { GameControls } from './GameControls';
import { GameHud } from './GameHud';
import { ShiftSummary } from './ShiftSummary';

export function GasStationGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pressedRef = useRef<Record<Direction, boolean>>({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const lookRef = useRef({ yaw: 0, pitch: 0 });
  const jumpRequestedRef = useRef(false);
  const sprintRef = useRef(false);
  const crouchedRef = useRef(false);
  const footstepAudioRef = useRef<ReturnType<typeof createFootstepAudio> | null>(null);
  const weaponAudioRef = useRef<ReturnType<typeof createWeaponAudio> | null>(null);
  const customerSystemRef = useRef<ReturnType<typeof createCustomerSystem> | null>(null);
  const daylightCycleRef = useRef<ReturnType<typeof createDaylightCycle> | null>(null);
  const healthRef = useRef(100);
  const playingRef = useRef(false);
  const shiftStatsRef = useRef(createShiftStats());
  const shiftSummaryRef = useRef<ShiftStats | null>(null);
  const [inside, setInside] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stamina, setStamina] = useState(100);
  const [weapon, setWeapon] = useState(INITIAL_WEAPON_STATE);
  const [door, setDoor] = useState(INITIAL_DOOR_STATE);
  const [nearMess, setNearMess] = useState(false);
  const [nearMedkit, setNearMedkit] = useState(false);
  const [checkoutKind, setCheckoutKind] = useState<CheckoutKind | null>(null);
  const [health, setHealth] = useState(100);
  const [shiftNumber, setShiftNumber] = useState(1);
  const [shiftSummary, setShiftSummary] = useState<ShiftStats | null>(null);

  const setControl = useCallback((direction: Direction, pressed: boolean) => {
    if (!playingRef.current) return;
    pressedRef.current[direction] = pressed;
  }, []);

  const startGame = useCallback(() => {
    if (playingRef.current || shiftSummaryRef.current) return;
    footstepAudioRef.current?.enable();
    weaponAudioRef.current?.enable();
    customerSystemRef.current?.start(performance.now());
    daylightCycleRef.current?.start(Date.now());
    playingRef.current = true;
    setPlaying(true);
  }, []);

  const finishShift = useCallback(() => {
    if (!playingRef.current) return;
    playingRef.current = false;
    sprintRef.current = false;
    Object.keys(pressedRef.current).forEach((key) => {
      pressedRef.current[key as Direction] = false;
    });
    if (document.pointerLockElement) void document.exitPointerLock();
    const summary = { ...shiftStatsRef.current };
    shiftSummaryRef.current = summary;
    setShiftSummary(summary);
    setPlaying(false);
  }, []);

  const startNextShift = useCallback(() => {
    shiftStatsRef.current = createShiftStats();
    shiftSummaryRef.current = null;
    setShiftSummary(null);
    setShiftNumber((current) => current + 1);
    healthRef.current = 100;
    setHealth(100);
    footstepAudioRef.current?.enable();
    weaponAudioRef.current?.enable();
    customerSystemRef.current?.start(performance.now());
    daylightCycleRef.current?.start(Date.now());
    playingRef.current = true;
    setPlaying(true);
    if (canvasRef.current) void canvasRef.current.requestPointerLock();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = buildGasStationScene();
    const camera = new THREE.PerspectiveCamera(68, 16 / 9, 0.1, 70);
    scene.add(camera);
    const renderer = createGameRenderer(canvas, scene, camera);
    camera.position.set(0, 1.65, 8);
    camera.rotation.order = 'YXZ';
    let previousTime = performance.now();
    let frame = 0;
    let wasInside = false;
    const jump = { height: 0, velocity: 0 };
    const sprint = { stamina: 100 };
    const crouch = { amount: 0 };
    const footsteps = createFootstepAudio();
    const weaponAudio = createWeaponAudio();
    const customers = createCustomerSystem(
      scene,
      () => {
        healthRef.current = Math.max(0, healthRef.current - 15);
        setHealth(healthRef.current);
      },
      () => {
        shiftStatsRef.current.anomaliesShot += 1;
      },
    );
    const daylight = createDaylightCycle(scene);
    footstepAudioRef.current = footsteps;
    weaponAudioRef.current = weaponAudio;
    customerSystemRef.current = customers;
    daylightCycleRef.current = daylight;
    let lastStaminaUpdate = 0;

    const resize = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      renderer.resize(width, height);
    };
    const actions = createGameActions(
      scene,
      camera,
      setWeapon,
      setDoor,
      weaponAudio,
      customers,
      () => {
        if (healthRef.current >= 100) return false;
        healthRef.current = 100;
        setHealth(100);
        return true;
      },
      setNearMess,
      setNearMedkit,
      setCheckoutKind,
      () => {
        shiftStatsRef.current.shots += 1;
      },
      () => {
        shiftStatsRef.current.purchases += 1;
      },
    );
    const detachInput = attachGameSessionInput({
      canvas,
      look: lookRef,
      onControl: setControl,
      onJump: () => {
        if (playingRef.current) jumpRequestedRef.current = true;
      },
      onSprint: (value) => {
        if (playingRef.current) sprintRef.current = value;
      },
      onCrouch: () => {
        if (playingRef.current) crouchedRef.current = !crouchedRef.current;
      },
      onInteract: () => { if (playingRef.current) actions.interact(); },
      onRefuse: () => { if (playingRef.current) actions.refuse(); },
      onReload: () => { if (playingRef.current) actions.reload(); },
      onShoot: () => { if (playingRef.current) actions.shoot(); },
      onStart: startGame,
    });
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const animate = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.04);
      previousTime = time;
      if (!playingRef.current) {
        renderer.render();
        frame = requestAnimationFrame(animate);
        return;
      }
      const yaw = lookRef.current.yaw;
      const previousX = camera.position.x;
      const previousZ = camera.position.z;
      updatePlayer(
        camera,
        pressedRef.current,
        yaw,
        jumpRequestedRef.current,
        jump,
        sprintRef.current,
        sprint,
        crouchedRef.current,
        crouch,
        time,
        delta,
        (x, z) => staffDoorBlocks(scene, x, z),
      );
      const moved =
        Math.abs(camera.position.x - previousX) + Math.abs(camera.position.z - previousZ) > 0.0001;
      const sprinting =
        sprintRef.current && pressedRef.current.up && jump.height === 0 && sprint.stamina > 0;
      footsteps.update(time, moved && jump.height === 0, sprinting);
      jumpRequestedRef.current = false;
      if (time - lastStaminaUpdate > 100) {
        lastStaminaUpdate = time;
        setStamina(Math.round(sprint.stamina));
      }
      lookRef.current.pitch = THREE.MathUtils.clamp(lookRef.current.pitch, -1.2, 1.2);
      camera.rotation.set(lookRef.current.pitch, yaw, 0);
      updateAtmosphere(scene, delta);
      updateWeaponEffects(scene, delta);
      updateStaffDoors(scene, delta);
      customers.update(time, delta, camera);
      daylight.update(Date.now());
      const nowInside = isInsideShop(camera.position);
      if (nowInside !== wasInside) {
        wasInside = nowInside;
        setInside(nowInside);
      }
      actions.updateProximity();
      renderer.render();
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      detachInput();
      actions.dispose();
      footsteps.dispose();
      weaponAudio.dispose();
      customers.dispose();
      if (footstepAudioRef.current === footsteps) footstepAudioRef.current = null;
      if (weaponAudioRef.current === weaponAudio) weaponAudioRef.current = null;
      if (customerSystemRef.current === customers) customerSystemRef.current = null;
      if (daylightCycleRef.current === daylight) daylightCycleRef.current = null;
      renderer.dispose();
    };
  }, [setControl, startGame]);

  return (
    <section className="game-shell">
      <div className="screen-frame">
        <canvas ref={canvasRef} aria-label="A low-poly 3D gas station you can enter" />
        <GameHud
          inside={inside}
          playing={playing}
          showStartScreen={!playing && shiftSummary === null}
          shiftNumber={shiftNumber}
          onShiftEnd={finishShift}
          stamina={stamina}
          health={health}
          weapon={weapon.weapon}
          ammo={weapon.ammo}
          capacity={weapon.capacity}
          nearbyWeapon={weapon.nearbyWeapon}
          reloading={weapon.reloading}
          nearDoor={door.near}
          nearMess={nearMess}
          nearMedkit={nearMedkit}
          checkoutKind={checkoutKind}
          doorOpen={door.open}
          doorLabel={door.label}
        />
        {shiftSummary && (
          <ShiftSummary
            shiftNumber={shiftNumber}
            stats={shiftSummary}
            onContinue={startNextShift}
          />
        )}
      </div>
      <GameControls
        onStart={startGame}
        onControl={setControl}
        onJump={() => {
          if (playingRef.current) jumpRequestedRef.current = true;
        }}
        onSprint={(pressed) => {
          if (playingRef.current) sprintRef.current = pressed;
        }}
      />
    </section>
  );
}
