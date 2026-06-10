const foundryIq = require('./foundryIqService');

// ---------------------------------------------------------------
// Creature templates
// Each entry defines the traits for one creature type.
// The creature name, ability, and evolution hint are chosen randomly
// from the arrays to add variety between hatches.
// ---------------------------------------------------------------
const creatureTemplates = {
  Shadow: {
    type: 'Shadow',
    habitat: 'Shadowfell Biome — cold, lightless caves with no natural light',
    ledR: 75,
    ledG: 0,
    ledB: 130,
    ledEffect: 'flash',
    rarityOptions: ['Uncommon', 'Rare', 'Ultra Rare'],
    names: ['Umbrix', 'Noctara', 'Veilshroud', 'Dimspire', 'Eclipsian'],
    abilities: [
      'Shadow Step — instantly teleports to the nearest dark zone',
      'Void Cloak — becomes invisible in low light for up to 30 seconds',
      'Nightmare Veil — induces sleep in nearby creatures',
    ],
    evolutionHints: [
      'Expose to total darkness for 12 hours to evolve into Abyssian.',
      'Feed moonlight-infused crystals to unlock the Phantom form.',
    ],
  },
  Moon: {
    type: 'Moon',
    habitat: 'Lunar Highlands — silvery plateaus bathed in soft moonlight',
    ledR: 176,
    ledG: 196,
    ledB: 222,
    ledEffect: 'flash',
    rarityOptions: ['Common', 'Uncommon', 'Rare'],
    names: ['Lunaris', 'Crescenta', 'Moonwhisper', 'Silvael', 'Tidecaller'],
    abilities: [
      'Moonbeam — fires a beam of concentrated moonlight',
      'Tidal Pull — manipulates small objects with gravitational force',
      'Dream Weave — projects calming visions into nearby minds',
    ],
    evolutionHints: [
      'Wait for the next full moon to trigger the Selene evolution.',
      'Bond rating must reach 75% for the Celestial unlock.',
    ],
  },
  Solar: {
    type: 'Solar',
    habitat: 'Solar Expanse — high-altitude cliffs with unobstructed sunlight',
    ledR: 255,
    ledG: 215,
    ledB: 0,
    ledEffect: 'flash',
    rarityOptions: ['Rare', 'Ultra Rare', 'Legendary'],
    names: ['Solanthra', 'Radivex', 'Dawnspire', 'Lumiros', 'Heliovar'],
    abilities: [
      'Solar Flare — releases a burst of blinding energy',
      'Photon Charge — absorbs light to restore stamina',
      'Sunbeam Lance — a precise, high-accuracy beam attack',
    ],
    evolutionHints: [
      'Achieve 100% solar exposure for 3 days to evolve into Stellarion.',
      'A Solar Stone is required for the Celestial Ember evolution.',
    ],
  },
  Bloom: {
    type: 'Bloom',
    habitat: 'Sunlit Meadows — warm open fields with rich, fertile soil',
    ledR: 127,
    ledG: 252,
    ledB: 0,
    ledEffect: 'flash',
    rarityOptions: ['Common', 'Uncommon', 'Rare'],
    names: ['Florvex', 'Petalara', 'Bloomsprite', 'Verdania', 'Blossom'],
    abilities: [
      'Petal Storm — launches a flurry of razor-sharp petals',
      'Root Grasp — immobilises enemies with fast-growing roots',
      'Photosynthetic Heal — slowly regenerates health in sunlight',
    ],
    evolutionHints: [
      'Water daily and keep in sunlight to unlock the Arborian form.',
      'Feed rare pollen to evolve into the Ancient Grove variant.',
    ],
  },
  Aquatic: {
    type: 'Aquatic',
    habitat: 'Mist Marshes — deep wetlands with warm, misty waters',
    ledR: 0,
    ledG: 191,
    ledB: 255,
    ledEffect: 'flash',
    rarityOptions: ['Common', 'Uncommon', 'Rare'],
    names: ['Tidalix', 'Mistral', 'Wavecrest', 'Aquara', 'Coralith'],
    abilities: [
      'Tidal Wave — creates a powerful wave that pushes enemies back',
      'Hydro Shield — forms a defensive barrier of pressurised water',
      'Rain Call — summons a localised rain shower',
    ],
    evolutionHints: [
      'Keep humidity above 80% for 48 hours to trigger the Abyssal form.',
      'Bond with 3 other Aquatic creatures to unlock the Leviathan variant.',
    ],
  },
  Ember: {
    type: 'Ember',
    habitat: 'Ember Wastes — volcanic badlands with geothermal vents',
    ledR: 255,
    ledG: 69,
    ledB: 0,
    ledEffect: 'flash',
    rarityOptions: ['Uncommon', 'Rare', 'Ultra Rare'],
    names: ['Pyraxis', 'Scorchlord', 'Embrix', 'Lavarius', 'Cindris'],
    abilities: [
      'Ember Burst — launches a spread of burning embers',
      'Heat Aura — passively damages enemies standing too close',
      'Magma Skin — reduces physical damage by hardening its outer layer',
    ],
    evolutionHints: [
      'Raise temperature above 35°C for 6 hours to unlock the Inferno form.',
      'Combine with a Lava Crystal to evolve into Volcarius.',
    ],
  },
  Nature: {
    type: 'Nature',
    habitat: 'Verdant Forest — balanced ecosystems with a moderate climate',
    ledR: 34,
    ledG: 139,
    ledB: 34,
    ledEffect: 'solid',
    rarityOptions: ['Common', 'Uncommon', 'Rare'],
    names: ['Mossworth', 'Fernix', 'Grovekin', 'Wildara', 'Brambleclaw'],
    abilities: [
      'Vine Whip — a fast, flexible attack using conjured vines',
      'Camouflage — blends into natural environments to become undetectable',
      "Nature's Pulse — heals all nearby allies over time",
    ],
    evolutionHints: [
      'Spend 24 hours outdoors to unlock the Ancient Nature form.',
      'Achieve harmony with all biome types to access the World Tree variant.',
    ],
  },
};

// ---------------------------------------------------------------
// Determine which creature type fits the current sensor reading.
// Priority order: Shadow > Ember > Aquatic > Solar > Bloom > Moon > Nature
// ---------------------------------------------------------------
function determineCreatureType(reading) {
  const { light, temperature, humidity } = reading;

  if (light < 200) return 'Shadow';
  if (temperature > 30) return 'Ember';
  if (humidity > 70) return 'Aquatic';
  if (light > 800) return 'Solar';
  if (light > 600) return 'Bloom';
  if (light < 400) return 'Moon';
  return 'Nature';
}

// ---------------------------------------------------------------
// Determine rarity based on sensor extremeness and interactions.
// Calculate a rarity percentage (0-100), add randomness, then map to available tiers.
// ---------------------------------------------------------------
function determineRarity(reading, template) {
  const { light, temperature, humidity, interactionCount } = reading;
  
  let rarityScore = 0; // 0-100
  
  // Extreme light conditions
  if (light < 100 || light > 900) rarityScore += 25;
  
  // Extreme temperature
  if (temperature > 35 || temperature < 5) rarityScore += 25;
  
  // Extreme humidity
  if (humidity > 85 || humidity < 15) rarityScore += 25;
  
  // Interactions during incubation
  if (interactionCount > 10) rarityScore += 15;
  else if (interactionCount > 5) rarityScore += 8;
  
  // Add randomness (±12%)
  rarityScore += (Math.random() - 0.5) * 24;
  rarityScore = Math.max(0, Math.min(100, rarityScore)); // Clamp 0-100
  
  // Map score to available rarity tiers
  // Assumes rarityOptions are ordered from lowest to highest rarity
  const rarities = template.rarityOptions;
  
  if (rarityScore < 25) return rarities[0];
  if (rarityScore < 50) return rarities[Math.min(1, rarities.length - 1)];
  if (rarityScore < 75) return rarities[Math.min(2, rarities.length - 1)];
  return rarities[rarities.length - 1];
}

// ---------------------------------------------------------------
// Build a personality string.
// High interaction count during incubation makes creatures more social.
// ---------------------------------------------------------------
function determinePersonality(interactionCount, type) {
  const basePersonalities = {
    Shadow: 'mysterious and cautious',
    Moon: 'calm and introspective',
    Solar: 'energetic and bold',
    Bloom: 'nurturing and gentle',
    Aquatic: 'peaceful and fluid',
    Ember: 'fierce and passionate',
    Nature: 'curious and adaptable',
  };

  const base = basePersonalities[type] || 'curious';

  if (interactionCount > 50) {
    return `${base}, with an unusually social and playful side shaped by heavy interaction during incubation`;
  }
  if (interactionCount > 25) {
    return `${base}, and noticeably friendly thanks to regular interaction during incubation`;
  }
  return base;
}

// ---------------------------------------------------------------
// Build a short explanation of why the egg hatched this way.
// ---------------------------------------------------------------
function buildHatchingReason(reading, type) {
  const { light, temperature, humidity, interactionCount } = reading;
  const reasons = [];

  if (light < 200) {
    reasons.push(`very low light (${light}/1023) created shadow conditions`);
  } else if (light > 800) {
    reasons.push(`intense light (${light}/1023) triggered solar incubation`);
  } else if (light > 600) {
    reasons.push(`high ambient light (${light}/1023) promoted bloom growth`);
  } else if (light < 400) {
    reasons.push(`dim light (${light}/1023) encouraged moon-phase development`);
  }

  if (temperature > 30) reasons.push(`high temperature (${temperature}°C) ignited ember traits`);
  if (humidity > 70) reasons.push(`high humidity (${humidity}%) created aquatic conditions`);
  if (interactionCount > 5) reasons.push(`${interactionCount} interactions during incubation shaped its personality`);

  if (reasons.length === 0) {
    reasons.push('balanced environmental conditions produced a stable Nature creature');
  }

  return `This ${type} creature hatched because: ${reasons.join('; ')}.`;
}

// ---------------------------------------------------------------
// Determine LED effect based on rarity.
// Common/Uncommon: solid
// Rare and above: pulse (pulsating color)
// ---------------------------------------------------------------
function determineLedEffect(rarity) {
  const highRarities = ['Rare', 'Ultra Rare', 'Legendary', 'Mythic'];
  return highRarities.includes(rarity) ? 'pulse' : 'solid';
}

// ---------------------------------------------------------------
// Main export — generates a full creature from a sensor reading.
// ---------------------------------------------------------------
async function generateCreature(reading) {
  const type = determineCreatureType(reading);
  const template = creatureTemplates[type];

  // Retrieve relevant knowledge snippets via Foundry IQ / Azure AI Search
  const knowledgeSnippets = await foundryIq.retrieveKnowledge(reading, type);
  const sourcesUsed = foundryIq.extractSourceNames(knowledgeSnippets);

  // Determine rarity first (needed for LED effect)
  const rarity = determineRarity(reading, template);

  // Pick random name, ability, and evolution hint for variety
  const name = template.names[Math.floor(Math.random() * template.names.length)];
  const ability = template.abilities[Math.floor(Math.random() * template.abilities.length)];
  const evolutionHint = template.evolutionHints[Math.floor(Math.random() * template.evolutionHints.length)];

  return {
    name,
    type,
    rarity,
    personality: determinePersonality(reading.interactionCount, type),
    habitat: template.habitat,
    ability,
    evolutionHint,
    hatchingReason: buildHatchingReason(reading, type),
    sourcesUsed,
    // LED RGB values for device
    r: template.ledR,
    g: template.ledG,
    b: template.ledB,
    ledEffect: determineLedEffect(rarity),
    // Metadata
    hatchedAt: new Date().toISOString(),
    environmentSnapshot: { ...reading },
  };
}

module.exports = { generateCreature };
