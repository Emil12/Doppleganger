import { type RadioSelection } from '../lib/counterRadioAudio';
import './RadioNowPlaying.css';

type RadioNowPlayingProps = {
  selection: RadioSelection;
};

export function RadioNowPlaying({ selection }: RadioNowPlayingProps) {
  return (
    <aside className="radio-now-playing" aria-live="polite">
      <span className="radio-now-playing__signal" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>
        <small>80s BOOMBOX · MEME TAPE</small>
        <strong>{selection.title}</strong>
      </span>
      <b>
        {String(selection.index + 1).padStart(2, '0')}
        <em>/</em>
        {selection.total}
      </b>
    </aside>
  );
}
