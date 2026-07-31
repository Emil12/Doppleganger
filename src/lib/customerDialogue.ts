import { type Customer } from './customerTypes';

export type QueueDialogue = {
  text: string;
  anomaly: boolean;
};

const CUSTOMER_LINES = [
  'Do you always move this slowly?',
  'This store looks like it gave up years ago.',
  'I have seen vending machines with better service.',
  'Try smiling. Actually, never mind.',
  'Is this line part of the punishment?',
  'Even the freezer works harder than you.',
  'I should have stopped at the next station.',
];

const ANOMALY_LINES = [
  'Your heartbeat is louder than the freezer.',
  'You keep staring as if that will save you.',
  'Your replacement would work faster.',
  'I can smell your fear from here.',
  'You would look better standing very still.',
  'The lights will go out when I am ready.',
  'There is something waiting behind your eyes.',
];

export function createQueueDialogue(
  onDialogue: (dialogue: QueueDialogue) => void,
) {
  let nextDialogueAt = 0;

  const update = (queue: Customer[], time: number) => {
    if (queue.length === 0 || time < nextDialogueAt) return;
    const speaker = queue[Math.floor(Math.random() * queue.length)];
    const lines = speaker.model.isAnomaly ? ANOMALY_LINES : CUSTOMER_LINES;
    onDialogue({
      text: lines[Math.floor(Math.random() * lines.length)],
      anomaly: speaker.model.isAnomaly,
    });
    nextDialogueAt = time + 5_000 + Math.random() * 4_000;
  };

  const reset = () => {
    nextDialogueAt = 0;
  };

  return { update, reset };
}
