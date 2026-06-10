// API service — all calls to the Hatchmosphere backend go through here.
// The Vite dev server proxies /api to http://localhost:3000/api.

const BASE_URL = '/api';

/**
 * Fetch the latest sensor reading from the server.
 * @returns {Promise<{ light: number, temperature: number, humidity: number, interactionCount: number, timestamp: string }>}
 */
export async function getLatestReading() {
  const res = await fetch(`${BASE_URL}/latest-reading`);
  if (!res.ok) throw new Error('Failed to fetch latest reading');
  return res.json();
}

/**
 * Signal the server to start flashing the LED while the egg hatches.
 * Call this before the 3-second delay so the physical device reacts immediately.
 * @returns {Promise<{ success: boolean }>}
 */
export async function startHatch() {
  const res = await fetch(`${BASE_URL}/hatch-start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to start hatch');
  return res.json();
}

/**
 * Trigger the egg hatch and receive a generated creature.
 * @param {object} reading - The sensor reading snapshotted at the moment the user clicked.
 * @returns {Promise<{ success: boolean, creature: object }>}
 */
export async function hatchEgg(reading) {
  const res = await fetch(`${BASE_URL}/hatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reading }),
  });
  if (!res.ok) throw new Error('Failed to hatch egg');
  return res.json();
}

/**
 * Fetch all creatures hatched this session, newest first.
 * @returns {Promise<Array>}
 */
export async function getHatchedCreatures() {
  const res = await fetch(`${BASE_URL}/hatched`);
  if (!res.ok) throw new Error('Failed to fetch hatched creatures');
  return res.json();
}

/**
 * Update the LED to show a specific creature's colour and effect.
 * Called when user clicks on a creature in the history.
 * @param {number} ledR - Red component (0-255)
 * @param {number} ledG - Green component (0-255)
 * @param {number} ledB - Blue component (0-255)
 * @param {string} ledEffect - Effect type (solid, flash, etc)
 * @param {string} name - Creature name for the LED message
 * @returns {Promise<{ success: boolean }>}
 */
export async function setLED(ledR, ledG, ledB, ledEffect, name) {
  const res = await fetch(`${BASE_URL}/set-led`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ledR, ledG, ledB, ledEffect, name }),
  });
  if (!res.ok) throw new Error('Failed to set LED');
  return res.json();
}
