// Shared in-memory state for the Hatchmosphere server.
// Both route files import this module so they share the same object reference.

const state = {
  // The latest sensor reading received from the ESP8266
  latestReading: {
    light: 512,
    temperature: 22.0,
    humidity: 55.0,
    interactionCount: 0,
    timestamp: new Date().toISOString(),
  },

  // The current LED command that the ESP8266 should apply
  deviceCommand: {
    ledColor: '#ffffff',
    ledEffect: 'solid',
    message: 'Waiting to hatch...',
  },

  // All creatures hatched this session, newest first.
  // Resets when the server restarts.
  hatchedCreatures: [],
};

module.exports = state;
