import { useState } from 'react';
import './FirstShiftTutorial.css';

type FirstShiftTutorialProps = {
  onComplete: () => void;
};

const pages = [
  {
    label: '01 · MOVEMENT',
    title: 'GET BEHIND THE COUNTER',
    text: 'Move through the station, look around, and learn where the restroom and exits are.',
    tips: ['WASD · MOVE', 'MOUSE · LOOK', 'SHIFT · SPRINT', 'SPACE · JUMP', 'C · CROUCH'],
  },
  {
    label: '02 · YOUR JOB',
    title: 'CHECK EVERY FACE',
    text: 'Customers show identification at the counter. Make the right decision before the queue grows.',
    tips: ['E · ACCEPT A HUMAN', 'F · REFUSE A SUSPICIOUS ID', 'E · CLEAN A MESS'],
  },
  {
    label: '03 · SURVIVAL',
    title: 'BE READY TO DEFEND YOURSELF',
    text: 'Shoot confirmed anomalies before they reach you. Hide in the restroom when you need cover.',
    tips: ['LMB · SHOOT', 'RMB · AIM', 'R · RELOAD', '1 / 2 · WEAPON SLOTS', 'H · MEDKIT'],
  },
  {
    label: '04 · WARNING',
    title: 'WHAT NOT TO DO',
    text: 'Bad decisions have consequences. Keep your judgement hearts and your health intact.',
    tips: [
      'DO NOT SHOOT INNOCENT CUSTOMERS',
      'DO NOT BREAK GLASS · −1 JUDGEMENT',
      'DO NOT SHOOT FUEL PUMPS · THEY EXPLODE',
      'DO NOT LET ANOMALIES REACH YOU',
    ],
  },
] as const;

export function FirstShiftTutorial({ onComplete }: FirstShiftTutorialProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const page = pages[pageIndex];
  const lastPage = pageIndex === pages.length - 1;

  return (
    <section className="first-shift-tutorial" role="dialog" aria-modal="true">
      <div className="first-shift-tutorial__card">
        <header>
          <span>EMPLOYEE ORIENTATION</span>
          <b>{page.label}</b>
        </header>
        <div className="first-shift-tutorial__progress" aria-hidden="true">
          {pages.map((item, index) => (
            <i key={item.label} className={index <= pageIndex ? 'is-complete' : ''} />
          ))}
        </div>
        <h2>{page.title}</h2>
        <p>{page.text}</p>
        <div className={`first-shift-tutorial__tips ${lastPage ? 'is-warning' : ''}`}>
          {page.tips.map((tip) => <span key={tip}>{tip}</span>)}
        </div>
        <footer>
          <button type="button" disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)}>
            BACK
          </button>
          <button className="is-skip" type="button" onClick={onComplete}>
            SKIP TUTORIAL
          </button>
          <button
            className="is-primary"
            type="button"
            onClick={() => lastPage ? onComplete() : setPageIndex(pageIndex + 1)}
          >
            {lastPage ? 'START SHIFT' : 'NEXT'}
          </button>
        </footer>
      </div>
    </section>
  );
}
