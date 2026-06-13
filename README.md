# 🥚 Hatchmosphere

> **Where your environment decides what hatches.**

Hatchmosphere is a sensor-powered creature incubator with knowledge-based generation. A physical ESP8266 device reads real-world environmental data - light level, temperature, humidity, and button interactions - and sends it to a Node.js/Express backend. A React/Vite web app displays the current egg conditions and lets you hatch an egg. When the egg hatches, the backend generates a unique creature profile based on sensor readings, enriched with knowledge snippets retrieved from a Foundry IQ semantic search layer (Azure AI Search).

---

## Architecture

<img width="2172" height="724" alt="ChatGPT Image Jun 13, 2026, 07_46_35 PM" src="https://github.com/user-attachments/assets/f899e38b-0c20-4b50-8ca0-d99ed6a30d9c" />

---

## Project Structure

```
hatchmosphere/
  client/                       React/Vite frontend
    public/
    src/
      App.jsx                   Root component (sensor polling, hatch orchestration)
      main.jsx                  React entry point
      components/
        EggPanel.jsx            Displays egg state from current sensor reading
        SensorPanel.jsx         Shows live light/temperature/humidity/interactions
        CreatureCard.jsx        Full creature profile after hatching
        HatchButton.jsx         Hatch trigger button with animation
        HatchHistory.jsx        Clickable grid of hatched creatures
        SourcesPanel.jsx        Knowledge documents used for this creature
      services/
        api.js                  All HTTP calls to backend
      styles/
        App.css                 Dark magical/tech theme
    package.json
    vite.config.js

  server/                       Node.js/Express backend
    index.js                    App entry, middleware, route registration
    state.js                    In-memory shared state module
    .env                        Azure credentials (git-ignored)
    routes/
      device.js                 GET/POST /api/device-reading, /api/latest-reading
      hatch.js                  POST /api/hatch, /api/set-led
    services/
      creatureService.js        Generates creature from sensor data + knowledge
      foundryIqService.js       Azure AI Search semantic search integration
    data/
      mockKnowledge.js          Fallback knowledge (when Azure not configured)
    package.json
    package-lock.json

  docs/                         Knowledge base for semantic indexing
    hatching-rules.md           Environmental effects on creature types
    creature-types.md           Traits, abilities, habitats per type
    biomes.md                   Biome descriptions and origins
    evolution-rules.md          Evolution paths and rarity mechanics

  scripts/
    index-docs.js               One-time: Create Azure index + upload docs

  src/                          ESP8266 firmware (PlatformIO)
    main.cpp                    Sensor reading, Wi-Fi, HTTP, LED control
    config.h                    Wi-Fi + server credentials
    config.h.example            Template for config.h

  platformio.ini                Board config (ESP8266 NodeMCU v2)
  .gitignore
  LICENSE
  README.md
  package.json                  Root (for convenience scripts)
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

1. Copy `src/config.h.example` to `src/config.h` and fill in your values:
   ```cpp
   #define WIFI_SSID     "YOUR_WIFI_NAME"
   #define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
   #define SERVER_IP     "YOUR_LAPTOP_IP"        // e.g., 192.168.1.100
   #define SERVER_PORT   3000
   ```

2. Find your laptop's local IP:
   - **Windows:** `ipconfig` → look for *IPv4 Address*
   - **Mac/Linux:** `ifconfig` or `ip addr`

3. With PlatformIO installed in VS Code:
   - Open the project folder containing `platformio.ini`
   - Click **Upload** in the PlatformIO sidebar, or run:
     ```bash
     pio run --target upload
     ```

4. View serial output:
   ```bash
   pio device monitor
   ```
   You should see logs showing Wi-Fi connection, sensor readings, and LED commands.

---

## API Reference

| Method | Endpoint                | Description                                              |
|--------|-------------------------|----------------------------------------------------------|
| POST   | `/api/device-reading`   | ESP8266 POSTs sensor data; returns LED command           |
| GET    | `/api/latest-reading`   | Frontend polls current sensor state                      |
| GET    | `/api/device-command`   | ESP8266 polls for LED colour/effect to display           |
| POST   | `/api/hatch-start`      | Frontend triggers animation start; LED flashes white     |
| POST   | `/api/hatch`            | Frontend generates creature from snapshot; returns data  |
| POST   | `/api/set-led`          | Frontend syncs LED when viewing history creature         |
| GET    | `/api/hatched`          | Frontend fetches all creatures hatched this session      |
| GET    | `/health`               | Server health check                                      |

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

The knowledge layer lives in `server/services/foundryIqService.js`. When a creature is hatched, it performs **semantic search** queries against Azure AI Search to retrieve relevant knowledge snippets based on creature type and sensor conditions. These snippets inform the creature's traits and are returned alongside the creature data. If Azure credentials are not configured, it gracefully falls back to local mock knowledge.

**How it works:**
1. ESP8266 sends sensor reading (light, temp, humidity, interactions)
2. `creatureService.js` determines creature type from sensor ranges
3. `foundryIqService.js` queries Azure AI Search: *"[CreatureType] creature hatching environment incubation"*
4. Semantic search returns top 4 knowledge snippets
5. Creature is generated with traits informed by the retrieved knowledge
6. Frontend displays creature + sources (which documents were used)

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

## Development with GitHub Copilot

This project was scaffolded with **GitHub Copilot** (Claude Sonnet 4.6).

Copilot assisted with:
- Generating the initial project structure and boilerplate
- Writing the procedural creature generation logic in `creatureService.js`
- Designing the dark magical CSS theme for the React frontend
- Writing beginner-friendly, well-commented ESP8266 firmware

This allowed for fast prototyping and creation of an MVP within a couple of days - something which originally would have taken weeks.

---

## Hardware List & Wiring

| Component              | Pin(s)       | Notes                                                  |
|------------------------|--------------|--------------------------------------------------------|
| ESP8266 NodeMCU v2     | —            | Main microcontroller (3.3V logic)                     |
| RGB LED (common anode) | D7, D6, D5   | Each pin with 220Ω current-limiting resistor; common pin to 3.3V |
| LDR (light sensor)     | A0           | Voltage divider: LDR to 3.3V, 10kΩ resistor to GND  |
| DHT11/22 (temp/humid)  | D2           | Data pin to D2, pull-up resistor built-in or 10kΩ to 3.3V |
| Push button            | D1 (GPIO 5)  | One leg to D1, other to GND; external 10kΩ pull-up to 3.3V; active HIGH |

### Detailed Wiring

**RGB LED (Common Anode):**
```
  R (pin 1)     ──[220Ω]── D7 (GPIO 13)
  G (pin 2)     ──[220Ω]── D6 (GPIO 12)
  B (pin 3)     ──[220Ω]── D5 (GPIO 14)
  Common (long) ───────────── 3.3V
```

**LDR (Voltage Divider):**
```
  3.3V ──[LDR]── A0 ──[10kΩ]── GND
```

**Push Button (with External Pull-Up):**
```
  3.3V ──[10kΩ]── D1 ──[Button]── GND
```

**DHT11/22:**
```
  VCC (1) ────── 3.3V
  Data(2) ──[10kΩ]── 3.3V (pull-up)
  Data(2) ────── D2
  GND (4) ────── GND
```

---

## License

MIT

## Student Status

I am currently a student at the Unversity of London in my 3rd year of my Computer Science Bachelors degree. I also am currently at an industrial placement working as a Software Engineer at Zebra Technologies and started in July 2025.
