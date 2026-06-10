import React from 'react';

// Rarity colours — matches CreatureCard
const rarityColors = {
  Common: '#aaaaaa',
  Uncommon: '#4caf50',
  Rare: '#2196f3',
  'Ultra Rare': '#9c27b0',
  Legendary: '#ff9800',
};

function HatchHistory({ creatures, onCreatureClick }) {
  if (!creatures || creatures.length === 0) {
    return null;
  }

  const handleClick = (creature) => {
    if (onCreatureClick) {
      onCreatureClick(creature);
    }
  };

  return (
    <div className="panel hatch-history">
      <h2 className="panel-title">📜 This Session ({creatures.length} hatched)</h2>
      <ul className="history-list">
        {creatures.map((creature, index) => (
          <li key={index} className="history-item" onClick={() => handleClick(creature)}>
            <span className="history-name" style={{ color: rarityColors[creature.rarity] || '#aaaaaa' }}>
              {creature.name}
            </span>
            <span className="history-type">{creature.type}</span>
            <span className="history-rarity" style={{ color: rarityColors[creature.rarity] || '#aaaaaa' }}>
              {creature.rarity}
            </span>
            <span className="history-time">
              {new Date(creature.hatchedAt).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HatchHistory;
