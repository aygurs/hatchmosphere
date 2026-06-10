/*
 * ============================================================
 *  Hatchmosphere — ESP8266 Firmware
 * ============================================================
 *
 *  What this does:
 *    1. Connects to your Wi-Fi network.
 *    2. Reads the light level from an LDR on pin A0.
 *    3. Tracks button presses on D1 as "interaction count".
 *    4. Every second, POSTs a JSON reading to the server.
 *    5. Every second, GETs the latest LED command from the server.
 *    6. Drives an RGB LED with colour + effect from the server response.
 *
 *  Hardware wiring:
 *
 *    RGB LED (common anode — connect common pin to 3.3V):
 *      R pin ──[220Ω]── D7 (GPIO 13)
 *      G pin ──[220Ω]── D6 (GPIO 12)
 *      B pin ──[220Ω]── D5 (GPIO 14)
 *      Common (longest leg) ── 3.3V
 *
 *    LDR (light sensor):
 *      One leg to 3.3V, other leg to A0.
 *      10kΩ resistor between A0 and GND (voltage divider).
 *
 *    Push button:
 *      One leg to D1 (GPIO 5), other leg to GND.
 *      External pull-up resistor between D1 and 3.3V.
 *
 *    DHT11/22 (temperature + humidity):
 *      Data pin to D2 (GPIO 4), VCC to 3.3V, GND to GND.
 *      Add a 10kΩ pull-up between data and VCC if your module
 *      doesn't have one built in.
 *
 *  Before you flash:
 *    1. Copy config.h.example to config.h and fill in your values.
 *    2. Make sure the server is running: cd server && npm run dev
 *
 * ============================================================
 */

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "config.h"  // WiFi credentials and server IP — git-ignored

// ============================================================
// Pin Definitions
// ============================================================

const int PIN_LDR    = A0;  // Analogue light sensor (0–1023)
const int PIN_BUTTON = D1;   // D1 on NodeMCU — push button (active LOW with pull-up)

// RGB LED pins — one 220Ω resistor on each pin
const int PIN_LED_R = D7;  // D7
const int PIN_LED_G = D6;  // D6
const int PIN_LED_B = D5;  // D5

#define DHT_PIN D2          // D2 on NodeMCU
#define DHT_TYPE DHT11      // change to DHT22 if you have the more accurate sensor
DHT dht(DHT_PIN, DHT_TYPE);

// ============================================================
// LED State — updated whenever a new command arrives from server
// ============================================================

// Target colour components (0–255), parsed from the server's hex string
int ledR = 255;
int ledG = 255;
int ledB = 255;

// Current effect name — matches the ledEffect values sent by the server
char ledEffect[16] = "solid";

// Internal timing for LED animations
unsigned long ledLastUpdate = 0;
int           ledFlashState = 0;     // for flash effect (on/off toggle)

// ============================================================
// LED Helper Functions
// ============================================================

// Write a PWM value to all three LED pins.
// Common anode (connected to 3.3V): invert the value (write 255-value to pull pin LOW).
void writeLED(int r, int g, int b) {
  r = constrain(r, 0, 255);
  g = constrain(g, 0, 255);
  b = constrain(b, 0, 255);
  analogWrite(PIN_LED_R, 255 - r);
  analogWrite(PIN_LED_G, 255 - g);
  analogWrite(PIN_LED_B, 255 - b);
}

// Apply the current LED effect. Called every loop iteration.
void updateLED() {
  unsigned long now = millis();

  if (strcmp(ledEffect, "flash") == 0) {
    // Simple flash: on/off every 300ms
    if (now - ledLastUpdate >= 300) {
      ledLastUpdate = now;
      ledFlashState = !ledFlashState;
    }
    if (ledFlashState) {
      writeLED(ledR, ledG, ledB);
    } else {
      writeLED(0, 0, 0);
    }
  } else {
    // Default: solid colour
    writeLED(ledR, ledG, ledB);
  }
}

// ============================================================
// Sensor + interaction state
// ============================================================

int  interactionCount = 0;
unsigned long lastDebounceTime = 0;
const unsigned long DEBOUNCE_MS = 500;

// Last known good sensor values — updated each loop from DHT
float temperature = 22.0;
float humidity    = 55.0;

// ============================================================
// Send interval
// ============================================================

const unsigned long SEND_INTERVAL = 1000;
unsigned long lastSendTime = 0;

// ============================================================
// Helper: Build server URLs
// ============================================================

String getReadingUrl() {
  return String("http://") + SERVER_IP + ":" + SERVER_PORT + "/api/device-reading";
}

// ============================================================
// Send sensor data to the server via POST
// ============================================================

// Send sensor data to the server and apply the LED command from the response.
void sendSensorData(int light, float temp, float hum, int interactions) {
  WiFiClient wifiClient;
  HTTPClient http;

  StaticJsonDocument<200> doc;
  doc["light"]            = light;
  doc["temperature"]      = temp;
  doc["humidity"]         = hum;
  doc["interactionCount"] = interactions;

  String jsonBody;
  serializeJson(doc, jsonBody);

  Serial.print("Sending: ");
  Serial.println(jsonBody);

  http.begin(wifiClient, getReadingUrl());
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(jsonBody);

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();

    // Parse the response and apply the LED command straight away
    StaticJsonDocument<512> res;
    DeserializationError err = deserializeJson(res, payload);

    if (!err && res.containsKey("command")) {
      int r       = res["command"]["ledR"]      | 255;
      int g       = res["command"]["ledG"]      | 255;
      int b       = res["command"]["ledB"]      | 255;
      const char* effect  = res["command"]["ledEffect"] | "solid";
      const char* message = res["command"]["message"]   | "";

      Serial.print("LED: ");      Serial.print(r); Serial.print(","); Serial.print(g); Serial.print(","); Serial.println(b);
      Serial.print("Effect: ");   Serial.println(effect);
      Serial.print("Message: ");  Serial.println(message);

      ledR = r;
      ledG = g;
      ledB = b;
      strncpy(ledEffect, effect, sizeof(ledEffect) - 1);
      ledEffect[sizeof(ledEffect) - 1] = '\0';
      ledFlashState = 0;
    } else {
      Serial.println("Data sent OK (no command in response).");
    }

  } else {
    Serial.print("POST failed, HTTP code: ");
    Serial.println(httpCode);
  }

  http.end();
}

// ============================================================
// Check for button presses and increment interaction count
// ============================================================

void checkButton() {
  bool currentState = digitalRead(PIN_BUTTON);
  unsigned long now  = millis();

  // Button is pressed and debounce window has passed
  if (currentState == HIGH && now - lastDebounceTime >= DEBOUNCE_MS) {
    lastDebounceTime = now;
    interactionCount++;
    Serial.print("Button pressed! Total interactions: ");
    Serial.println(interactionCount);
  }
}

// ============================================================
// Connect to Wi-Fi
// ============================================================

void connectToWifi() {
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nCould not connect to Wi-Fi. Will retry on next loop.");
  }
}

// ============================================================
// Arduino setup
// ============================================================

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n=== Hatchmosphere Firmware Starting ===");

  pinMode(PIN_BUTTON, INPUT);

  dht.begin();

  pinMode(PIN_LED_R, OUTPUT);
  pinMode(PIN_LED_G, OUTPUT);
  pinMode(PIN_LED_B, OUTPUT);

  connectToWifi();
}

// ============================================================
// Arduino loop
// ============================================================

void loop() {
  checkButton();
  updateLED();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi connection lost. Reconnecting...");
    connectToWifi();
    return;
  }

  unsigned long now = millis();

  if (now - lastSendTime >= SEND_INTERVAL) {
    lastSendTime = now;

    int lightLevel = analogRead(PIN_LDR);

    // Get new temperature and humidity readings from the DHT sensor.
    // If the reading fails (returns NaN), keep the last known good value.
    float newTemp = dht.readTemperature();
    float newHum  = dht.readHumidity();
    if (!isnan(newTemp)) temperature = newTemp;
    if (!isnan(newHum))  humidity    = newHum;

    // Log the current sensor values and interaction count
    Serial.print("Light: ");        Serial.print(lightLevel);
    Serial.print(" | Temp: ");      Serial.print(temperature);
    Serial.print("C | Humidity: "); Serial.print(humidity);
    Serial.print("% | Button: ");   Serial.println(interactionCount);

    // Send the sensor data to the server and update the LED based on the response
    sendSensorData(lightLevel, temperature, humidity, interactionCount);
  }
}
