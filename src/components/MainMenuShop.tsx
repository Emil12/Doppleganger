import { Link } from 'wouter';
import { type GameEconomy } from '../lib/gameEconomy';
import './MainMenuShop.css';

type MainMenuShopProps = {
  economy: GameEconomy;
  busy: boolean;
  onBuyMedkit: () => void;
  onBack: () => void;
};

export function MainMenuShop({
  economy,
  busy,
  onBuyMedkit,
  onBack,
}: MainMenuShopProps) {
  return (
    <div className="menu-shop">
      <header>
        <span>SUPPLY LOCKER</span>
        <strong>◉ {economy.coins} COINS</strong>
      </header>
      {economy.signedIn ? (
        <article>
          <div className="menu-shop__medkit" aria-hidden="true">+</div>
          <div>
            <strong>PORTABLE MEDKIT</strong>
            <small>Press H during a shift to restore full health.</small>
            <span>OWNED · {economy.medkits}</span>
          </div>
          <button
            type="button"
            disabled={busy || economy.coins < 5}
            onClick={onBuyMedkit}
          >
            {economy.coins < 5 ? 'NEED 5 COINS' : 'BUY · 5 COINS'}
          </button>
        </article>
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
