import React from 'react';

// Mirrors the logic in server/services/creatureService.js so the UI stays in sync.
function getEggState(reading) {
  if (!reading) {
    return { state: 'Unknown', description: 'Awaiting sensor data...', emoji: '🥚' };
  }

  const { light, temperature, humidity } = reading;

  if (light < 200) {
    return { state: 'Shadow', description: 'The egg pulses in the darkness. Something stealthy stirs within.', emoji: '🌑' };
  }
  if (temperature > 30) {
    return { state: 'Ember', description: 'The egg radiates heat. A fierce creature is forming inside.', emoji: '🔥' };
  }
  if (humidity > 70) {
    return { state: 'Aquatic', description: 'The egg glistens with moisture. A water creature is incubating.', emoji: '💧' };
  }
  if (light > 800) {
    return { state: 'Solar', description: 'The egg blazes with captured sunlight. A radiant creature awaits.', emoji: '☀️' };
  }
  if (light > 600) {
    return { state: 'Bloom', description: 'The egg hums with gentle light. A nature creature is blooming.', emoji: '🌸' };
  }
  if (light < 400) {
    return { state: 'Moon', description: 'The egg glows with a soft silver hue. A lunar creature dreams inside.', emoji: '🌙' };
  }
  return { state: 'Nature', description: 'The egg sits in balanced harmony. A versatile creature is growing.', emoji: '🌿' };
}

function EggPanel({ reading, isHatching }) {
  const eggInfo = getEggState(reading);

  return (
    <div className={`panel egg-panel egg-state-${eggInfo.state.toLowerCase()}`}>
      <h2 className="panel-title">🥚 Egg Condition</h2>
      <div className="egg-display">
        {/* When hatching, swap the normal emoji for a shaking one */}
        <span className={`egg-emoji ${isHatching ? 'egg-shaking' : ''}`}>
          {isHatching ? '🥚' : eggInfo.emoji}
        </span>

        {isHatching ? (
          // Hatching state — show pulsing message instead of normal info
          <>
            <h3 className="egg-state-name hatching-title">Hatching...</h3>
            <p className="egg-description">The egg is cracking open. Something is emerging...</p>
          </>
        ) : (
          // Normal state
          <>
            <h3 className="egg-state-name">{eggInfo.state} Egg</h3>
            <p className="egg-description">{eggInfo.description}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default EggPanel;
