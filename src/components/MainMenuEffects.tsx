import './MainMenuAtmosphere.css';
import './MainMenuPolish.css';
import './MainMenuThreat.css';

export function MainMenuEffects() {
  return (
    <div className="menu-effects" aria-hidden="true">
      <div className="menu-effects__searchlight" />
      <div className="menu-effects__cursor-light" />
      <div className="menu-effects__rain" />
      <div className="menu-effects__power-flash" />
      <div className="menu-effects__wet-road" />
      <div className="menu-effects__figure">
        <i />
      </div>
      <div className="menu-effects__ash">
        {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
      </div>
      <div className="menu-effects__vhs">
        <i />
        <i />
        <i />
      </div>
      <div className="menu-effects__frame">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="menu-effects__motion">⚠ MOTION DETECTED · SECTOR 4</div>
      <div className="menu-effects__camera">● CAM 04&nbsp;&nbsp; REC</div>
      <div className="menu-effects__coordinates">44°09&apos;N · HIGHWAY 09</div>
      <div className="menu-effects__ticker">
        <span>
          EMPLOYEE NOTICE&nbsp;&nbsp;•&nbsp;&nbsp;CHECK EVERY FACE&nbsp;&nbsp;•&nbsp;&nbsp;
          DO NOT LEAVE THE COUNTER&nbsp;&nbsp;•&nbsp;&nbsp;TRUST NO ONE&nbsp;&nbsp;•&nbsp;&nbsp;
        </span>
        <span>
          EMPLOYEE NOTICE&nbsp;&nbsp;•&nbsp;&nbsp;CHECK EVERY FACE&nbsp;&nbsp;•&nbsp;&nbsp;
          DO NOT LEAVE THE COUNTER&nbsp;&nbsp;•&nbsp;&nbsp;TRUST NO ONE&nbsp;&nbsp;•&nbsp;&nbsp;
        </span>
      </div>
    </div>
  );
}
