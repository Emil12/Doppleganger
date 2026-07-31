import './Jumpscare.css';
import './JumpscareAnimations.css';

export type JumpscareKind = 'maw' | 'stare' | 'static' | 'void';

type JumpscareProps = {
  kind: JumpscareKind;
};

export function Jumpscare({ kind }: JumpscareProps) {
  return (
    <div className={`jumpscare jumpscare--${kind}`} aria-hidden="true">
      <div className="jumpscare__noise" />
      <div className="jumpscare__warning">DON&apos;T BLINK</div>
      <div className="jumpscare__afterimage jumpscare__afterimage--left" />
      <div className="jumpscare__afterimage jumpscare__afterimage--right" />
      <div className="jumpscare__face">
        <div className="jumpscare__eyes">
          <span />
          <span />
        </div>
        <div className="jumpscare__mouth">
          {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
        </div>
      </div>
      <strong>
        {kind === 'stare'
          ? 'IT SAW YOU'
          : kind === 'static'
            ? 'WRONG CHOICE'
            : kind === 'void' ? 'BEHIND YOU' : 'RUN'}
      </strong>
    </div>
  );
}
