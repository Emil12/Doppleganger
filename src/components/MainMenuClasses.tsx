import { type GameEconomy } from '../lib/gameEconomy';
import {
  PLAYER_CLASSES,
  PLAYER_CLASS_KINDS,
  type PlayerClassKind,
} from '../lib/playerClasses';
import './MainMenuClasses.css';

type MainMenuClassesProps = {
  economy: GameEconomy;
  busy: boolean;
  onBuy: (playerClass: PlayerClassKind) => void;
  onSelect: (playerClass: PlayerClassKind) => void;
  onBack: () => void;
};

export function MainMenuClasses({
  economy,
  busy,
  onBuy,
  onSelect,
  onBack,
}: MainMenuClassesProps) {
  return (
    <div className="menu-classes">
      <header>
        <strong>EMPLOYEE CLASSES</strong>
        <span>◉ {economy.coins} COINS</span>
      </header>
      <div className="menu-classes__list">
        {PLAYER_CLASS_KINDS.map((kind) => {
          const config = PLAYER_CLASSES[kind];
          const owned = economy.ownedClasses.includes(kind);
          const selected = economy.selectedClass === kind;
          const affordable = economy.coins >= config.cost;
          return (
            <article key={kind} className={selected ? 'is-active' : ''}>
              <i aria-hidden="true">{config.icon}</i>
              <div>
                <strong>{config.name}</strong>
                <small>{config.description}</small>
                <span>
                  {selected ? 'ACTIVE' : owned ? 'OWNED' : `${config.cost} COINS`}
                </span>
              </div>
              <button
                type="button"
                disabled={busy || selected || (!owned && (!economy.signedIn || !affordable))}
                onClick={() => owned ? onSelect(kind) : onBuy(kind)}
              >
                {selected ? 'SELECTED' : owned ? 'SELECT' : `UNLOCK · ${config.cost}`}
              </button>
            </article>
          );
        })}
      </div>
      {!economy.signedIn && <small className="menu-classes__notice">SIGN IN TO UNLOCK CLASSES</small>}
      <button type="button" onClick={onBack}>BACK</button>
    </div>
  );
}
