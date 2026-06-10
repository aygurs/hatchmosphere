// Fallback knowledge base for Hatchmosphere.
//
// These documents are indexed in Azure AI Search / Foundry IQ.
// This local copy serves as a fallback when Azure credentials are not configured
// or when a search request fails. See foundryIqService.js for the main retrieval logic.

const mockKnowledge = [
  {
    id: 'hatching-rules-01',
    source: 'hatching-rules.md',
    content:
      'Creatures that hatch in low-light environments tend to have stealth abilities and nocturnal habits. Shadow-type eggs require darkness to fully develop.',
  },
  {
    id: 'hatching-rules-02',
    source: 'hatching-rules.md',
    content:
      'High solar exposure during incubation produces Solar or Bloom-type creatures with radiant energy abilities. The longer the exposure, the more powerful the creature.',
  },
  {
    id: 'hatching-rules-03',
    source: 'hatching-rules.md',
    content:
      'Temperature extremes during incubation lock in elemental traits. Creatures incubated above 30°C almost always develop fire or heat-based abilities.',
  },
  {
    id: 'creature-types-01',
    source: 'creature-types.md',
    content:
      'Aquatic creatures emerge from high-humidity environments. They are calm, adaptable, and often have healing or water-manipulation abilities.',
  },
  {
    id: 'creature-types-02',
    source: 'creature-types.md',
    content:
      'Ember creatures are born of heat. They are fierce, loyal, and often have fire or heat-related abilities. Desert variants tend to be more solitary.',
  },
  {
    id: 'creature-types-03',
    source: 'creature-types.md',
    content:
      'Nature creatures are the most common and versatile. They thrive in balanced environments and can adapt to many different habitats.',
  },
  {
    id: 'creature-types-04',
    source: 'creature-types.md',
    content:
      'Moon creatures develop slowly in dim environments. They are introspective, strategic, and often have gravity or dream-related abilities.',
  },
  {
    id: 'creature-types-05',
    source: 'creature-types.md',
    content:
      'Creatures that experience high interaction counts during incubation develop social, curious personalities. They bond quickly with their caretakers.',
  },
  {
    id: 'biomes-01',
    source: 'biomes.md',
    content:
      'The Shadowfell Biome is a cold, dark realm where Shadow and Moon creatures originate. It is characterised by low light, high humidity, and dense fog.',
  },
  {
    id: 'biomes-02',
    source: 'biomes.md',
    content:
      'The Solar Expanse is a high-altitude biome with intense sunlight. Solar and Bloom creatures born here are energetic and fast-growing.',
  },
  {
    id: 'biomes-03',
    source: 'biomes.md',
    content:
      'The Ember Wastes is a volcanic biome with extreme temperatures. Only the hardiest Ember and Desert creatures survive there.',
  },
  {
    id: 'biomes-04',
    source: 'biomes.md',
    content:
      'The Mist Marshes are perpetually humid wetlands. Aquatic, Mist, and Moss creatures are most at home here.',
  },
  {
    id: 'biomes-05',
    source: 'biomes.md',
    content:
      'The Verdant Forest is a balanced biome with moderate climate. Nature creatures dominate here and coexist peacefully with most other types.',
  },
];

module.exports = mockKnowledge;
