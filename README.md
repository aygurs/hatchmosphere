# 🥚 Hatchmosphere

> **Where your environment decides what hatches.**

Hatchmosphere is a sensor-powered AI creature incubator. A physical ESP8266 device reads real-world environmental data - light level, temperature, humidity, and button interactions - and sends it to a Node.js/Express backend. A React/Vite web app displays the current egg conditions and lets you hatch an egg. When the egg hatches, the backend generates a unique creature profile based on the sensor readings, grounded in a knowledge layer.

---

## Architecture

```
[ESP8266 Device]
  LDR (Light)          ──┐
  DHT11/22 (Temp/Hum)  ──┼──> POST /api/device-reading ──> [Node.js Server]
  Push Button          ──┘                                        │
                                                       ┌──────────┴──────────┐
                                                       │   In-Memory State   │
                                                       │  (latest reading)   │
                                                       └──────────┬──────────┘
[React/Vite Frontend]                                             │
  SensorPanel   ──> GET /api/latest-reading (every 2s) ──────────┘
  EggPanel      ──> (derived from sensor values)
  HatchButton   ──> POST /api/hatch ──> creatureService.js
                                              │
                                    foundryIqService.js
                                    (Azure AI Search / Foundry IQ)
                                              │
                                    Returns creature + sources
                                              │
                    GET /api/device-command <── deviceCommand updated
                           │
                    [ESP8266 RGB LED]
```

---

## Project Structure

```
hatchmosphere/
  client/                       React/Vite web app
    src/
      App.jsx                   Root component, polling, hatch handler
      main.jsx                  React entry point
      components/
        EggPanel.jsx            Shows egg state based on sensor readings
        SensorPanel.jsx         Displays live sensor values
        CreatureCard.jsx        Creature profile card after hatch
        HatchButton.jsx         Triggers the hatch POST request
        SourcesPanel.jsx        Shows knowledge sources used
      services/
        api.js                  All fetch calls to the backend
      styles/
        App.css                 Dark magical/tech theme

  server/                       Node.js/Express backend
    index.js                    App entry point
    state.js                    Shared in-memory state module
    routes/
      device.js                 /api/device-reading, /api/latest-reading, /api/device-command
      hatch.js                  /api/hatch
    services/
      creatureService.js        Generates creatures from sensor data
      foundryIqService.js       Retrieves knowledge from Azure AI Search via Foundry IQ
    data/
      mockKnowledge.js          Fallback knowledge snippets (used if Azure not configured)
    docs/
      hatching-rules.md         Indexed knowledge documents
      creature-types.md
      biomes.md
      evolution-rules.md

  firmware/                     ESP8266 PlatformIO project
    platformio.ini              Board and library config
    src/
      main.cpp                  Sensor reading, Wi-Fi, HTTP POST/GET, LED TODO

  README.md
```

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [VS Code](https://code.visualstudio.com/) with the [PlatformIO extension](https://platformio.org/install/ide?install=vscode)

### 1. Server

```bash
cd server
npm install
npm run dev       # nodemon — auto-reloads on file changes
# or: npm start
```

Server starts on `http://localhost:3000`.

### 2. Client

```bash
cd client
npm install
npm run dev
```

Client starts on `http://localhost:5173`. The Vite dev proxy forwards all `/api` requests to the server automatically.

### 3. Firmware (ESP8266)

1. Open the `firmware/` folder in VS Code with PlatformIO installed.
2. Edit `firmware/src/main.cpp`:
   - Set `WIFI_SSID` and `WIFI_PASSWORD`.
   - Set `SERVER_IP` to your laptop's local IP address.
     - **Windows:** run `ipconfig` → look for *IPv4 Address*
     - **Mac/Linux:** run `ifconfig` or `ip addr`
3. Connect your ESP8266 via USB.
4. Click **Upload** in PlatformIO, or run `pio run --target upload` in a terminal.
5. Open the Serial Monitor (`pio device monitor`) to see live logs.

---

## API Reference

| Method | Endpoint                | Description                                       |
|--------|-------------------------|---------------------------------------------------|
| POST   | `/api/device-reading`   | ESP8266 sends latest sensor values                |
| GET    | `/api/latest-reading`   | Frontend polls current sensor reading             |
| POST   | `/api/hatch`            | Frontend triggers egg hatch; returns creature     |
| GET    | `/api/device-command`   | ESP8266 polls for LED colour/effect to display    |
| GET    | `/health`               | Server health check                               |

---

## Egg States

The egg type is derived from the current sensor reading in real time:

| Condition              | Egg State   | Emoji |
|------------------------|-------------|-------|
| Light < 200            | Shadow      | 🌑    |
| Temperature > 30°C     | Ember       | 🔥    |
| Humidity > 70%         | Aquatic     | 💧    |
| Light > 800            | Solar       | ☀️    |
| Light > 600            | Bloom       | 🌸    |
| Light 200–400          | Moon        | 🌙    |
| Balanced               | Nature      | 🌿    |

---

## Foundry IQ / Azure AI Search Integration

✅ **LIVE** — The knowledge layer is now integrated with Azure AI Search.

The knowledge layer lives in `server/services/foundryIqService.js`. It performs **semantic search** queries against Azure AI Search to retrieve relevant knowledge snippets based on creature type and sensor conditions. If Azure credentials are not configured, it gracefully falls back to local mock knowledge.

### Setup

1. Create an [Azure AI Search resource](https://portal.azure.com) (Free tier works for this)

2. Fill in `server/.env` with your Azure credentials:
   ```
   AZURE_SEARCH_ENDPOINT=https://your-service.search.windows.net
   AZURE_SEARCH_API_KEY=your-admin-api-key
   AZURE_SEARCH_INDEX_NAME=hatchmosphere-knowledge
   ```

3. Index the knowledge documents into Azure:
   ```bash
   node scripts/index-docs.js
   ```

### Knowledge Documents

Four markdown files are indexed and searchable:

| Document                | Contents                                           |
|-------------------------|----------------------------------------------------|
| `docs/hatching-rules.md`   | Rules for how environments influence creature types |
| `docs/creature-types.md`   | Traits, abilities, and habitats for each type      |
| `docs/biomes.md`           | Biome descriptions and creature origins            |
| `docs/evolution-rules.md`  | Evolution paths and rarity factors                 |

When a creature is hatched, `foundryIqService.js` queries the index with the creature type and returns the top 4 matching snippets to `creatureService.js`, which includes them in the creature's `sourcesUsed` field.

---

## GitHub Copilot Usage

This project was scaffolded with **GitHub Copilot** (Claude Sonnet 4.6).

Copilot assisted with:
- Generating the initial project structure and boilerplate
- Writing the creature generation logic in `creatureService.js`
- Designing the dark magical CSS theme for the React frontend
- Writing beginner-friendly, well-commented ESP8266 firmware

This allowed for fast prototyping and creation of an MVP within a couple of days - something which originally would have taken weeks.

---

## Hardware List

| Component                  | Purpose                       | Notes                           |
|----------------------------|-------------------------------|---------------------------------|
| ESP8266 NodeMCU v2         | Main microcontroller          | Any ESP8266 board works         |
| LDR + 10kΩ resistor        | Light level sensing (A0)      | Voltage divider to GND          |
| DHT11 or DHT22             | Temperature + humidity        | See TODO in `main.cpp`          |
| Push button                | Interaction counting          | D3 (GPIO 0), active LOW         |
| RGB LED or NeoPixel        | Visual creature feedback      | D5–D7, see TODO in `main.cpp`   |

---

## License

MIT
