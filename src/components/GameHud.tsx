import './GameHud.css';
import { GameClock } from './GameClock';
import { type CheckoutKind } from '../lib/customerSystem';
import { type WeaponKind, WEAPON_CONFIG } from '../lib/gameWeapon';

type GameHudProps = {
  inside: boolean;
  playing: boolean;
  showStartScreen: boolean;
  shiftNumber: number;
  onShiftEnd: () => void;
  stamina: number;
  health: number;
  weapon: WeaponKind | null;
  ammo: number;
  capacity: number;
  nearbyWeapon: WeaponKind | null;
  reloading: boolean;
  nearDoor: boolean;
  nearMess: boolean;
  nearMedkit: boolean;
  checkoutKind: CheckoutKind | null;
  doorOpen: boolean;
  doorLabel: 'STAFF DOOR' | 'BACK DOOR';
};

export function GameHud({
  inside,
  playing,
  showStartScreen,
  shiftNumber,
  onShiftEnd,
  stamina,
  health,
  weapon,
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
      {showStartScreen && (
        <div className="start-screen">
          CLICK TO ENTER
          <br />
          <small>DRAG TO LOOK ON MOBILE</small>
        </div>
      )}
      <div className="shift-badge">
        <span>SHIFT</span>
        <strong>{String(shiftNumber).padStart(2, '0')}</strong>
      </div>
      <p className={`location-label ${inside ? 'location-label--inside' : ''}`}>
        {inside ? 'INSIDE: SMELLS LIKE OLD HOT DOGS' : 'OUTSIDE: WALK THROUGH THE OPEN DOOR'}
      </p>
      <GameClock playing={playing} shiftNumber={shiftNumber} onShiftEnd={onShiftEnd} />
      <div className="health-meter" role="progressbar" aria-label="Health" aria-valuenow={health}>
        <div className="health-meter__header">
          <span>HEALTH</span>
          <span>{health}%</span>
        </div>
        <div className="health-meter__track">
          <span style={{ width: `${health}%` }} />
        </div>
      </div>
      <div className="sprint-meter" role="progressbar" aria-label="Sprint stamina" aria-valuenow={stamina}>
        <div className="sprint-meter__header">
          <span>SPRINT</span>
          <span>{stamina}%</span>
        </div>
        <div className="sprint-meter__track">
          <span style={{ width: `${stamina}%` }} />
        </div>
      </div>
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
      {weapon && (
        <div className={`weapon-hud ${ammo === 0 ? 'weapon-hud--empty' : ''}`}>
          <span>{weaponLabel}</span>
          <strong>{ammo} / {capacity}</strong>
          <small>
            {reloading
              ? weapon === 'shotgun' ? 'BREAK-ACTION RELOAD…' : 'RELOADING…'
              : ammo > 0 ? 'CLICK · SHOOT · R RELOAD' : 'EMPTY · R RELOAD'}
          </small>
        </div>
      )}
      <span className="crosshair" aria-hidden="true">+</span>
    </>
  );
}
