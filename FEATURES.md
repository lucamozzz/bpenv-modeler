# Branch Features: bpmn-dynamic-attributes-full

This document describes the features implemented in the `bpmn-dynamic-attributes-full` branch.

---

## 1. OSM Feature Selection Tool

A new toolbar tool that allows selecting OpenStreetMap features directly on the map.

### How to Use

1. Click the **Select** tool in the toolbar (pointer icon)
2. Click on any feature on the map (buildings, roads, POIs, etc.)
3. The selected OSM feature is highlighted
4. Feature properties can be viewed and used

---

## 2. Dynamic Attribute Providers

A plugin system that fetches attributes for physical places from external APIs based on coordinates.

### Available Providers

| Provider | Coverage | Prefix | Data Retrieved |
|----------|----------|--------|----------------|
| **Weather** | Worldwide | `weather.*` | All fields from Open-Meteo API (temperature, humidity, wind, etc.) |
| **Location** | Worldwide | `location.*` | All fields from Nominatim API (address, city, country, etc.) |
| **OSM Tags** | Worldwide | `osm.*` | All tags from nearest OSM element |

All providers dynamically pull all attributes from the API response - no manual field mapping required.

### How to Use

1. Select a physical place in the sidebar
2. Click the globe (🌐) dropdown button
3. Choose a provider or "Fetch All"
4. Attributes are added with their prefix (e.g., `weather.temperature`)

### Extending with New Providers

Create a new provider by implementing the `IAttributeProvider` interface:

```typescript
// src/services/providers/MyProvider.ts
import { IAttributeProvider, AttributeFetchResult } from '../types';
import { HttpClient } from '../utils/httpClient';
import { flattenObject, prefixKeys } from '../utils/attributeHelpers';

export class MyProvider implements IAttributeProvider {
  metadata = {
    id: 'my-provider',
    name: 'My Provider',
    description: 'Fetches data from My API',
    version: '1.0.0',
  };

  schema = {
    'my.*': { type: 'object', description: 'All fields from My API' },
  };

  private httpClient = new HttpClient({ baseURL: 'https://api.example.com' });

  canHandle(place: PhysicalPlace): boolean {
    return place.coordinates && place.coordinates.length > 0;
  }

  async fetchAttributes(place: PhysicalPlace): Promise<AttributeFetchResult> {
    const [lon, lat] = place.coordinates[0];
    const data = await this.httpClient.get('/endpoint', {
      queryParams: { lat, lon },
    });

    // Flatten and prefix all attributes dynamically
    const attributes = prefixKeys(flattenObject(data), 'my');

    return { success: true, attributes };
  }
}
```

Register it in `src/services/initializeProviders.ts`:

```typescript
import { MyProvider } from './providers/MyProvider';

registry.register(new MyProvider());
```

---

## 3. MQTT Real-Time Sensor Integration

Connect to MQTT brokers and subscribe to real-time sensor data for physical places.

### How to Use

1. Click the **MQTT button** in the toolbar (shows connection status)
2. Enter broker URL or use default (`wss://test.mosquitto.org:8081`)
3. Click **Connect**
4. Select a physical place in the sidebar
5. Click dropdown → **Subscribe Light Sensor**
6. A light indicator appears showing real-time lux readings

### Light Sensor Topic Format

```
bpenv/demo/rooms/{placeId}/sensors/light
```

### Message Format

```json
{
  "lux": 450,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Testing with the Simulator

```bash
node scripts/mqtt-light-simulator.js YOUR_JOSM_PLACE_ID
```

### Extending with New Sensor Types

To add a new sensor type (e.g., temperature):

**1. Define the data type** in `src/services/mqtt/types.ts`:

```typescript
export interface TemperatureSensorData {
  placeId: string;
  temperature: number;
  unit: 'C' | 'F';
  timestamp: string;
}
```

**2. Add store state** in `src/stores/mqttStore.ts`:

```typescript
interface MqttState {
  // ... existing state
  temperatureData: Map<string, TemperatureSensorData>;
}
```

**3. Add subscription handler** in `useMqtt.ts`:

```typescript
const subscribeTemperature = (placeId: string) => {
  const topic = `bpenv/demo/rooms/${placeId}/sensors/temperature`;
  mqttService.subscribe(topic, (message) => {
    const data = JSON.parse(message);
    // Update store with temperature data
  });
};
```

**4. Create UI indicator** similar to `LightStatusIndicator.tsx`

### Configuring a Different Broker

The broker URL can be changed in the MQTT connection panel. Supported formats:
- `wss://broker.example.com:8084` (WebSocket Secure)
- `ws://broker.example.com:8083` (WebSocket)

---

## Architecture Overview

```
src/
├── services/
│   ├── providers/           # Attribute providers
│   │   ├── WeatherAttributeProvider.ts
│   │   ├── GeocodingAttributeProvider.ts
│   │   └── OSMTagsAttributeProvider.ts
│   ├── mqtt/                # MQTT service
│   │   ├── MqttService.ts   # Connection management
│   │   └── types.ts         # MQTT types
│   └── AttributeProviderRegistry.ts
├── stores/
│   └── mqttStore.ts         # MQTT state (Zustand)
├── hooks/
│   └── useMqtt.ts           # React hook for MQTT
└── components/
    ├── mqtt/
    │   └── MqttConnectionPanel.tsx
    └── sidebar/physical/
        └── LightStatusIndicator.tsx
```

---

## External APIs

| API | Endpoint | Documentation |
|-----|----------|---------------|
| Open-Meteo Weather | `api.open-meteo.com` | [open-meteo.com/en/docs](https://open-meteo.com/en/docs) |
| Nominatim | `nominatim.openstreetmap.org` | [nominatim.org/release-docs](https://nominatim.org/release-docs/latest/) |
| Overpass | `overpass-api.de` | [wiki.openstreetmap.org/Overpass_API](https://wiki.openstreetmap.org/wiki/Overpass_API) |
| MQTT Broker | `test.mosquitto.org` | [test.mosquitto.org](https://test.mosquitto.org/) |
