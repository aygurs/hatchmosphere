import React from 'react';

function HatchButton({ onHatch, isHatching }) {
  return (
    <div className="panel hatch-panel">
      <button
        className={`hatch-button ${isHatching ? 'hatching' : ''}`}
        onClick={onHatch}
        disabled={isHatching}
      >
        {isHatching ? '🌀 Hatching...' : '🐣 Hatch Egg'}
      </button>
      {isHatching && (
        <p className="hatching-message">
          The egg is cracking... reading the environment...
        </p>
      )}
    </div>
  );
}

export default HatchButton;
