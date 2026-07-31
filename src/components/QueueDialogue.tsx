import { type QueueDialogue as QueueDialogueState } from '../lib/customerDialogue';
import './QueueDialogue.css';

type QueueDialogueProps = {
  dialogue: QueueDialogueState;
};

export function QueueDialogue({ dialogue }: QueueDialogueProps) {
  return (
    <div className={`queue-dialogue ${dialogue.anomaly ? 'queue-dialogue--anomaly' : ''}`}>
      <span>{dialogue.anomaly ? 'CUSTOMER?' : 'CUSTOMER'}</span>
      <p>“{dialogue.text}”</p>
    </div>
  );
}
