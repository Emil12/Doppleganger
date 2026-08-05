import { Link } from 'wouter';
import { type GameEconomy } from '../lib/gameEconomy';
import './MainMenuShop.css';

type MainMenuShopProps = {
  economy: GameEconomy;
  busy: boolean;
  onBuyMedkit: () => void;
  onBuyGrenade: () => void;
  onBuyMolotov: () => void;
  onBack: () => void;
};

export function MainMenuShop({
  economy,
  busy,
  onBuyMedkit,
  onBuyGrenade,
  onBuyMolotov,
  onBack,
}: MainMenuShopProps) {
  return (
    <div className="menu-shop">
      <header>
        <span>SUPPLY LOCKER</span>
        <strong>◉ {economy.coins} COINS</strong>
      </header>
      {economy.signedIn ? (
        <div className="menu-shop__items">
          <article>
            <div className="menu-shop__medkit" aria-hidden="true">+</div>
            <div>
              <strong>PORTABLE MEDKIT</strong>
              <small>Press H to heal fully (50 HP in Nightmare mode).</small>
              <span>OWNED · {economy.medkits}</span>
            </div>
            <button type="button" disabled={busy || economy.coins < 5} onClick={onBuyMedkit}>
              {economy.coins < 5 ? 'NEED 5 COINS' : 'BUY · 5 COINS'}
            </button>
          </article>
          <article>
            <div className="menu-shop__molotov" aria-hidden="true">♨</div>
            <div>
              <strong>MOLOTOV</strong>
              <small>Press Y to throw. Burns the impact area.</small>
              <span>OWNED · {economy.molotovs}</span>
            </div>
            <button type="button" disabled={busy || economy.coins < 5} onClick={onBuyMolotov}>
              {economy.coins < 5 ? 'NEED 5 COINS' : 'BUY · 5 COINS'}
            </button>
          </article>
          <article>
            <div className="menu-shop__grenade" aria-hidden="true">●</div>
            <div>
              <strong>FRAGMENTATION GRENADE</strong>
              <small>Press G to throw. Explodes after a short fuse.</small>
              <span>OWNED · {economy.grenades}</span>
            </div>
            <button type="button" disabled={busy || economy.coins < 10} onClick={onBuyGrenade}>
              {economy.coins < 10 ? 'NEED 10 COINS' : 'BUY · 10 COINS'}
            </button>
          </article>
        </div>
      ) : (
        <div className="menu-shop__signin">
          <strong>ACCOUNT REQUIRED</strong>
          <small>Sign in to save coins and supplies.</small>
          <Link href="/auth">SIGN IN</Link>
        </div>
      )}
      <button type="button" onClick={onBack}>BACK</button>
    </div>
  );
}
