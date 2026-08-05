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
import { type StartingAmmo } from '../lib/weaponAmmo';
import {
  NIGHTMARE_AMMO,
  NIGHTMARE_END_SHIFT,
  NIGHTMARE_REFUSAL_LIMIT,
  NIGHTMARE_REWARD,
  nightmareMedkitHealth,
} from '../lib/nightmareMode';
import { type MultiplayerRoomSession } from '../lib/multiplayerRoom';
import {
  createMultiplayerSystem,
  type MultiplayerConnection,
} from '../lib/multiplayerSystem';
import { type ChatMessage } from '../lib/multiplayerProtocol';
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
import { createCounterRadioSystem } from '../lib/counterRadioSystem';
import { type RadioSelection } from '../lib/counterRadioAudio';
import { createFuelPumpSystem } from '../lib/fuelPumpSystem';
import { createBreakableGlassSystem } from '../lib/breakableGlassSystem';
import {
  hasSeenFirstShiftTutorial,
  rememberFirstShiftTutorial,
} from '../lib/firstShiftTutorial';
import {
  hasSeenFirstCorrectDecision,
  rememberFirstCorrectDecision,
  type CustomerDecisionFeedbackKind,
} from '../lib/customerDecisionFeedback';
import { createCustomerSystem, type CheckoutKind } from '../lib/customerSystem';
import { type QueueDialogue as QueueDialogueState } from '../lib/customerDialogue';
import { createDaylightCycle } from '../lib/daylightCycle';
import { createEntityCullingSystem } from '../lib/entityCulling';
import {
  addGameCoins,
  buyGameClass,
  buyGameGrenade,
  buyGameMolotov,
  buyGameMedkit,
  EMPTY_GAME_ECONOMY,
  loadGameEconomy,
  type GameEconomy,
  selectGameClass,
  updateGameDisplayName,
  useGameGrenade,
  useGameMolotov,
  useGameMedkit,
} from '../lib/gameEconomy';
import { claimDailyReward } from '../lib/dailyRewards';
import { createGrenadeSystem } from '../lib/grenadeSystem';
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
  applyFreePlayHours,
  loadFreePlayRemainingMs,
  saveFreePlayRemainingMs,
} from '../lib/freePlayTrial';
import {
  staffDoorBlocks,
  updateStaffDoors,
} from '../lib/staffDoor';
import { AccountRequired } from './AccountRequired';
import { DeathScreen } from './DeathScreen';
import { CustomerDecisionFeedback } from './CustomerDecisionFeedback';
import { FirstShiftTutorial } from './FirstShiftTutorial';
import { GameHud } from './GameHud';
import { InspectorExecution } from './InspectorExecution';
import { Jumpscare, type JumpscareKind } from './Jumpscare';
import { MainMenu } from './MainMenu';
import { MobileTouchControls } from './MobileTouchControls';
import { MultiplayerStatus } from './MultiplayerStatus';
import { MultiplayerChat } from './MultiplayerChat';
import { NightmareOverlay } from './NightmareOverlay';
import { QueueDialogue } from './QueueDialogue';
import { ShiftSummary } from './ShiftSummary';
import { useHealthRegeneration } from './useHealthRegeneration';

const MAX_JUDGEMENT_POINTS = 5;
const ANOMALY_HIT_DAMAGE = 40;
const TARGET_FRAME_INTERVAL_MS = 1000 / 80;

function requestDesktopPointerLock(canvas: HTMLCanvasElement | null) {
  if (
    !canvas
    || !window.matchMedia('(hover: hover) and (pointer: fine)').matches
  ) return;
  void canvas.requestPointerLock();
}

type GasStationGameProps = {
  multiplayerRoom?: MultiplayerRoomSession;
  onKickedMultiplayer?: () => void;
  onLeaveMultiplayer?: () => void;
};

export function GasStationGame({
  multiplayerRoom,
  onKickedMultiplayer,
  onLeaveMultiplayer,
}: GasStationGameProps = {}) {
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
  const maxHealthRef = useRef(100);
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
  const decisionFeedbackTimerRef = useRef<number | null>(null);
  const firstCorrectDecisionSeenRef = useRef(hasSeenFirstCorrectDecision());
  const menuOpenRef = useRef(!multiplayerRoom);
  const multiplayerRoomRef = useRef(multiplayerRoom);
  const multiplayerDownedRef = useRef(false);
  const multiplayerSystemRef = useRef<ReturnType<typeof createMultiplayerSystem> | null>(null);
  const multiplayerRevivesRef = useRef(0);
  const economyRef = useRef<GameEconomy>(EMPTY_GAME_ECONOMY);
  const economyBusyRef = useRef(false);
  const classMedkitsRef = useRef(0);
  const nightmareRefusalsRef = useRef(0);
  const actionsRef = useRef<ReturnType<typeof createGameActions> | null>(null);
  const radioSystemRef = useRef<ReturnType<typeof createCounterRadioSystem> | null>(null);
  const grenadeSystemRef = useRef<ReturnType<typeof createGrenadeSystem> | null>(null);
  const equipClassWeaponsRef = useRef<
    ((kinds: readonly [WeaponKind, WeaponKind?], startingAmmo?: StartingAmmo) => void) | null
  >(null);
  const [settings, setSettings] = useState(loadGameSettings);
  const settingsRef = useRef(settings);
  const [menuOpen, setMenuOpen] = useState(!multiplayerRoom);
  const [sceneReady, setSceneReady] = useState(false);
  const [multiplayerStatus, setMultiplayerStatus] = useState<MultiplayerConnection>('connecting');
  const [multiplayerPlayers, setMultiplayerPlayers] = useState(multiplayerRoom ? 1 : 0);
  const [multiplayerDowned, setMultiplayerDowned] = useState(false);
  const [multiplayerRevives, setMultiplayerRevives] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [nearDownedTeammate, setNearDownedTeammate] = useState<string | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stamina, setStamina] = useState(100);
  const [exhausted, setExhausted] = useState(false);
  const [weapon, setWeapon] = useState(INITIAL_WEAPON_STATE);
  const [door, setDoor] = useState(INITIAL_DOOR_STATE);
  const [nearMess, setNearMess] = useState(false);
  const [nearMedkit, setNearMedkit] = useState(false);
  const [nearRadio, setNearRadio] = useState(false);
  const [radioSelection, setRadioSelection] = useState<RadioSelection | null>(null);
  const [checkoutKind, setCheckoutKind] = useState<CheckoutKind | null>(null);
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [shiftNumber, setShiftNumber] = useState(1);
  const [shiftSummary, setShiftSummary] = useState<ShiftStats | null>(null);
  const [deathSummary, setDeathSummary] = useState<DeathSummaryStats | null>(null);
  const [jumpscare, setJumpscare] = useState<{ id: number; kind: JumpscareKind } | null>(null);
  const [nightmareActive, setNightmareActive] = useState(false);
  const [judgementPoints, setJudgementPoints] = useState(MAX_JUDGEMENT_POINTS);
  const [inspectorExecuting, setInspectorExecuting] = useState(false);
  const [queueDialogue, setQueueDialogue] = useState<QueueDialogueState | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<CustomerDecisionFeedbackKind | null>(null);
  const [economy, setEconomy] = useState(EMPTY_GAME_ECONOMY);
  const [economyBusy, setEconomyBusy] = useState(true);
  const [runComplete, setRunComplete] = useState(false);
  const [coinReward, setCoinReward] = useState(0);
  const [classMedkits, setClassMedkits] = useState(0);
  const [trialRemainingMs, setTrialRemainingMs] = useState(loadFreePlayRemainingMs);
  const trialRemainingRef = useRef(trialRemainingMs);

  useHealthRegeneration(
    playing && !inspectorExecuting && !multiplayerDowned,
    healthRef,
    maxHealthRef,
    setHealth,
  );

  const applyEconomy = useCallback((nextEconomy: GameEconomy) => {
    const remaining = applyFreePlayHours(nextEconomy.freePlayHours);
    trialRemainingRef.current = remaining;
    setTrialRemainingMs(remaining);
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

  const purchaseGrenade = useCallback(async () => {
    if (economyBusyRef.current || economyRef.current.coins < 10) return;
    economyBusyRef.current = true;
    setEconomyBusy(true);
    try {
      const nextEconomy = await buyGameGrenade();
      if (nextEconomy) applyEconomy(nextEconomy);
    } finally {
      economyBusyRef.current = false;
      setEconomyBusy(false);
    }
  }, [applyEconomy]);

  const purchaseMolotov = useCallback(async () => {
    if (economyBusyRef.current || economyRef.current.coins < 5) return;
    economyBusyRef.current = true;
    setEconomyBusy(true);
    try {
      const nextEconomy = await buyGameMolotov();
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

  const changeNickname = useCallback(async (displayName: string) => {
    if (economyBusyRef.current) return false;
    economyBusyRef.current = true;
    setEconomyBusy(true);
    try {
      const nextEconomy = await updateGameDisplayName(displayName);
      if (!nextEconomy) return false;
      applyEconomy(nextEconomy);
      return true;
    } finally {
      economyBusyRef.current = false;
      setEconomyBusy(false);
    }
  }, [applyEconomy]);

  const collectDailyReward = useCallback(async () => {
    if (economyBusyRef.current || !economyRef.current.signedIn) return false;
    economyBusyRef.current = true;
    setEconomyBusy(true);
    try {
      if (!await claimDailyReward()) return false;
      applyEconomy(await loadGameEconomy());
      return true;
    } finally {
      economyBusyRef.current = false;
      setEconomyBusy(false);
    }
  }, [applyEconomy]);

  const prepareClassLoadout = useCallback(() => {
    const config = PLAYER_CLASSES[economyRef.current.selectedClass];
    classMedkitsRef.current = config.startingMedkits;
    setClassMedkits(config.startingMedkits);
    maxHealthRef.current = config.maxHealth;
    healthRef.current = config.maxHealth;
    setMaxHealth(config.maxHealth);
    setHealth(config.maxHealth);
    const ammo = settingsRef.current.difficulty === 'nightmare'
      ? NIGHTMARE_AMMO
      : config.startingAmmo;
    equipClassWeaponsRef.current?.(config.weapons, ammo);
  }, []);

  const consumePortableMedkit = useCallback(async () => {
    if (classMedkitsRef.current > 0) {
      classMedkitsRef.current -= 1;
      setClassMedkits(classMedkitsRef.current);
      runStatsRef.current.medkitsUsed += 1;
      return true;
    }
    if (
      economyBusyRef.current
      || economyRef.current.medkits < 1
    ) return false;
    economyBusyRef.current = true;
    setEconomyBusy(true);
    try {
      const nextEconomy = await useGameMedkit();
      if (!nextEconomy || !playingRef.current) return false;
      applyEconomy(nextEconomy);
      runStatsRef.current.medkitsUsed += 1;
      return true;
    } finally {
      economyBusyRef.current = false;
      setEconomyBusy(false);
    }
  }, [applyEconomy]);

  const usePortableMedkit = useCallback(async () => {
    if (
      !playingRef.current
      || multiplayerDownedRef.current
      || healthRef.current >= maxHealthRef.current
    ) return;
    if (!await consumePortableMedkit()) return;
    healthRef.current = settingsRef.current.difficulty === 'nightmare'
      ? nightmareMedkitHealth(healthRef.current, maxHealthRef.current)
      : maxHealthRef.current;
    setHealth(healthRef.current);
  }, [consumePortableMedkit]);

  const throwPortableGrenade = useCallback(async () => {
    if (
      !playingRef.current
      || multiplayerDownedRef.current
      || economyBusyRef.current
      || economyRef.current.grenades < 1
    ) return;
    economyBusyRef.current = true;
    setEconomyBusy(true);
    try {
      const nextEconomy = await useGameGrenade();
      if (!nextEconomy || !playingRef.current) return;
      applyEconomy(nextEconomy);
      grenadeSystemRef.current?.throwGrenade();
    } finally {
      economyBusyRef.current = false;
      setEconomyBusy(false);
    }
  }, [applyEconomy]);

  const throwPortableMolotov = useCallback(async () => {
    if (
      !playingRef.current
      || multiplayerDownedRef.current
      || economyBusyRef.current
      || economyRef.current.molotovs < 1
    ) return;
    economyBusyRef.current = true;
    setEconomyBusy(true);
    try {
      const nextEconomy = await useGameMolotov();
      if (!nextEconomy || !playingRef.current) return;
      applyEconomy(nextEconomy);
      grenadeSystemRef.current?.throwMolotov();
    } finally {
      economyBusyRef.current = false;
      setEconomyBusy(false);
    }
  }, [applyEconomy]);

  const setControl = useCallback((direction: Direction, pressed: boolean) => {
    if (!playingRef.current || inspectorExecutingRef.current || multiplayerDownedRef.current) return;
    pressedRef.current[direction] = pressed;
  }, []);

  const stopMultiplayerControls = useCallback(() => {
    sprintRef.current = false;
    jumpRequestedRef.current = false;
    Object.keys(pressedRef.current).forEach((key) => {
      pressedRef.current[key as Direction] = false;
    });
    actionsRef.current?.shoot(false);
    actionsRef.current?.aim(false);
  }, []);

  const handleMultiplayerDamage = useCallback((damage: number) => {
    if (!playingRef.current || multiplayerDownedRef.current) return;
    const appliedDamage = Math.min(damage, healthRef.current);
    healthRef.current -= appliedDamage;
    runStatsRef.current.damageTaken += appliedDamage;
    setHealth(healthRef.current);
    if (healthRef.current > 0) return;
    stopMultiplayerControls();
    if (multiplayerRevivesRef.current >= 3) {
      playingRef.current = false;
      setPlaying(false);
      onKickedMultiplayer?.();
      return;
    }
    multiplayerDownedRef.current = true;
    setMultiplayerDowned(true);
  }, [onKickedMultiplayer, stopMultiplayerControls]);

  const handleMultiplayerRevive = useCallback(() => {
    if (!multiplayerDownedRef.current || multiplayerRevivesRef.current >= 3) return;
    multiplayerRevivesRef.current += 1;
    multiplayerDownedRef.current = false;
    healthRef.current = Math.min(50, maxHealthRef.current);
    setMultiplayerRevives(multiplayerRevivesRef.current);
    setMultiplayerDowned(false);
    setHealth(healthRef.current);
  }, []);

  const receiveChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages((current) => [...current, message].slice(-40));
  }, []);

  const startGame = useCallback(() => {
    if (
      menuOpenRef.current
      || playingRef.current
      || shiftSummaryRef.current
      || deathSummaryRef.current
      || (!economyRef.current.signedIn && trialRemainingRef.current <= 0)
    ) return;
    runStatsRef.current = createRunStats();
    nightmareRefusalsRef.current = 0;
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
    if (!economyRef.current.signedIn && trialRemainingRef.current <= 0) return;
    setRunComplete(false);
    setCoinReward(0);
    menuOpenRef.current = false;
    setMenuOpen(false);
    if (shiftNumberRef.current === 1 && !hasSeenFirstShiftTutorial()) {
      setTutorialOpen(true);
      return;
    }
    startGame();
    requestDesktopPointerLock(canvasRef.current);
  }, [startGame]);

  useEffect(() => {
    if (!multiplayerRoom || !sceneReady || economyBusy || playingRef.current) return;
    startGame();
  }, [economyBusy, multiplayerRoom, sceneReady, startGame]);

  const completeTutorial = useCallback(() => {
    rememberFirstShiftTutorial();
    setTutorialOpen(false);
    startGame();
    requestDesktopPointerLock(canvasRef.current);
  }, [startGame]);

  const updateSettings = useCallback((nextSettings: GameSettings) => {
    settingsRef.current = nextSettings;
    setSettings(nextSettings);
    saveGameSettings(nextSettings);
  }, []);

  const showDecisionFeedback = useCallback((kind: CustomerDecisionFeedbackKind) => {
    if (decisionFeedbackTimerRef.current !== null) {
      window.clearTimeout(decisionFeedbackTimerRef.current);
    }
    setDecisionFeedback(kind);
    decisionFeedbackTimerRef.current = window.setTimeout(() => {
      decisionFeedbackTimerRef.current = null;
      setDecisionFeedback(null);
    }, 2_700);
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
      || (mode === 'hard' && shiftNumber === 25)
      || (mode === 'nightmare' && shiftNumber === NIGHTMARE_END_SHIFT);
    const reward =
      mode === 'easy' && shiftNumber === 10
        ? 5
        : mode === 'hard' && shiftNumber === 25
          ? 10
          : mode === 'nightmare' && shiftNumber === NIGHTMARE_END_SHIFT
            ? NIGHTMARE_REWARD
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
    setDecisionFeedback(null);
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
    if (!economyRef.current.signedIn && trialRemainingRef.current <= 0) return;
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
    healthRef.current = maxHealthRef.current;
    setHealth(maxHealthRef.current);
    multiplayerDownedRef.current = false;
    setMultiplayerDowned(false);
    actionsRef.current?.respawnMedkit();
    if (settingsRef.current.difficulty === 'nightmare') actionsRef.current?.refillAmmo();
    footstepAudioRef.current?.enable();
    weaponAudioRef.current?.enable();
    nightmareAudioRef.current?.enable();
    customerSystemRef.current?.start(performance.now());
    daylightCycleRef.current?.start(Date.now());
    playingRef.current = true;
    setPlaying(true);
    requestDesktopPointerLock(canvasRef.current);
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
    healthRef.current = maxHealthRef.current;
    setHealth(maxHealthRef.current);
    setStamina(100);
    setExhausted(false);
    multiplayerDownedRef.current = false;
    multiplayerRevivesRef.current = 0;
    setMultiplayerDowned(false);
    setMultiplayerRevives(0);
    setNearDownedTeammate(null);
    classMedkitsRef.current = 0;
    setClassMedkits(0);
    nightmareRefusalsRef.current = 0;
    judgementPointsRef.current = MAX_JUDGEMENT_POINTS;
    inspectorSummonedRef.current = false;
    setJudgementPoints(MAX_JUDGEMENT_POINTS);
    nightmareStartedRef.current = false;
    nightmareAudioRef.current?.stop();
    stopInspectorExecution();
    resetWorldRef.current?.();
    if (multiplayerRoomRef.current && onLeaveMultiplayer) {
      onLeaveMultiplayer();
      return;
    }
    menuOpenRef.current = true;
    setMenuOpen(true);
  }, [onLeaveMultiplayer, stopInspectorExecution]);

  const leaveMultiplayer = useCallback(() => {
    playingRef.current = false;
    sprintRef.current = false;
    setPlaying(false);
    if (document.pointerLockElement) void document.exitPointerLock();
    returnToMenu();
  }, [returnToMenu]);

  const restartRun = useCallback(() => {
    if (!economyRef.current.signedIn && trialRemainingRef.current <= 0) return;
    shiftStatsRef.current = createShiftStats();
    shiftSummaryRef.current = null;
    deathSummaryRef.current = null;
    runStatsRef.current = createRunStats();
    nightmareRefusalsRef.current = 0;
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
    maxHealthRef.current = 100;
    setHealth(100);
    setMaxHealth(100);
    setStamina(100);
    setExhausted(false);
    multiplayerDownedRef.current = false;
    multiplayerRevivesRef.current = 0;
    setMultiplayerDowned(false);
    setMultiplayerRevives(0);
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
    requestDesktopPointerLock(canvasRef.current);
  }, [prepareClassLoadout, stopInspectorExecution]);

  useEffect(() => {
    if (!playing || economy.signedIn || trialRemainingRef.current <= 0) return;
    let lastTick = performance.now();
    const tick = () => {
      const now = performance.now();
      if (document.visibilityState === 'visible') {
        const remaining = Math.max(0, trialRemainingRef.current - (now - lastTick));
        trialRemainingRef.current = remaining;
        saveFreePlayRemainingMs(remaining);
        setTrialRemainingMs(remaining);
        if (remaining === 0) {
          playingRef.current = false;
          sprintRef.current = false;
          Object.keys(pressedRef.current).forEach((key) => {
            pressedRef.current[key as Direction] = false;
          });
          if (document.pointerLockElement) void document.exitPointerLock();
          nightmareAudioRef.current?.stop();
          setNightmareActive(false);
          setQueueDialogue(null);
          setPlaying(false);
        }
      }
      lastTick = now;
    };
    const timer = window.setInterval(tick, 1_000);
    const resetTick = () => { lastTick = performance.now(); };
    document.addEventListener('visibilitychange', resetTick);
    return () => {
      tick();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', resetTick);
    };
  }, [economy.signedIn, playing]);

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
    const multiplayer = createMultiplayerSystem(scene, {
      onDamage: handleMultiplayerDamage,
      onRevive: handleMultiplayerRevive,
      showStatus: (status, playerCount) => {
        setMultiplayerStatus(status);
        setMultiplayerPlayers(playerCount);
      },
      onChatMessage: receiveChatMessage,
    });
    multiplayerSystemRef.current = multiplayer;
    if (multiplayerRoomRef.current) multiplayer.connect(multiplayerRoomRef.current);
    const entityCulling = createEntityCullingSystem(scene, camera);
    let previousTime = performance.now();
    let frameAccumulator = 0;
    let frame = 0;
    let wasHidden = false;
    let nextIdleRenderAt = 0;
    let nextEnvironmentUpdateAt = 0;
    let nextProximityUpdateAt = 0;
    let nextCullingUpdateAt = 0;
    const jump = { height: 0, velocity: 0 };
    const sprint = { stamina: 100, exhausted: false };
    const crouch = { amount: 0 };
    const footsteps = createFootstepAudio();
    const weaponAudio = createWeaponAudio();
    let customers: ReturnType<typeof createCustomerSystem>;
    const loseJudgement = () => {
      judgementPointsRef.current = Math.max(0, judgementPointsRef.current - 1);
      setJudgementPoints(judgementPointsRef.current);
      if (judgementPointsRef.current === 0 && !inspectorSummonedRef.current) {
        inspectorSummonedRef.current = true;
        customers.summonInspector();
      }
    };
    customers = createCustomerSystem(scene, {
      onPlayerHit: (inspectorAttack) => {
        if (multiplayerDownedRef.current) return;
        if (inspectorAttack) {
          beginInspectorExecution();
          return;
        }
        const damage = Math.min(ANOMALY_HIT_DAMAGE, healthRef.current);
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
      onInnocentShot: loseJudgement,
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
      isNightmareMode: () => settingsRef.current.difficulty === 'nightmare',
      getDifficultyMultiplier: () => difficultyMultiplier(
        settingsRef.current,
        shiftNumberRef.current,
      ),
    });
    const grenadeSystem = createGrenadeSystem(scene, camera, (position) => {
      customers.blastCustomers(position, 4.5, 12);
      weaponAudio.fire('double_barrel');
      const distance = position.distanceTo(camera.position);
      if (distance < 3.5 && healthRef.current > 0) {
        const blastDamage = Math.round(70 * (1 - distance / 3.5));
        const damage = Math.min(blastDamage, healthRef.current);
        healthRef.current -= damage;
        runStatsRef.current.damageTaken += damage;
        setHealth(healthRef.current);
        if (healthRef.current === 0) finishRun();
      }
      navigator.vibrate?.([90, 35, 140]);
    }, (position) => {
      customers.blastCustomers(position, 3, 1);
      const distance = position.distanceTo(camera.position);
      if (distance < 2.5 && healthRef.current > 0) {
        const damage = Math.min(8, healthRef.current);
        healthRef.current -= damage;
        runStatsRef.current.damageTaken += damage;
        setHealth(healthRef.current);
        if (healthRef.current === 0) finishRun();
      }
    });
    grenadeSystemRef.current = grenadeSystem;
    const daylight = createDaylightCycle(scene);
    const radio = createCounterRadioSystem({
      scene,
      camera,
      showNearby: setNearRadio,
      showSelection: setRadioSelection,
    });
    const fuelPumps = createFuelPumpSystem(scene, () => {
      if (healthRef.current === 0) return;
      weaponAudio.fire('double_barrel');
      const blastDamage = economyRef.current.selectedClass === 'flamer' ? 100 : 80;
      const damage = Math.min(blastDamage, healthRef.current);
      healthRef.current -= damage;
      runStatsRef.current.damageTaken += damage;
      setHealth(healthRef.current);
      navigator.vibrate?.([120, 50, 180]);
      if (healthRef.current === 0) finishRun();
    });
    const breakableGlass = createBreakableGlassSystem(scene, loseJudgement);
    footstepAudioRef.current = footsteps;
    weaponAudioRef.current = weaponAudio;
    const audioWarmupTimers = [
      window.setTimeout(footsteps.prepare, 80),
      window.setTimeout(weaponAudio.prepare, 240),
      window.setTimeout(customers.prepareAudio, 420),
    ];
    customerSystemRef.current = customers;
    daylightCycleRef.current = daylight;
    radioSystemRef.current = radio;
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
        if (healthRef.current >= maxHealthRef.current) return false;
        healthRef.current = settingsRef.current.difficulty === 'nightmare'
          ? nightmareMedkitHealth(healthRef.current, maxHealthRef.current)
          : maxHealthRef.current;
        setHealth(healthRef.current);
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
        if (!firstCorrectDecisionSeenRef.current) {
          firstCorrectDecisionSeenRef.current = true;
          rememberFirstCorrectDecision();
          showDecisionFeedback('first-correct');
        }
      },
      () => {
        showDecisionFeedback('incorrect');
        queueJumpscare();
      },
      (objects) => {
        fuelPumps.hit(objects);
        breakableGlass.hit(objects);
        multiplayer.hit(objects);
      },
    );
    actionsRef.current = actions;
    equipClassWeaponsRef.current = actions.equipWeapons;
    setSceneReady(true);
    const detachInput = attachGameSessionInput({
      canvas,
      look: lookRef,
      getSensitivity: () => settingsRef.current.sensitivity,
      onControl: setControl,
      onJump: () => {
        if (playingRef.current && !multiplayerDownedRef.current) jumpRequestedRef.current = true;
      },
      onSprint: (value) => {
        if (playingRef.current && !multiplayerDownedRef.current) sprintRef.current = value;
      },
      onCrouch: () => {
        if (playingRef.current && !multiplayerDownedRef.current) {
          crouchedRef.current = !crouchedRef.current;
        }
      },
      onInteract: () => {
        if (!playingRef.current || multiplayerDownedRef.current) return;
        const teammate = multiplayer.nearbyDowned(camera.position);
        if (teammate) {
          void consumePortableMedkit().then((consumed) => {
            if (consumed) multiplayer.revive(teammate.playerId);
          });
          return;
        }
        if (!radio.interact()) actions.interact();
      },
      onStopRadio: () => {
        if (playingRef.current) radio.stop();
      },
      onRefuse: () => {
        if (!playingRef.current || multiplayerDownedRef.current) return;
        const refused = actions.refuse();
        if (settingsRef.current.difficulty !== 'nightmare' || refused !== 'anomaly') return;
        nightmareRefusalsRef.current += 1;
        if (nightmareRefusalsRef.current > NIGHTMARE_REFUSAL_LIMIT) {
          customers.attackAllAnomalies();
        }
      },
      onReload: () => {
        if (playingRef.current && !multiplayerDownedRef.current) actions.reload();
      },
      onUseMedkit: usePortableMedkit,
      onThrowGrenade: throwPortableGrenade,
      onThrowMolotov: throwPortableMolotov,
      onSelectSlot: (slot) => {
        if (playingRef.current && !multiplayerDownedRef.current) actions.selectSlot(slot);
      },
      onAim: (aiming) => {
        actions.aim(playingRef.current && !multiplayerDownedRef.current && aiming);
      },
      onShoot: (shooting) => {
        actions.shoot(playingRef.current && !multiplayerDownedRef.current && shooting);
      },
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
      radio.reset();
      fuelPumps.reset();
      grenadeSystem.reset();
      breakableGlass.reset();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const animate = (time: number) => {
      frameAccumulator += time - previousTime;
      previousTime = time;
      if (frameAccumulator < TARGET_FRAME_INTERVAL_MS - 1) {
        frame = requestAnimationFrame(animate);
        return;
      }
      const delta = Math.min(frameAccumulator / 1000, 0.04);
      frameAccumulator %= TARGET_FRAME_INTERVAL_MS;
      if (!playingRef.current) {
        if (time >= nextIdleRenderAt) {
          renderer.render();
          nextIdleRenderAt = time + 200;
        }
        frame = requestAnimationFrame(animate);
        return;
      }
      nextIdleRenderAt = time;
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
        PLAYER_CLASSES[economyRef.current.selectedClass].sprintSpeed,
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
      multiplayer.update(camera, yaw, time, delta, {
        downed: multiplayerDownedRef.current,
        health: healthRef.current,
        revivesUsed: multiplayerRevivesRef.current,
      });
      updateAtmosphere(scene, delta);
      updateWeaponEffects(scene, delta);
      grenadeSystem.update(delta);
      fuelPumps.update(delta);
      breakableGlass.update(delta);
      updateStaffDoors(scene, delta);
      customers.update(time, delta, camera);
      if (time >= nextCullingUpdateAt) {
        entityCulling.update(camera, time);
        nextCullingUpdateAt = time + 50;
      }
      if (time >= nextEnvironmentUpdateAt) {
        daylight.update(Date.now());
        nextEnvironmentUpdateAt = time + 100;
      }
      const nowHidden = isHiddenInRestroom(scene, camera.position);
      if (nowHidden !== wasHidden) {
        wasHidden = nowHidden;
        setHidden(nowHidden);
      }
      if (time >= nextProximityUpdateAt) {
        actions.updateProximity();
        radio.update();
        setNearDownedTeammate(multiplayer.nearbyDowned(camera.position)?.playerName ?? null);
        nextProximityUpdateAt = time + 50;
      }
      playerAvatar.renderMirror((mirrorCamera, target) => {
        entityCulling.update(mirrorCamera, time, true, true);
        renderer.renderToTarget(mirrorCamera, target);
        entityCulling.update(camera, time, true, true);
      });
      renderer.render();
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      audioWarmupTimers.forEach((timer) => window.clearTimeout(timer));
      observer.disconnect();
      detachInput();
      actions.dispose();
      grenadeSystem.dispose();
      if (grenadeSystemRef.current === grenadeSystem) grenadeSystemRef.current = null;
      playerAvatar.dispose();
      multiplayer.dispose();
      if (multiplayerSystemRef.current === multiplayer) multiplayerSystemRef.current = null;
      entityCulling.dispose();
      footsteps.dispose();
      weaponAudio.dispose();
      customers.dispose();
      radio.dispose();
      fuelPumps.dispose();
      breakableGlass.dispose();
      if (footstepAudioRef.current === footsteps) footstepAudioRef.current = null;
      if (weaponAudioRef.current === weaponAudio) weaponAudioRef.current = null;
      if (customerSystemRef.current === customers) customerSystemRef.current = null;
      if (daylightCycleRef.current === daylight) daylightCycleRef.current = null;
      if (radioSystemRef.current === radio) radioSystemRef.current = null;
      if (jumpscareTimerRef.current !== null) window.clearTimeout(jumpscareTimerRef.current);
      if (jumpscareHideTimerRef.current !== null) {
        window.clearTimeout(jumpscareHideTimerRef.current);
      }
      if (inspectorExecutionTimerRef.current !== null) {
        window.clearTimeout(inspectorExecutionTimerRef.current);
      }
      if (dialogueTimerRef.current !== null) window.clearTimeout(dialogueTimerRef.current);
      if (decisionFeedbackTimerRef.current !== null) {
        window.clearTimeout(decisionFeedbackTimerRef.current);
      }
      resetWorldRef.current = null;
      equipClassWeaponsRef.current = null;
      if (actionsRef.current === actions) actionsRef.current = null;
      setSceneReady(false);
      renderer.dispose();
    };
  }, [
    beginInspectorExecution,
    consumePortableMedkit,
    finishRun,
    handleMultiplayerDamage,
    handleMultiplayerRevive,
    queueJumpscare,
    receiveChatMessage,
    setControl,
    showDecisionFeedback,
    startGame,
    throwPortableGrenade,
    throwPortableMolotov,
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
          maxHealth={maxHealth}
          judgementPoints={judgementPoints}
          medkits={economy.medkits + classMedkits}
          grenades={economy.grenades}
          molotovs={economy.molotovs}
          weapon={weapon.weapon}
          activeSlot={weapon.activeSlot}
          ammo={weapon.ammo}
          capacity={weapon.capacity}
          nearbyWeapon={weapon.nearbyWeapon}
          reloading={weapon.reloading}
          nearDoor={door.near}
          nearMess={nearMess}
          nearMedkit={nearMedkit}
          nearRadio={nearRadio}
          nearDownedTeammate={nearDownedTeammate}
          radioSelection={radioSelection}
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
        {multiplayerDowned && (
          <div className="multiplayer-downed" role="status">
            <strong>YOU ARE DOWN</strong>
            <span>WAIT FOR A TEAMMATE WITH A MEDKIT</span>
            <small>{3 - multiplayerRevives} REVIVES LEFT</small>
          </div>
        )}
        {jumpscare && <Jumpscare key={jumpscare.id} kind={jumpscare.kind} />}
        {nightmareActive && <NightmareOverlay bloodEnabled={settings.bloodEnabled} />}
        {inspectorExecuting && <InspectorExecution />}
        {queueDialogue && <QueueDialogue dialogue={queueDialogue} />}
        {decisionFeedback && <CustomerDecisionFeedback kind={decisionFeedback} />}
        {tutorialOpen && <FirstShiftTutorial onComplete={completeTutorial} />}
        {multiplayerRoom && (
          <>
            <MultiplayerStatus
              code={multiplayerRoom.code}
              playerCount={multiplayerPlayers}
              status={multiplayerStatus}
              onLeave={leaveMultiplayer}
            />
            <MultiplayerChat
              connected={multiplayerStatus === 'connected'}
              messages={chatMessages}
              onSend={(text) => multiplayerSystemRef.current?.sendChat(text) ?? false}
            />
          </>
        )}
      </div>
      {menuOpen && (
        <MainMenu
          settings={settings}
          economy={economy}
          economyBusy={economyBusy}
          onSettingsChange={updateSettings}
          onBuyMedkit={() => { void purchaseMedkit(); }}
          onBuyGrenade={() => { void purchaseGrenade(); }}
          onBuyMolotov={() => { void purchaseMolotov(); }}
          onBuyClass={(playerClass) => { void purchaseClass(playerClass); }}
          onSelectClass={(playerClass) => { void chooseClass(playerClass); }}
          onNicknameChange={changeNickname}
          onClaimDailyReward={collectDailyReward}
          onStart={startFromMenu}
          freePlayRemainingMs={
            economy.signedIn && economy.freePlayHours <= 50 ? null : trialRemainingMs
          }
        />
      )}
      {!economyBusy && !economy.signedIn && trialRemainingMs <= 0 && <AccountRequired />}
      {playing && !inspectorExecuting && !shiftSummary && !deathSummary && (
        <MobileTouchControls
          onStart={startGame}
          grenades={economy.grenades}
          onThrowGrenade={() => { void throwPortableGrenade(); }}
          molotovs={economy.molotovs}
          onThrowMolotov={() => { void throwPortableMolotov(); }}
          onMove={({ x, y }) => {
            const deadZone = 0.22;
            setControl('up', y < -deadZone);
            setControl('down', y > deadZone);
            setControl('left', x < -deadZone);
            setControl('right', x > deadZone);
          }}
          onLook={({ x, y }) => {
            if (!playingRef.current || inspectorExecutingRef.current) return;
            const sensitivity = settingsRef.current.sensitivity;
            lookRef.current.yaw -= x * 0.006 * sensitivity;
            lookRef.current.pitch -= y * 0.005 * sensitivity;
          }}
          onShoot={(pressed) => {
            actionsRef.current?.shoot(
              playingRef.current && !multiplayerDownedRef.current && pressed,
            );
          }}
        />
      )}
    </section>
  );
}
