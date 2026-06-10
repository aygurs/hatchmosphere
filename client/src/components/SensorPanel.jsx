import React from 'react';

function lightLabel(light) {
  if (light === null || light === undefined) return '—';
  if (light < 200) return `${light} — Very Dark`;
  if (light < 400) return `${light} — Dim`;
  if (light < 600) return `${light} — Moderate`;
  if (light < 800) return `${light} — Bright`;
  return `${light} — Intense`;
}

function SensorPanel({ reading }) {
  return (
    <div className="panel sensor-panel">
      <h2 className="panel-title">📡 Sensor Readings</h2>
      {reading ? (
        <ul className="sensor-list">
          <li>
            <span className="sensor-label">Light</span>
            <span className="sensor-value">{lightLabel(reading.light)}</span>
          </li>
          <li>
            <span className="sensor-label">Temperature</span>
            <span className="sensor-value">{reading.temperature}°C</span>
          </li>
          <li>
            <span className="sensor-label">Humidity</span>
            <span className="sensor-value">{reading.humidity}%</span>
          </li>
          <li>
            <span className="sensor-label">Interactions</span>
            <span className="sensor-value">{reading.interactionCount}</span>
          </li>
          <li className="sensor-timestamp">
            Last updated: {new Date(reading.timestamp).toLocaleTimeString()}
          </li>
        </ul>
      ) : (
        <p className="loading-text">Connecting to device...</p>
      )}
    </div>
  );
}

export default SensorPanel;
