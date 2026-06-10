const express = require('express');
const router = express.Router();
const state = require('../state');

// POST /api/device-reading
// The ESP8266 calls this endpoint every second with its latest sensor values.
router.post('/device-reading', (req, res) => {
  const { light, temperature, humidity, interactionCount } = req.body;

  // Require at least one sensor value
  if (
    light === undefined &&
    temperature === undefined &&
    humidity === undefined
  ) {
    return res.status(400).json({ error: 'No sensor data provided' });
  }

  // Merge new values into shared state, keeping old values for missing fields
  state.latestReading = {
    light: light ?? state.latestReading.light,
    temperature: temperature ?? state.latestReading.temperature,
    humidity: humidity ?? state.latestReading.humidity,
    interactionCount: interactionCount ?? state.latestReading.interactionCount,
    timestamp: new Date().toISOString(),
  };

  console.log('Received reading:', state.latestReading);

  // Return only the LED command — the firmware doesn't need the full reading echoed back.
  res.json({ success: true, command: state.deviceCommand });
});

// GET /api/latest-reading
// The React frontend polls this every 2 seconds to show live sensor data.
router.get('/latest-reading', (req, res) => {
  res.json(state.latestReading);
});

// GET /api/device-command
// The ESP8266 polls this to know what LED colour and effect to display.
router.get('/device-command', (req, res) => {
  res.json(state.deviceCommand);
});

module.exports = router;
