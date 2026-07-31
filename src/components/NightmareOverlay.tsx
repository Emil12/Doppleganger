import './NightmareOverlay.css';

type NightmareOverlayProps = {
  bloodEnabled: boolean;
};

export function NightmareOverlay({ bloodEnabled }: NightmareOverlayProps) {
  return (
    <div
      className={`nightmare-overlay ${bloodEnabled ? '' : 'nightmare-overlay--no-blood'}`}
      aria-hidden="true"
    >
      {bloodEnabled && <div className="nightmare-overlay__blood" />}
      <span>SHIFT 05 // FIVE MINUTES REMAIN</span>
    </div>
  );
}
