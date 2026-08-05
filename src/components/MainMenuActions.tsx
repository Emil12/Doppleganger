type MainMenuActionsProps = {
  difficulty: string;
  medkits: number;
  onClasses: () => void;
  onDailyRewards: () => void;
  onFriends: () => void;
  onHandbook: () => void;
  onMode: () => void;
  onMultiplayer: () => void;
  onSettings: () => void;
  onShop: () => void;
  onStart: () => void;
};

export function MainMenuActions(props: MainMenuActionsProps) {
  return (
    <div className="main-menu__actions">
      <button className="main-menu__start" type="button" onClick={props.onStart}>
        <i aria-hidden="true">▶</i>
        <span>START SHIFT<small>Clock in. Check every face. Survive until dawn.</small></span>
        <kbd>01</kbd>
      </button>
      <button className="main-menu__multiplayer" type="button" onClick={props.onMultiplayer}>
        <i aria-hidden="true">◉</i>
        <span>MULTIPLAYER<small>Create or join an online co-op room.</small></span>
        <kbd>02</kbd>
      </button>
      <div className="main-menu__action-grid">
        <button type="button" onClick={props.onShop}>
          <i aria-hidden="true">▦</i>
          <span>SUPPLY SHOP<small>{props.medkits} medkits owned</small></span><kbd>03</kbd>
        </button>
        <button type="button" onClick={props.onClasses}>
          <i aria-hidden="true">♟</i><span>CLASSES<small>Choose your loadout</small></span><kbd>04</kbd>
        </button>
        <button type="button" onClick={props.onMode}>
          <i aria-hidden="true">◆</i><span>MODE<small>{props.difficulty}</small></span><kbd>05</kbd>
        </button>
        <button type="button" onClick={props.onFriends}>
          <i aria-hidden="true">+</i><span>FRIENDS<small>Search and add players</small></span><kbd>06</kbd>
        </button>
        <button type="button" onClick={props.onDailyRewards}>
          <i aria-hidden="true">★</i><span>DAILY REWARDS<small>60 days of coin bonuses</small></span><kbd>07</kbd>
        </button>
        <button type="button" onClick={props.onSettings}>
          <i aria-hidden="true">⚙</i><span>SETTINGS<small>Video and controls</small></span><kbd>08</kbd>
        </button>
        <button type="button" onClick={props.onHandbook}>
          <i aria-hidden="true">?</i><span>HOW TO PLAY<small>Employee handbook</small></span><kbd>09</kbd>
        </button>
      </div>
    </div>
  );
}
