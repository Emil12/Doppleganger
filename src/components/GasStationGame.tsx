import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Direction, updatePlayer } from '../lib/firstPerson';
import {
  createGameActions,
  INITIAL_DOOR_STATE,
  INITIAL_WEAPON_STATE,
} from '../lib/gameActions';
import { createGameRenderer } from '../lib/gameRenderer';
import { attachGameSessionInput } from '../lib/gameSessionInput';
import { createPlayerAvatarSystem } from '../lib/playerAvatar';
import { type WeaponKind, updateWeaponEffects } from '../lib/gameWeapon';
import { createWeaponAudio } from '../lib/weaponAudio';
import {
  createNightmareAudio,
  NIGHTMARE_DURATION_MS,
  NIGHTMARE_SHIFT,
  randomNightmareDelay,
} from '../lib/nightmareEvent';
import { buildGasStationScene } from '../lib/gasStationScene';
import { isHiddenInRestroom } from '../lib/gasStationRestroom';
import { updateAtmosphere } from '../lib/gasStationAtmosphere';
import { createFootstepAudio } from '../lib/footstepAudio';
import { createCustomerSystem, type CheckoutKind } from '../lib/customerSystem';
import { type QueueDialogue as QueueDialogueState } from '../lib/customerDialogue';
import { createDaylightCycle } from '../lib/daylightCycle';
import {
  addGameCoins,
  buyGameClass,
  buyGameMedkit,
  EMPTY_GAME_ECONOMY,
  loadGameEconomy,
  type GameEconomy,
  selectGameClass,
  useGameMedkit,
} from '../lib/gameEconomy';
import {
  difficultyMultiplier,
  loadGameSettings,
  saveGameSettings,
  type GameSettings,
} from '../lib/gameSettings';
import {
  createRunStats,
  createShiftStats,
  type DeathSummaryStats,
  type ShiftStats,
} from '../lib/gameShift';
import {
  PLAYER_CLASSES,
  type PlayerClassKind,
} from '../lib/playerClasses';
import {
  staffDoorBlocks,
  updateStaffDoors,
} from '../lib/staffDoor';
import { GameControls } from './GameControls';
import { DeathScreen } from './DeathScreen';
import { GameHud } from './GameHud';
import { InspectorExecution } from './InspectorExecution';
import { Jumpscare, type JumpscareKind } from './Jumpscare';
import { MainMenu } from './MainMenu';
import { NightmareOverlay } from './NightmareOverlay';
import { QueueDialogue } from './QueueDialogue';
import { ShiftSummary } from './ShiftSummary';

const MAX_JUDGEMENT_POINTS = 5;

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
  const nightmareAudioRef = useRef<ReturnType<typeof createNightmareAudio> | null>(null);
  const customerSystemRef = useRef<ReturnType<typeof createCustomerSystem> | null>(null);
  const daylightCycleRef = useRef<ReturnType<typeof createDaylightCycle> | null>(null);
  const healthRef = useRef(100);
  const shiftNumberRef = useRef(1);
  const playingRef = useRef(false);
  const shiftStatsRef = useRef(createShiftStats());
  const shiftSummaryRef = useRef<ShiftStats | null>(null);
  const runStatsRef = useRef(createRunStats());
  const runStartedAtRef = useRef(0);
  const deathSummaryRef = useRef<DeathSummaryStats | null>(null);
  const resetWorldRef = useRef<(() => void) | null>(null);
  const jumpscareTimerRef = useRef<number | null>(null);
  const jumpscareHideTimerRef = useRef<number | null>(null);
  const nightmareStartedRef = useRef(false);
  const judgementPointsRef = useRef(MAX_JUDGEMENT_POINTS);
  const inspectorSummonedRef = useRef(false);
  const inspectorExecutingRef = useRef(false);
  const inspectorExecutionTimerRef = useRef<number | null>(null);
  const dialogueTimerRef = useRef<number | null>(null);
  const menuOpenRef = useRef(true);
  const economyRef = useRef<GameEconomy>(EMPTY_GAME_ECONOMY);
  const economyBusyRef = useRef(false);
  const classMedkitsRef = useRef(0);
  const equipClassWeaponRef = useRef<((kind: WeaponKind) => void) | null>(null);
  const [settings, setSettings] = useState(loadGameSettings);
  const settingsRef = useRef(settings);
  const [menuOpen, setMenuOpen] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stamina, setStamina] = useState(100);
  const [exhausted, setExhausted] = useState(false);
  const [weapon, setWeapon] = useState(INITIAL_WEAPON_STATE);
  const [door, setDoor] = useState(INITIAL_DOOR_STATE);
  const [nearMess, setNearMess] = useState(false);
  const [nearMedkit, setNearMedkit] = useState(false);
  const [checkoutKind, setCheckoutKind] = useState<CheckoutKind | null>(null);
  const [health, setHealth] = useState(100);
  const [shiftNumber, setShiftNumber] = useState(1);
  const [shiftSummary, setShiftSummary] = useState<ShiftStats | null>(null);
  const [deathSummary, setDeathSummary] = useState<DeathSummaryStats | null>(null);
  const [jumpscare, setJumpscare] = useState<{ id: number; kind: JumpscareKind } | null>(null);
  const [nightmareActive, setNightmareActive] = useState(false);
  const [judgementPoints, setJudgementPoints] = useState(MAX_JUDGEMENT_POINTS);
  const [inspectorExecuting, setInspectorExecuting] = useState(false);
  const [queueDialogue, setQueueDialogue] = useState<QueueDialogueState | null>(null);
  const [economy, setEconomy] = useState(EMPTY_GAME_ECONOMY);
  const [economyBusy, setEconomyBusy] = useState(true);
  const [runComplete, setRunComplete] = useState(false);
  const [coinReward, setCoinReward] = useState(0);
  const [classMedkits, setClassMedkits] = useState(0);

  const applyEconomy = useCallback((nextEconomy: GameEconomy) => {
    economyRef.current = nextEconomy;
    setEconomy(nextEconomy);
  }, []);

  useEffect(() => {
    let active = true;
    void loadGameEconomy().then((loadedEconomy) => {
      if (!active) return;
      applyEconomy(loadedEconomy);
      setEconomyBusy(false);
    });
    return () => { active = false; };
  }, [applyEconomy]);

  const purchaseMedkit = useCallback(async () => {
    if (economyBusyRef.current || economyRef.current.coins < 5) return;
    economyBusyRef.current = true;
    setEconomyBusy(true);
    try {
      const nextEconomy = await buyGameMedkit();
      if (nextEconomy) applyEconomy(nextEconomy);
    } finally {
      economyBusyRef.current = false;
      setEconomyBusy(false);
    }
  }, [applyEconomy]);

  const purchaseClass = useCallback(async (playerClass: PlayerClassKind) => {
    if (economyBusyRef.current) return;
    economyBusyRef.current = true;
    setEconomyBusy(true);
    try {
      const nextEconomy = await buyGameClass(playerClass);
      if (nextEconomy) applyEconomy(nextEconomy);
    } finally {
      economyBusyRef.current = false;
      setEconomyBusy(false);
    }
  }, [applyEconomy]);

  const chooseClass = useCallback(async (playerClass: PlayerClassKind) => {
    if (economyBusyRef.current) return;
    economyBusyRef.current = true;
    setEconomyBusy(true);
    try {
      const nextEconomy = await selectGameClass(playerClass);
      if (nextEconomy) applyEconomy(nextEconomy);
    } finally {
      economyBusyRef.current = false;
      setEconomyBusy(false);
    }
  }, [applyEconomy]);

  const prepareClassLoadout = useCallback(() => {
    const config = PLAYER_CLASSES[economyRef.current.selectedClass];
    classMedkitsRef.current = config.startingMedkits;
    setClassMedkits(config.startingMedkits);
    equipClassWeaponRef.current?.(config.weapon);
  }, []);

  const usePortableMedkit = useCallback(async () => {
    if (!playingRef.current || healthRef.current >= 100) return;
    if (classMedkitsRef.current > 0) {
      classMedkitsRef.current -= 1;
      setClassMedkits(classMedkitsRef.current);
      healthRef.current = 100;
      setHealth(100);
      runStatsRef.current.medkitsUsed += 1;
      return;
    }
    if (
      economyBusyRef.current
      || economyRef.current.medkits < 1
    ) return;
    economyBusyRef.current = true;
    setEconomyBusy(true);
    try {
      const nextEconomy = await useGameMedkit();
      if (!nextEconomy || !playingRef.current) return;
      applyEconomy(nextEconomy);
      healthRef.current = 100;
      setHealth(100);
      runStatsRef.current.medkitsUsed += 1;
    } finally {
      economyBusyRef.current = false;
      setEconomyBusy(false);
    }
  }, [applyEconomy]);

  const setControl = useCallback((direction: Direction, pressed: boolean) => {
    if (!playingRef.current || inspectorExecutingRef.current) return;
    pressedRef.current[direction] = pressed;
  }, []);

  const startGame = useCallback(() => {
    if (
      menuOpenRef.current
      || playingRef.current
      || shiftSummaryRef.current
      || deathSummaryRef.current
    ) return;
    runStatsRef.current = createRunStats();
    runStartedAtRef.current = performance.now();
    prepareClassLoadout();
    footstepAudioRef.current?.enable();
    weaponAudioRef.current?.enable();
    nightmareAudioRef.current?.enable();
    customerSystemRef.current?.start(performance.now());
    daylightCycleRef.current?.start(Date.now());
    playingRef.current = true;
    setPlaying(true);
  }, [prepareClassLoadout]);

  const startFromMenu = useCallback(() => {
    setRunComplete(false);
    setCoinReward(0);
    menuOpenRef.current = false;
    setMenuOpen(false);
    startGame();
    if (canvasRef.current) void canvasRef.current.requestPointerLock();
  }, [startGame]);

  const updateSettings = useCallback((nextSettings: GameSettings) => {
    settingsRef.current = nextSettings;
    setSettings(nextSettings);
    saveGameSettings(nextSettings);
  }, []);

  const stopInspectorExecution = useCallback(() => {
    inspectorExecutingRef.current = false;
    setInspectorExecuting(false);
    if (inspectorExecutionTimerRef.current !== null) {
      window.clearTimeout(inspectorExecutionTimerRef.current);
      inspectorExecutionTimerRef.current = null;
    }
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
    runStatsRef.current.shiftsCompleted += 1;
    shiftSummaryRef.current = summary;
    const mode = settingsRef.current.difficulty;
    const completedRun =
      (mode === 'easy' && shiftNumber === 10)
      || (mode === 'hard' && shiftNumber === 25);
    const reward =
      mode === 'easy' && shiftNumber === 10
        ? 5
        : mode === 'hard' && shiftNumber === 25
          ? 10
          : mode === 'endless' && shiftNumber % 10 === 0 ? 5 : 0;
    setRunComplete(completedRun);
    setCoinReward(reward);
    if (reward > 0 && economyRef.current.signedIn) {
      economyBusyRef.current = true;
      setEconomyBusy(true);
      void addGameCoins(reward).then((nextEconomy) => {
        if (nextEconomy) {
          applyEconomy(nextEconomy);
        }
      }).finally(() => {
        economyBusyRef.current = false;
        setEconomyBusy(false);
      });
    }
    stopInspectorExecution();
    setShiftSummary(summary);
    setQueueDialogue(null);
    setPlaying(false);
  }, [applyEconomy, shiftNumber, stopInspectorExecution]);

  const queueJumpscare = useCallback(() => {
    if (jumpscareTimerRef.current !== null) window.clearTimeout(jumpscareTimerRef.current);
    const delay = 150 + Math.floor(Math.random() * 750);
    jumpscareTimerRef.current = window.setTimeout(() => {
      jumpscareTimerRef.current = null;
      if (!playingRef.current) return;
      const kinds: JumpscareKind[] = ['maw', 'stare', 'static', 'void'];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      setJumpscare({ id: Date.now(), kind });
      weaponAudioRef.current?.jumpscare();
      navigator.vibrate?.([80, 35, 140, 45, 220]);
      if (jumpscareHideTimerRef.current !== null) {
        window.clearTimeout(jumpscareHideTimerRef.current);
      }
      jumpscareHideTimerRef.current = window.setTimeout(() => {
        jumpscareHideTimerRef.current = null;
        setJumpscare(null);
      }, 1_560);
    }, delay);
  }, []);

  const finishRun = useCallback(() => {
    if (!playingRef.current) return;
    playingRef.current = false;
    sprintRef.current = false;
    Object.keys(pressedRef.current).forEach((key) => {
      pressedRef.current[key as Direction] = false;
    });
    if (document.pointerLockElement) void document.exitPointerLock();
    const summary = {
      ...runStatsRef.current,
      survivalMs: performance.now() - runStartedAtRef.current,
    };
    deathSummaryRef.current = summary;
    stopInspectorExecution();
    setDeathSummary(summary);
    setQueueDialogue(null);
    setPlaying(false);
  }, [stopInspectorExecution]);

  const beginInspectorExecution = useCallback(() => {
    if (inspectorExecutingRef.current || !playingRef.current) return;
    inspectorExecutingRef.current = true;
    setInspectorExecuting(true);
    sprintRef.current = false;
    Object.keys(pressedRef.current).forEach((key) => {
      pressedRef.current[key as Direction] = false;
    });
    const drainHealth = () => {
      if (!playingRef.current) return;
      const damage = Math.min(8, healthRef.current);
      healthRef.current -= damage;
      runStatsRef.current.damageTaken += damage;
      setHealth(healthRef.current);
      navigator.vibrate?.([70, 40, 110]);
      if (healthRef.current === 0) {
        inspectorExecutionTimerRef.current = null;
        finishRun();
        return;
      }
      inspectorExecutionTimerRef.current = window.setTimeout(drainHealth, 650);
    };
    inspectorExecutionTimerRef.current = window.setTimeout(drainHealth, 450);
  }, [finishRun]);

  const startNextShift = useCallback(() => {
    shiftStatsRef.current = createShiftStats();
    shiftSummaryRef.current = null;
    setShiftSummary(null);
    setCoinReward(0);
    setRunComplete(false);
    setShiftNumber((current) => {
      const nextShift = current + 1;
      shiftNumberRef.current = nextShift;
      return nextShift;
    });
    healthRef.current = 100;
    setHealth(100);
    footstepAudioRef.current?.enable();
    weaponAudioRef.current?.enable();
    nightmareAudioRef.current?.enable();
    customerSystemRef.current?.start(performance.now());
    daylightCycleRef.current?.start(Date.now());
    playingRef.current = true;
    setPlaying(true);
    if (canvasRef.current) void canvasRef.current.requestPointerLock();
  }, []);

  const returnToMenu = useCallback(() => {
    shiftStatsRef.current = createShiftStats();
    shiftSummaryRef.current = null;
    runStatsRef.current = createRunStats();
    setShiftSummary(null);
    setRunComplete(false);
    setCoinReward(0);
    shiftNumberRef.current = 1;
    setShiftNumber(1);
    setHidden(false);
    healthRef.current = 100;
    setHealth(100);
    setStamina(100);
    setExhausted(false);
    classMedkitsRef.current = 0;
    setClassMedkits(0);
    judgementPointsRef.current = MAX_JUDGEMENT_POINTS;
    inspectorSummonedRef.current = false;
    setJudgementPoints(MAX_JUDGEMENT_POINTS);
    nightmareStartedRef.current = false;
    nightmareAudioRef.current?.stop();
    stopInspectorExecution();
    resetWorldRef.current?.();
    menuOpenRef.current = true;
    setMenuOpen(true);
  }, [stopInspectorExecution]);

  const restartRun = useCallback(() => {
    shiftStatsRef.current = createShiftStats();
    shiftSummaryRef.current = null;
    deathSummaryRef.current = null;
    runStatsRef.current = createRunStats();
    runStartedAtRef.current = performance.now();
    setShiftSummary(null);
    setDeathSummary(null);
    setJumpscare(null);
    setNightmareActive(false);
    setQueueDialogue(null);
    setHidden(false);
    shiftNumberRef.current = 1;
    setShiftNumber(1);
    nightmareStartedRef.current = false;
    nightmareAudioRef.current?.stop();
    healthRef.current = 100;
    setHealth(100);
    setStamina(100);
    setExhausted(false);
    judgementPointsRef.current = MAX_JUDGEMENT_POINTS;
    inspectorSummonedRef.current = false;
    stopInspectorExecution();
    setJudgementPoints(MAX_JUDGEMENT_POINTS);
    resetWorldRef.current?.();
    prepareClassLoadout();
    footstepAudioRef.current?.enable();
    weaponAudioRef.current?.enable();
    nightmareAudioRef.current?.enable();
    customerSystemRef.current?.start(performance.now());
    daylightCycleRef.current?.start(Date.now());
    playingRef.current = true;
    setPlaying(true);
    if (canvasRef.current) void canvasRef.current.requestPointerLock();
  }, [prepareClassLoadout, stopInspectorExecution]);

  useEffect(() => {
    const nightmareAudio = createNightmareAudio();
    nightmareAudioRef.current = nightmareAudio;
    return () => {
      nightmareAudio.dispose();
      if (nightmareAudioRef.current === nightmareAudio) nightmareAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!playing || shiftNumber !== NIGHTMARE_SHIFT || nightmareStartedRef.current) return;
    nightmareStartedRef.current = true;
    let endTimer: number | undefined;
    const triggerTimer = window.setTimeout(() => {
      if (!playingRef.current) return;
      setNightmareActive(true);
      nightmareAudioRef.current?.start();
      customerSystemRef.current?.startNightmareWave(performance.now());
      endTimer = window.setTimeout(() => {
        setNightmareActive(false);
        nightmareAudioRef.current?.stop();
      }, NIGHTMARE_DURATION_MS);
    }, randomNightmareDelay());
    return () => {
      window.clearTimeout(triggerTimer);
      if (endTimer !== undefined) window.clearTimeout(endTimer);
      setNightmareActive(false);
      nightmareAudioRef.current?.stop();
    };
  }, [playing, shiftNumber]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = buildGasStationScene();
    const camera = new THREE.PerspectiveCamera(68, 16 / 9, 0.1, 70);
    scene.add(camera);
    const renderer = createGameRenderer(canvas, scene, camera);
    camera.position.set(0, 1.65, 8);
    camera.rotation.order = 'YXZ';
    const playerAvatar = createPlayerAvatarSystem(scene, camera);
    let previousTime = performance.now();
    let frame = 0;
    let wasHidden = false;
    const jump = { height: 0, velocity: 0 };
    const sprint = { stamina: 100, exhausted: false };
    const crouch = { amount: 0 };
    const footsteps = createFootstepAudio();
    const weaponAudio = createWeaponAudio();
    let customers: ReturnType<typeof createCustomerSystem>;
    customers = createCustomerSystem(scene, {
      onPlayerHit: (inspectorAttack) => {
        if (inspectorAttack) {
          beginInspectorExecution();
          return;
        }
        const damage = Math.min(
          15 * difficultyMultiplier(settingsRef.current, shiftNumberRef.current),
          healthRef.current,
        );
        runStatsRef.current.damageTaken += damage;
        healthRef.current -= damage;
        setHealth(healthRef.current);
        if (healthRef.current === 0) finishRun();
      },
      onAnomalyKilled: (flawless) => {
        shiftStatsRef.current.anomaliesShot += 1;
        runStatsRef.current.anomaliesShot += 1;
        if (flawless) {
          judgementPointsRef.current = Math.min(
            MAX_JUDGEMENT_POINTS,
            judgementPointsRef.current + 1,
          );
          setJudgementPoints(judgementPointsRef.current);
        }
      },
      onInnocentShot: () => {
        judgementPointsRef.current = Math.max(0, judgementPointsRef.current - 1);
        setJudgementPoints(judgementPointsRef.current);
        if (judgementPointsRef.current === 0 && !inspectorSummonedRef.current) {
          inspectorSummonedRef.current = true;
          customers.summonInspector();
        }
      },
      onDialogue: (dialogue) => {
        setQueueDialogue(dialogue);
        if (dialogueTimerRef.current !== null) {
          window.clearTimeout(dialogueTimerRef.current);
        }
        dialogueTimerRef.current = window.setTimeout(() => {
          dialogueTimerRef.current = null;
          setQueueDialogue(null);
        }, 3_600);
      },
      isBloodEnabled: () => settingsRef.current.bloodEnabled,
      getDifficultyMultiplier: () => difficultyMultiplier(
        settingsRef.current,
        shiftNumberRef.current,
      ),
    });
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
        runStatsRef.current.medkitsUsed += 1;
        return true;
      },
      setNearMess,
      setNearMedkit,
      setCheckoutKind,
      () => {
        shiftStatsRef.current.shots += 1;
        runStatsRef.current.shots += 1;
      },
      () => {
        shiftStatsRef.current.purchases += 1;
        runStatsRef.current.purchases += 1;
      },
      queueJumpscare,
    );
    equipClassWeaponRef.current = actions.equipWeapon;
    const detachInput = attachGameSessionInput({
      canvas,
      look: lookRef,
      getSensitivity: () => settingsRef.current.sensitivity,
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
      onUseMedkit: usePortableMedkit,
      onSelectSlot: (slot) => {
        if (playingRef.current) actions.selectSlot(slot);
      },
      onAim: (aiming) => {
        actions.aim(playingRef.current && aiming);
      },
      onShoot: () => { if (playingRef.current) actions.shoot(); },
      onStart: startGame,
    });
    resetWorldRef.current = () => {
      camera.position.set(0, 1.65, 8);
      lookRef.current = { yaw: 0, pitch: 0 };
      jump.height = 0;
      jump.velocity = 0;
      sprint.stamina = 100;
      sprint.exhausted = false;
      crouch.amount = 0;
      crouchedRef.current = false;
      actions.reset();
    };
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
        sprintRef.current
        && pressedRef.current.up
        && jump.height === 0
        && sprint.stamina > 0
        && !sprint.exhausted;
      footsteps.update(time, moved && jump.height === 0, sprinting, sprint.exhausted);
      jumpRequestedRef.current = false;
      if (time - lastStaminaUpdate > 100) {
        lastStaminaUpdate = time;
        setStamina(Math.round(sprint.stamina));
        setExhausted(sprint.exhausted);
      }
      lookRef.current.pitch = THREE.MathUtils.clamp(lookRef.current.pitch, -1.2, 1.2);
      camera.rotation.set(lookRef.current.pitch, yaw, 0);
      playerAvatar.update(yaw, time);
      updateAtmosphere(scene, delta);
      updateWeaponEffects(scene, delta);
      updateStaffDoors(scene, delta);
      customers.update(time, delta, camera);
      daylight.update(Date.now());
      const nowHidden = isHiddenInRestroom(scene, camera.position);
      if (nowHidden !== wasHidden) {
        wasHidden = nowHidden;
        setHidden(nowHidden);
      }
      actions.updateProximity();
      playerAvatar.renderMirror((mirrorCamera, target) => {
        renderer.renderToTarget(mirrorCamera, target);
      });
      renderer.render();
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      detachInput();
      actions.dispose();
      playerAvatar.dispose();
      footsteps.dispose();
      weaponAudio.dispose();
      customers.dispose();
      if (footstepAudioRef.current === footsteps) footstepAudioRef.current = null;
      if (weaponAudioRef.current === weaponAudio) weaponAudioRef.current = null;
      if (customerSystemRef.current === customers) customerSystemRef.current = null;
      if (daylightCycleRef.current === daylight) daylightCycleRef.current = null;
      if (jumpscareTimerRef.current !== null) window.clearTimeout(jumpscareTimerRef.current);
      if (jumpscareHideTimerRef.current !== null) {
        window.clearTimeout(jumpscareHideTimerRef.current);
      }
      if (inspectorExecutionTimerRef.current !== null) {
        window.clearTimeout(inspectorExecutionTimerRef.current);
      }
      if (dialogueTimerRef.current !== null) window.clearTimeout(dialogueTimerRef.current);
      resetWorldRef.current = null;
      equipClassWeaponRef.current = null;
      renderer.dispose();
    };
  }, [
    beginInspectorExecution,
    finishRun,
    queueJumpscare,
    setControl,
    startGame,
    usePortableMedkit,
  ]);

  return (
    <section className="game-shell">
      <div className="screen-frame">
        <canvas ref={canvasRef} aria-label="A low-poly 3D gas station you can enter" />
        <GameHud
          hidden={hidden}
          playing={playing}
          shiftNumber={shiftNumber}
          onShiftEnd={finishShift}
          stamina={stamina}
          exhausted={exhausted}
          health={health}
          judgementPoints={judgementPoints}
          medkits={economy.medkits + classMedkits}
          weapon={weapon.weapon}
          activeSlot={weapon.activeSlot}
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
            runComplete={runComplete}
            coinReward={coinReward}
            rewardPending={coinReward > 0 && economyBusy}
            rewardAvailable={economy.signedIn}
            mode={settings.difficulty}
            onContinue={runComplete ? returnToMenu : startNextShift}
          />
        )}
        {deathSummary && <DeathScreen stats={deathSummary} onRestart={restartRun} />}
        {jumpscare && <Jumpscare key={jumpscare.id} kind={jumpscare.kind} />}
        {nightmareActive && <NightmareOverlay bloodEnabled={settings.bloodEnabled} />}
        {inspectorExecuting && <InspectorExecution />}
        {queueDialogue && <QueueDialogue dialogue={queueDialogue} />}
      </div>
      {menuOpen && (
        <MainMenu
          settings={settings}
          economy={economy}
          economyBusy={economyBusy}
          onSettingsChange={updateSettings}
          onBuyMedkit={() => { void purchaseMedkit(); }}
          onBuyClass={(playerClass) => { void purchaseClass(playerClass); }}
          onSelectClass={(playerClass) => { void chooseClass(playerClass); }}
          onStart={startFromMenu}
        />
      )}
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
