const express = require('express');
const router = express.Router();
const state = require('../state');
const creatureService = require('../services/creatureService');

// POST /api/hatch-start
// Called the moment the user clicks "Hatch Egg".
// Immediately makes the LED flash white so the physical device reacts
// while the frontend plays its hatching animation.
router.post('/hatch-start', (req, res) => {
  state.deviceCommand = {
    ledR: 255,
    ledG: 255,
    ledB: 255,
    ledEffect: 'flash',
    message: 'Hatching...',
  };
  res.json({ success: true });
});

// POST /api/hatch
// Triggered when the user clicks "Hatch Egg" in the web app.
// Reads the current sensor state, generates a creature, and updates the device command.
router.post('/hatch', async (req, res) => {
  try {
    // Use the reading snapshotted at click time if the client sent one.
    // Fall back to the latest server-side reading if not.
    const reading = req.body.reading || state.latestReading;

    // Generate a creature based on the current sensor reading
    const creature = await creatureService.generateCreature(reading);

    // Tell the ESP8266 which LED colour and effect to show for this creature
    state.deviceCommand = {
      ledR: creature.r,
      ledG: creature.g,
      ledB: creature.b,
      ledEffect: creature.ledEffect,
      message: `Hatched: ${creature.name}`,
    };

    console.log(`Hatched: ${creature.name} (${creature.type} / ${creature.rarity})`);

    // Save to the session history (newest first) with a timestamp
    creature.hatchedAt = new Date().toISOString();
    state.hatchedCreatures.unshift(creature);

    res.json({ success: true, creature });
  } catch (err) {
    console.error('Hatch error:', err);
    res.status(500).json({ error: 'Failed to hatch creature' });
  }
});

// GET /api/hatched
// Returns all creatures hatched this session, newest first.
router.get('/hatched', (req, res) => {
  res.json(state.hatchedCreatures);
});

// POST /api/set-led
// Update the LED to match a creature's colour and effect.
// Called when user clicks a creature in the history.
router.post('/set-led', (req, res) => {
  try {
    const { ledR, ledG, ledB, ledEffect, name } = req.body;
    if (ledR === undefined || ledG === undefined || ledB === undefined || !ledEffect) {
      return res.status(400).json({ error: 'Missing ledR, ledG, ledB, or ledEffect' });
    }
    state.deviceCommand = {
      ledR,
      ledG,
      ledB,
      ledEffect,
      message: `Viewing: ${name}`,
    };
    res.json({ success: true });
  } catch (err) {
    console.error('Set LED error:', err);
    res.status(500).json({ error: 'Failed to set LED' });
  }
});

module.exports = router;
