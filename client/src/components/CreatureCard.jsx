import React from 'react';

const rarityColors = {
  Common: '#aaaaaa',
  Uncommon: '#4caf50',
  Rare: '#2196f3',
  'Ultra Rare': '#9c27b0',
  Legendary: '#ff9800',
};

function CreatureCard({ creature }) {
  if (!creature) return null;

  const rarityColor = rarityColors[creature.rarity] || '#aaaaaa';

  return (
    <div className="panel creature-card">
      <h2 className="panel-title">✨ Your Creature</h2>

      <div className="creature-header">
        <h3 className="creature-name">{creature.name}</h3>
        <span className="creature-rarity" style={{ color: rarityColor }}>
          ★ {creature.rarity}
        </span>
      </div>

      <div className="creature-type-badge" style={{ borderColor: rarityColor }}>
        {creature.type} Type
      </div>

      <div className="creature-details">
        <div className="detail-row">
          <span className="detail-label">Personality</span>
          <span className="detail-value">{creature.personality}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Habitat</span>
          <span className="detail-value">{creature.habitat}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Ability</span>
          <span className="detail-value ability">{creature.ability}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Evolution Hint</span>
          <span className="detail-value evolution-hint">{creature.evolutionHint}</span>
        </div>
      </div>

      <div className="hatching-reason">
        <p>{creature.hatchingReason}</p>
      </div>

      <div className="hatch-time">
        Hatched at: {new Date(creature.hatchedAt).toLocaleTimeString()}
      </div>
    </div>
  );
}

export default CreatureCard;
