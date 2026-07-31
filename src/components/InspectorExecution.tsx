import './InspectorExecution.css';

export function InspectorExecution() {
  return (
    <div className="inspector-execution" aria-hidden="true">
      <div className="inspector-execution__face">
        <i /><i /><i /><i /><i />
        <span className="inspector-execution__mouth" />
      </div>
      <p>INSPECTION IN PROGRESS</p>
      <small>DO NOT LOOK AWAY</small>
    </div>
  );
}
