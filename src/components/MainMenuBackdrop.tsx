import './MainMenuBackdrop.css';

export function MainMenuBackdrop() {
  return (
    <div className="menu-backdrop" aria-hidden="true">
      <div className="menu-backdrop__moon" />
      <div className="menu-backdrop__station">
        <div className="menu-backdrop__canopy">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="menu-backdrop__store">
          <div className="menu-backdrop__windows">
            <span />
            <span />
            <span />
          </div>
          <b>OPEN</b>
        </div>
        <div className="menu-backdrop__pumps">
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="menu-backdrop__road" />
      <div className="menu-backdrop__fog menu-backdrop__fog--one" />
      <div className="menu-backdrop__fog menu-backdrop__fog--two" />
    </div>
  );
}
