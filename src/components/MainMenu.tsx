import { type PointerEvent, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { type GameEconomy } from '../lib/gameEconomy';
import { type GameSettings } from '../lib/gameSettings';
import { formatFreePlayTime } from '../lib/freePlayTrial';
import { PLAYER_CLASSES, type PlayerClassKind } from '../lib/playerClasses';
import { HowToPlayMenu } from './HowToPlayMenu';
import { MainMenuBackdrop } from './MainMenuBackdrop';
import { MainMenuActions } from './MainMenuActions';
import { MainMenuClasses } from './MainMenuClasses';
import { MainMenuDailyRewards } from './MainMenuDailyRewards';
import { MainMenuFriends } from './MainMenuFriends';
import { MainMenuMode } from './MainMenuMode';
import { MainMenuProfile } from './MainMenuProfile';
import { MainMenuEffects } from './MainMenuEffects';
import { MainMenuSettings } from './MainMenuSettings';
import { MainMenuShop } from './MainMenuShop';
import './MainMenu.css';
import './MainMenuControls.css';
import './MainMenuInterface.css';
import './MainMenuSocial.css';

type MainMenuProps = {
  settings: GameSettings;
  economy: GameEconomy;
  economyBusy: boolean;
  onSettingsChange: (settings: GameSettings) => void;
  onBuyMedkit: () => void;
  onBuyGrenade: () => void;
  onBuyMolotov: () => void;
  onBuyClass: (playerClass: PlayerClassKind) => void;
  onSelectClass: (playerClass: PlayerClassKind) => void;
  onNicknameChange: (displayName: string) => Promise<boolean>;
  onClaimDailyReward: () => Promise<boolean>;
  onStart: () => void;
  freePlayRemainingMs: number | null;
};

type MenuPanel = 'main' | 'settings' | 'shop' | 'classes' | 'mode' | 'friends' | 'howToPlay' | 'dailyRewards';

export function MainMenu({
  settings,
  economy,
  economyBusy,
  onSettingsChange,
  onBuyMedkit,
  onBuyGrenade,
  onBuyMolotov,
  onBuyClass,
  onSelectClass,
  onNicknameChange,
  onClaimDailyReward,
  onStart,
  freePlayRemainingMs,
}: MainMenuProps) {
  const [panel, setPanel] = useState<MenuPanel>('main');
  const [, navigate] = useLocation();
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
          <div className="main-menu__title-row">
            <h2><span>DOPPLE</span>GANGER</h2>
            <MainMenuProfile
              displayName={economy.displayName}
              signedIn={economy.signedIn}
              busy={economyBusy}
              onSave={onNicknameChange}
              onSignIn={() => navigate('/auth')}
            />
          </div>
          <p className="main-menu__tagline">EVERY FACE IS A QUESTION.</p>
          <div className="main-menu__loadout">
            <span>MODE<strong>{settings.difficulty.toUpperCase()}</strong></span>
            <span>CLASS<strong>{PLAYER_CLASSES[economy.selectedClass].name}</strong></span>
            <span>WALLET<strong>{economyBusy ? 'SYNC…' : `${economy.coins} ◉`}</strong></span>
          </div>
          <div key={panel} className="main-menu__view">
            {panel === 'main' && (
              <MainMenuActions
                difficulty={settings.difficulty.toUpperCase()}
                medkits={economy.medkits}
                onStart={onStart}
                onMultiplayer={() => navigate('/multiplayer')}
                onShop={() => setPanel('shop')}
                onClasses={() => setPanel('classes')}
                onMode={() => setPanel('mode')}
                onFriends={() => setPanel('friends')}
                onSettings={() => setPanel('settings')}
                onHandbook={() => setPanel('howToPlay')}
                onDailyRewards={() => setPanel('dailyRewards')}
              />
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
                onBuyGrenade={onBuyGrenade}
                onBuyMolotov={onBuyMolotov}
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
            {panel === 'mode' && (
              <MainMenuMode
                settings={settings}
                onChange={onSettingsChange}
                onBack={() => setPanel('main')}
              />
            )}
            {panel === 'friends' && (
              <MainMenuFriends
                signedIn={economy.signedIn}
                onBack={() => setPanel('main')}
              />
            )}
            {panel === 'howToPlay' && <HowToPlayMenu onBack={() => setPanel('main')} />}
            {panel === 'dailyRewards' && (
              <MainMenuDailyRewards
                signedIn={economy.signedIn}
                busy={economyBusy}
                hasPoliceman={economy.ownedClasses.includes('policeman')}
                onClaim={onClaimDailyReward}
                onBack={() => setPanel('main')}
              />
            )}
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
