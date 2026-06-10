import React, { useState, useEffect, useCallback } from 'react';
import SensorPanel from './components/SensorPanel.jsx';
import EggPanel from './components/EggPanel.jsx';
import HatchButton from './components/HatchButton.jsx';
import CreatureCard from './components/CreatureCard.jsx';
import SourcesPanel from './components/SourcesPanel.jsx';
import HatchHistory from './components/HatchHistory.jsx';
import { getLatestReading, hatchEgg, startHatch, getHatchedCreatures, setLED } from './services/api.js';

function App() {
  const [reading, setReading] = useState(null);
  const [creature, setCreature] = useState(null);
  const [hatchHistory, setHatchHistory] = useState([]);
  const [isHatching, setIsHatching] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the hatch history once on mount
  useEffect(() => {
    getHatchedCreatures().then(setHatchHistory).catch(() => {});
  }, []);

  // Poll the latest sensor reading from the server every 2 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const data = await getLatestReading();
        setReading(data);
        setError(null);
      } catch {
        setError('Could not connect to server. Is it running on port 3000?');
      }
    };

    poll(); // fire immediately on mount
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleHatch = useCallback(async () => {
    setIsHatching(true);
    setCreature(null);

    // Snapshot the sensor reading right away so the creature is based on the conditions at the moment of clicking
    const readingAtClick = reading;

    try {
      // 1. Tell the server to flash the LED right away
      await startHatch();

      // 2. Wait 3 seconds so the shaking egg animation plays
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 3. Generate the creature using the snapshotted reading
      const result = await hatchEgg(readingAtClick);
      setCreature(result.creature);
      // Add the new creature to the top of the local history list
      setHatchHistory((prev) => [result.creature, ...prev]);
      setError(null);
    } catch {
      setError('Hatching failed. Please try again.');
    } finally {
      setIsHatching(false);
    }
  }, [reading]);

  const handleSelectHistoryCreature = async (historyCreature) => {
    try {
      // Show the creature
      setCreature(historyCreature);
      // Update the LED to this creature's colour and effect
      await setLED(historyCreature.r, historyCreature.g, historyCreature.b, historyCreature.ledEffect, historyCreature.name);
      setError(null);
    } catch {
      setError('Failed to select creature. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🥚Hatchmosphere</h1>
        <p className="app-tagline">Where your environment decides what hatches.</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main className="app-main">
        <section className="left-panel">
          <SensorPanel reading={reading} />
          <EggPanel reading={reading} isHatching={isHatching} />
          <HatchButton onHatch={handleHatch} isHatching={isHatching} />
        </section>

        <section className="right-panel">
          {creature ? (
            <>
              <CreatureCard creature={creature} />
              <SourcesPanel sources={creature.sourcesUsed} />
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">&#127761;</span>
              <p>Hatch an egg to discover your creature.</p>
            </div>
          )}
          <HatchHistory creatures={hatchHistory} onCreatureClick={handleSelectHistoryCreature} />
        </section>
      </main>
    </div>
  );
}

export default App;
