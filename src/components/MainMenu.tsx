import { type PointerEvent, useEffect, useRef, useState } from 'react';
import { type GameEconomy } from '../lib/gameEconomy';
import { type GameSettings } from '../lib/gameSettings';
import { formatFreePlayTime } from '../lib/freePlayTrial';
import { PLAYER_CLASSES, type PlayerClassKind } from '../lib/playerClasses';
import { HowToPlayMenu } from './HowToPlayMenu';
import { MainMenuBackdrop } from './MainMenuBackdrop';
import { MainMenuClasses } from './MainMenuClasses';
import { MainMenuEffects } from './MainMenuEffects';
import { MainMenuSettings } from './MainMenuSettings';
import { MainMenuShop } from './MainMenuShop';
import './MainMenu.css';
import './MainMenuControls.css';
import './MainMenuInterface.css';

type MainMenuProps = {
  settings: GameSettings;
  economy: GameEconomy;
  economyBusy: boolean;
  onSettingsChange: (settings: GameSettings) => void;
  onBuyMedkit: () => void;
  onBuyClass: (playerClass: PlayerClassKind) => void;
  onSelectClass: (playerClass: PlayerClassKind) => void;
  onStart: () => void;
  freePlayRemainingMs: number | null;
};

type MenuPanel = 'main' | 'settings' | 'shop' | 'classes' | 'howToPlay';

export function MainMenu({
  settings,
  economy,
  economyBusy,
  onSettingsChange,
  onBuyMedkit,
  onBuyClass,
  onSelectClass,
  onStart,
  freePlayRemainingMs,
}: MainMenuProps) {
  const [panel, setPanel] = useState<MenuPanel>('main');
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (panel === 'main') return;
    const closePanel = (event: KeyboardEvent) => {
      if (event.code === 'Escape') setPanel('main');
    };
    window.addEventListener('keydown', closePanel);
    return () => window.removeEventListener('keydown', closePanel);
  }, [panel]);

  const moveBackdrop = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = (event.clientX - bounds.left) / bounds.width;
    const pointerY = (event.clientY - bounds.top) / bounds.height;
    const x = pointerX - 0.5;
    const y = pointerY - 0.5;
    menuRef.current?.style.setProperty('--menu-x', `${x * -16}px`);
    menuRef.current?.style.setProperty('--menu-y', `${y * -10}px`);
    menuRef.current?.style.setProperty('--cursor-x', `${pointerX * 100}%`);
    menuRef.current?.style.setProperty('--cursor-y', `${pointerY * 100}%`);
  };

  return (
    <section
      ref={menuRef}
      className="main-menu"
      aria-label="Main menu"
      onPointerMove={moveBackdrop}
    >
      <MainMenuBackdrop />
      <MainMenuEffects />
      <div className="main-menu__content">
        <div className="main-menu__panel">
          <div className="main-menu__status">
            <i />
            NIGHT SHIFT AVAILABLE
            {freePlayRemainingMs !== null && (
              <span>FREE ACCESS · {formatFreePlayTime(freePlayRemainingMs)}</span>
            )}
          </div>
          <p className="main-menu__eyebrow">HIGHWAY 09 · SIGNAL UNSTABLE</p>
          <h2><span>DOPPLE</span>GANGER</h2>
          <p className="main-menu__tagline">EVERY FACE IS A QUESTION.</p>
          <div className="main-menu__loadout">
            <span>MODE<strong>{settings.difficulty.toUpperCase()}</strong></span>
            <span>CLASS<strong>{PLAYER_CLASSES[economy.selectedClass].name}</strong></span>
            <span>WALLET<strong>{economyBusy ? 'SYNC…' : `${economy.coins} ◉`}</strong></span>
          </div>
          <div key={panel} className="main-menu__view">
            {panel === 'main' && (
              <div className="main-menu__actions">
                <button className="main-menu__start" type="button" onClick={onStart}>
                  <i aria-hidden="true">▶</i>
                  <span>START SHIFT<small>Clock in. Check every face. Survive until dawn.</small></span>
                  <kbd>01</kbd>
                </button>
                <div className="main-menu__action-grid">
                  <button type="button" onClick={() => setPanel('shop')}>
                    <i aria-hidden="true">▦</i>
                    <span>SUPPLY SHOP<small>{economy.medkits} medkits owned</small></span>
                    <kbd>02</kbd>
                  </button>
                  <button type="button" onClick={() => setPanel('classes')}>
                    <i aria-hidden="true">♟</i>
                    <span>CLASSES<small>Choose your loadout</small></span>
                    <kbd>03</kbd>
                  </button>
                  <button type="button" onClick={() => setPanel('settings')}>
                    <i aria-hidden="true">⚙</i>
                    <span>SETTINGS<small>Video and controls</small></span>
                    <kbd>04</kbd>
                  </button>
                  <button type="button" onClick={() => setPanel('howToPlay')}>
                    <i aria-hidden="true">?</i>
                    <span>HOW TO PLAY<small>Employee handbook</small></span>
                    <kbd>05</kbd>
                  </button>
                </div>
              </div>
            )}
            {panel === 'settings' && (
              <MainMenuSettings
                settings={settings}
                onChange={onSettingsChange}
                onBack={() => setPanel('main')}
              />
            )}
            {panel === 'shop' && (
              <MainMenuShop
                economy={economy}
                busy={economyBusy}
                onBuyMedkit={onBuyMedkit}
                onBack={() => setPanel('main')}
              />
            )}
            {panel === 'classes' && (
              <MainMenuClasses
                economy={economy}
                busy={economyBusy}
                onBuy={onBuyClass}
                onSelect={onSelectClass}
                onBack={() => setPanel('main')}
              />
            )}
            {panel === 'howToPlay' && <HowToPlayMenu onBack={() => setPanel('main')} />}
          </div>
          <footer>
            <span>V.09 · EMPLOYEE TERMINAL</span>
            <span>HEADPHONES RECOMMENDED</span>
          </footer>
        </div>
      </div>
    </section>
  );
}
