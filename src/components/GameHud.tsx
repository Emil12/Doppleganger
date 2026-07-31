import './GameHud.css';
import { GameClock } from './GameClock';
import { type CheckoutKind } from '../lib/customerSystem';
import { type WeaponKind, type WeaponSlot, WEAPON_CONFIG } from '../lib/gameWeapon';
import { type DoorLabel } from '../lib/staffDoor';

type GameHudProps = {
  hidden: boolean;
  playing: boolean;
  shiftNumber: number;
  onShiftEnd: () => void;
  stamina: number;
  exhausted: boolean;
  health: number;
  maxHealth: number;
  judgementPoints: number;
  medkits: number;
  weapon: WeaponKind | null;
  activeSlot: WeaponSlot | null;
  ammo: number;
  capacity: number;
  nearbyWeapon: WeaponKind | null;
  reloading: boolean;
  nearDoor: boolean;
  nearMess: boolean;
  nearMedkit: boolean;
  checkoutKind: CheckoutKind | null;
  doorOpen: boolean;
  doorLabel: DoorLabel;
};

export function GameHud({
  hidden,
  playing,
  shiftNumber,
  onShiftEnd,
  stamina,
  exhausted,
  health,
  maxHealth,
  judgementPoints,
  medkits,
  weapon,
  activeSlot,
  ammo,
  capacity,
  nearbyWeapon,
  reloading,
  nearDoor,
  nearMess,
  nearMedkit,
  checkoutKind,
  doorOpen,
  doorLabel,
}: GameHudProps) {
  const weaponLabel = weapon ? WEAPON_CONFIG[weapon].label : '';
  const nearbyWeaponLabel = nearbyWeapon ? WEAPON_CONFIG[nearbyWeapon].label : '';
  return (
    <>
      <div className="screen-noise" aria-hidden="true" />
      <div className="shift-badge">
        <span>SHIFT</span>
        <strong>{String(shiftNumber).padStart(2, '0')}</strong>
      </div>
      <div className={`judgement-points ${
        judgementPoints === 0 ? 'judgement-points--empty' : ''
      }`} aria-label={`${judgementPoints} judgement hearts remaining`}>
        <span>{judgementPoints === 0 ? 'INSPECTOR' : 'JUDGEMENT'}</span>
        <strong className="judgement-hearts">
          {Array.from({ length: 5 }, (_, index) => (
            <i
              key={index}
              className={index < judgementPoints ? 'is-full' : 'is-empty'}
              aria-hidden="true"
            >
              {index < judgementPoints ? '♥' : '♡'}
            </i>
          ))}
        </strong>
      </div>
      {hidden && <p className="hidden-indicator">HIDDEN · STAY QUIET</p>}
      <GameClock playing={playing} shiftNumber={shiftNumber} onShiftEnd={onShiftEnd} />
      <div
        className="health-meter"
        role="progressbar"
        aria-label="Health"
        aria-valuenow={health}
        aria-valuemax={maxHealth}
      >
        <div className="health-meter__header">
          <span>HEALTH</span>
          <span>{health} / {maxHealth}</span>
        </div>
        <div className="health-meter__track">
          <span style={{ width: `${(health / maxHealth) * 100}%` }} />
        </div>
      </div>
      <div
        className={`sprint-meter ${exhausted ? 'sprint-meter--exhausted' : ''}`}
        role="progressbar"
        aria-label="Sprint stamina"
        aria-valuenow={stamina}
      >
        <div className="sprint-meter__header">
          <span>{exhausted ? 'EXHAUSTED' : 'SPRINT'}</span>
          <span>{stamina}%</span>
        </div>
        <div className="sprint-meter__track">
          <span style={{ width: `${stamina}%` }} />
        </div>
      </div>
      {medkits > 0 && (
        <div className="portable-medkit">
          <span>H · MEDKIT</span>
          <strong>× {medkits}</strong>
        </div>
      )}
      {nearMess && <p className="pickup-prompt pickup-prompt--danger">E · CLEAN THE MESS</p>}
      {!nearMess && nearMedkit && (
        <p className="pickup-prompt pickup-prompt--healing">E · USE MEDKIT</p>
      )}
      {!nearMess && !nearMedkit && checkoutKind && (
        <p className={`pickup-prompt ${
          checkoutKind === 'anomaly' ? 'pickup-prompt--anomaly' : 'pickup-prompt--payment'
        }`}>
          {checkoutKind === 'anomaly'
            ? 'ANOMALOUS ID · E SERVE · F REFUSE'
            : 'ID SHOWN · E ACCEPT · F REFUSE'}
        </p>
      )}
      {!nearMess && !nearMedkit && !checkoutKind && nearDoor && (
        <p className="pickup-prompt">E · {doorOpen ? 'CLOSE' : 'OPEN'} {doorLabel}</p>
      )}
      {!nearMess && !nearMedkit && !checkoutKind && !nearDoor && nearbyWeapon && (
        <p className="pickup-prompt">
          {weapon ? `E · PUT BACK ${weaponLabel}` : `E · PICK UP ${nearbyWeaponLabel}`}
        </p>
      )}
      {weapon && activeSlot !== null && (
        <div className={`weapon-hud ${ammo === 0 ? 'weapon-hud--empty' : ''}`}>
          <span>{weaponLabel}</span>
          <strong>{ammo} / {capacity}</strong>
          <small>
            {reloading
              ? `${weapon === 'flamethrower' ? 'REFILLING FUEL' : 'RELOADING'}… ${ammo} / ${capacity}`
              : ammo > 0 ? 'LMB SHOOT · RMB AIM · R RELOAD' : 'EMPTY · R RELOAD'}
          </small>
          <small>SLOT {activeSlot} · PRESS {activeSlot} TO HOLSTER</small>
        </div>
      )}
      <span className="crosshair" aria-hidden="true">+</span>
    </>
  );
}
