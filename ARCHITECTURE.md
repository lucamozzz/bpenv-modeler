# BPEnv Modeler - Complete Architecture with Attribute Provider Integration

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BPENV MODELER APPLICATION                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE LAYER                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────┐                                                        │
│  │   Header.tsx     │   Top navigation and controls                          │
│  └──────────────────┘                                                        │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Map.tsx (OpenLayers)                           │  │
│  │  - Interactive map visualization                                       │  │
│  │  - Click to create PhysicalPlaces                                      │  │
│  │  - Draw edges between places                                           │  │
│  │  - Feature highlighting and zooming                                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Sidebar (Collapsible)                               │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  PhysicalLayer.tsx                                               │  │  │
│  │  │  ├─ PhysicalElement.tsx  ◄──────────────┐                       │  │  │
│  │  │  │  ├─ Name input                       │ NEW INTEGRATION        │  │  │
│  │  │  │  ├─ [+] Add attribute button         │                        │  │  │
│  │  │  │  ├─ [🌐] Fetch from APIs ◄───────────┼──────────────┐         │  │  │
│  │  │  │  │   └─ Dropdown:                    │              │         │  │  │
│  │  │  │  │      • Weather (NOAA)              │              │         │  │  │
│  │  │  │  │      • Location (Nominatim)        │              │         │  │  │
│  │  │  │  │      • OSM Tags (Overpass)         │              │         │  │  │
│  │  │  │  │      • Fetch All                   │              │         │  │  │
│  │  │  │  └─ [🗑️] Delete button               │              │         │  │  │
│  │  │  └─ PhysicalAttributes.tsx               │              │         │  │  │
│  │  │     └─ Key-value attribute editor        │              │         │  │  │
│  │  │                                           │              │         │  │  │
│  │  └─────────────────────────────────────────┘              │         │  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │         │  │  │
│  │  │  LogicalLayer.tsx                                    │  │         │  │  │
│  │  │  └─ Logical places and views                        │  │         │  │  │
│  │  └─────────────────────────────────────────────────────┘  │         │  │  │
│  └───────────────────────────────────────────────────────────┘         │  │  │
│                                                                         │  │  │
└─────────────────────────────────────────────────────────────────────────┼──┼──┘
                                                                          │  │
                                                                          │  │
┌─────────────────────────────────────────────────────────────────────────┼──┼──┐
│                          STATE MANAGEMENT LAYER                         │  │  │
├─────────────────────────────────────────────────────────────────────────┼──┼──┤
│                                                                          │  │  │
│  ┌───────────────────────────────────────────────────────────────────┐  │  │  │
│  │                    envStore.ts (Zustand)                           │  │  │  │
│  │                                                                     │  │  │  │
│  │  State:                                                             │  │  │  │
│  │  • physicalPlaces: PhysicalPlace[]  ◄────────────────────────────────┘  │  │
│  │      └─ { id, name, coordinates, attributes }                       │     │  │
│  │  • edges: Edge[]                                                     │     │  │
│  │  • logicalPlaces: LogicalPlace[]                                    │     │  │
│  │  • views: View[]                                                     │     │  │
│  │  • mapInstance: Map                                                 │     │  │
│  │  • isEditable: boolean                                              │     │  │
│  │                                                                      │     │  │
│  │  Actions:                                                            │     │  │
│  │  • addPlace(place)                                                  │     │  │
│  │  • updatePlace(id, updates) ◄── Updates attributes here            │     │  │
│  │  • removePlace(id)                                                  │     │  │
│  │  • addEdge(edge)                                                    │     │  │
│  │  • updateEdge(id, updates)                                          │     │  │
│  │  • setModel(model)                                                  │     │  │
│  │                                                                      │     │  │
│  └──────────────────────────────────────────────────────────────────────┘    │  │
│                                                                               │  │
└───────────────────────────────────────────────────────────────────────────────┼──┘
                                                                                │
                                                                                │
┌───────────────────────────────────────────────────────────────────────────────┼──┐
│                    NEW: ATTRIBUTE PROVIDER SYSTEM                             │  │
├───────────────────────────────────────────────────────────────────────────────┼──┤
│                                                                                │  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │              initializeProviders.ts (Startup)                            │ │  │
│  │  • Called once in main.tsx on app startup                               │ │  │
│  │  • Registers all providers with the registry                            │ │  │
│  └─────────────────────────────────────────────────────────────────────────┘ │  │
│                                    │                                          │  │
│                                    ▼                                          │  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │         AttributeProviderRegistry.ts (Singleton)                        │ │  │
│  │                                                                          │ │  │
│  │  Registry Management:                                                   │ │  │
│  │  • registerProvider(provider)                                           │ │  │
│  │  • getProvider(id): IAttributeProvider                                  │ │  │
│  │  • getAllProviders(): IAttributeProvider[] ◄────────────────────────────┘  │
│  │  • getAvailableProviders(): ProviderMetadata[]                          │    │
│  │                                                                          │    │
│  │  Configuration:                                                         │    │
│  │  • timeout: 30000ms                                                     │    │
│  │  • enableCache: true                                                    │    │
│  │  • cacheTTL: 5 minutes                                                  │    │
│  │                                                                          │    │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│          ┌─────────────────────────┼─────────────────────────┐                 │
│          │                         │                         │                 │
│          ▼                         ▼                         ▼                 │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐        │
│  │ WeatherAttribute │    │ GeocodingAttribute│   │ OSMTagsAttribute │        │
│  │ Provider.ts      │    │ Provider.ts       │   │ Provider.ts      │        │
│  ├──────────────────┤    ├──────────────────┤    ├──────────────────┤        │
│  │ ID: 'weather'    │    │ ID: 'geocoding'  │    │ ID: 'osm-tags'   │        │
│  │                  │    │                  │    │                  │        │
│  │ metadata         │    │ metadata         │    │ metadata         │        │
│  │ schema           │    │ schema           │    │ schema           │        │
│  │                  │    │                  │    │                  │        │
│  │ canHandle()      │    │ canHandle()      │    │ canHandle()      │        │
│  │ • US only        │    │ • Worldwide      │    │ • Worldwide      │        │
│  │ • lat: 24-50     │    │ • Any coords     │    │ • Any coords     │        │
│  │ • lon: -125/-66  │    │                  │    │                  │        │
│  │                  │    │                  │    │                  │        │
│  │ fetchAttributes()│    │ fetchAttributes()│    │ fetchAttributes()│        │
│  │ • Fetches from   │    │ • Fetches from   │    │ • Fetches from   │        │
│  │   api.weather.gov│    │   nominatim      │    │   Overpass API   │        │
│  │ • Returns all    │    │ • Returns all    │    │ • Returns all    │        │
│  │   weather fields │    │   location data  │    │   OSM tags       │        │
│  │ • Dynamic!       │    │ • Dynamic!       │    │ • Dynamic!       │        │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘        │
│           │                       │                       │                   │
│           └───────────────────────┼───────────────────────┘                   │
│                                   │                                           │
│                                   ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    HTTP Client (utils/httpClient.ts)                     │ │
│  │  • Timeout support (configurable per request)                           │ │
│  │  • Error handling (HttpError class)                                     │ │
│  │  • Content-Type detection (JSON/text)                                   │ │
│  │  • Query parameter building                                             │ │
│  │  • GET, POST, PUT, DELETE, PATCH methods                                │ │
│  │  • String body support (for Overpass QL)                                │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                   │                                           │
│                                   ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │              Utility Helpers (utils/attributeHelpers.ts)                 │ │
│  │  • flattenObject() - Nested objects → dot notation                      │ │
│  │  • prefixKeys() - Add namespace to all keys                             │ │
│  │  • extractByPrefix() - Get attributes by prefix                         │ │
│  │  • removePrefix() - Strip prefix from keys                              │ │
│  │  • getNestedValue() - Safe nested access                                │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL APIS (Internet)                            │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │  api.weather.gov    │  │  nominatim.osm.org  │  │  overpass-api.de     │ │
│  │  (NOAA Weather)     │  │  (Reverse Geocoding)│  │  (OSM Query API)     │ │
│  │                     │  │                     │  │                      │ │
│  │  • US locations only│  │  • Worldwide        │  │  • Worldwide         │ │
│  │  • Weather forecast │  │  • Address info     │  │  • All OSM tags      │ │
│  │  • Current conditions│ │  • Location metadata│  │  • Element search    │ │
│  └─────────────────────┘  └─────────────────────┘  └──────────────────────┘ │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: User Clicks 🌐 Button

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERACTION FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

1. User clicks on map
   └─> Creates PhysicalPlace with coordinates: [lon, lat]
   └─> Stored in envStore.physicalPlaces[]

2. Place appears in sidebar (PhysicalElement component)
   └─> Shows: name, [+], [🌐], [🗑️] buttons

3. User clicks [🌐] button
   └─> Dropdown opens showing:
       • Weather (NOAA)
       • Location (Nominatim)
       • OSM Tags (Overpass)
       • Fetch All

4. User selects "OSM Tags (Overpass)"
   │
   ├─> PhysicalElement.handleFetchAttributes('osm-tags') called
   │   └─> setLoadingProvider('osm-tags')  // Shows ⏳
   │
   ├─> getProviderRegistry().getProvider('osm-tags')
   │   └─> Returns OSMTagsAttributeProvider instance
   │
   ├─> provider.canHandle(place)
   │   └─> Checks if place has valid coordinates
   │   └─> Returns true ✓
   │
   ├─> provider.fetchAttributes(place)
   │   │
   │   ├─> Builds Overpass QL query string
   │   │   └─> Search within 50m radius of coordinates
   │   │
   │   ├─> httpClient.post('/interpreter', query)
   │   │   └─> POST to https://overpass-api.de/api/interpreter
   │   │   └─> Sends plain text query (not JSON)
   │   │   └─> Waits for response (timeout: 15s)
   │   │
   │   ├─> Response: { elements: [...] }
   │   │   └─> Array of nearby OSM elements
   │   │
   │   ├─> findClosestElement(elements, lat, lon)
   │   │   └─> Calculates distance using Haversine formula
   │   │   └─> Returns element with tags closest to coordinates
   │   │
   │   ├─> Extract tags from closest element
   │   │   └─> tags = { name: '...', amenity: '...', ... }
   │   │
   │   ├─> Add metadata
   │   │   └─> _element_id, _element_type, _distance
   │   │
   │   ├─> prefixKeys(tags, 'osm')
   │   │   └─> Converts:
   │   │       { name: 'Park' }
   │   │       to:
   │   │       { 'osm.name': 'Park' }
   │   │
   │   └─> Returns AttributeFetchResult
   │       └─> { success: true, attributes: {...}, timestamp, providerId }
   │
   ├─> Merge with existing attributes
   │   └─> mergedAttributes = { ...place.attributes, ...result.attributes }
   │
   ├─> updateElement(place.id, { attributes: mergedAttributes })
   │   └─> Calls envStore.updatePlace()
   │   └─> Updates Zustand state
   │   └─> React re-renders
   │
   ├─> Alert user: "Success! Fetched X attributes from OSM Tags Provider"
   │
   └─> setLoadingProvider(null)  // Hide ⏳

5. Attributes appear in PhysicalAttributes component
   └─> Shows all fetched attributes as key-value pairs:
       • osm.name = "Golden Gate Park"
       • osm.leisure = "park"
       • osm.tourism = "attraction"
       • osm.website = "https://..."
       • ... (all tags dynamically populated)

6. User can now:
   ├─> Edit any attribute value
   ├─> Delete attributes
   ├─> Add more manual attributes
   └─> Fetch from other providers (merge more data)
```

## Type Definitions (Core Data Model)

```typescript
// envTypes.ts
type PhysicalPlace = {
    id: string;
    name: string;
    coordinates: [number, number][];  // [[lon, lat], ...]
    attributes: Record<string, any>;   // Dynamic key-value store
}

// After fetching OSM tags, attributes might look like:
{
    "osm.name": "Central Park",
    "osm.leisure": "park",
    "osm.tourism": "attraction",
    "osm.website": "https://centralparknyc.org",
    "osm.opening_hours": "06:00-01:00",
    "osm._element_id": 123456,
    "osm._element_type": "way",
    "osm._distance": 12.5,
    "location.display_name": "Central Park, New York, NY, USA",
    "location.address.city": "New York",
    "weather.temperature": 72,
    "weather.shortForecast": "Sunny",
    // ... any other attributes fetched or manually added
}
```

## Key Integration Points

### 1. Initialization (main.tsx)

```typescript
import { initializeProviders } from './services/initializeProviders';

// On app startup
initializeProviders().then(() => {
    console.log('✅ Providers ready!');
});
```

### 2. UI Integration (PhysicalElement.tsx)

```typescript
import { getProviderRegistry } from '../../../services/AttributeProviderRegistry';

// In component
const registry = getProviderRegistry();
const provider = registry.getProvider('osm-tags');
const result = await provider.fetchAttributes(place);

// Update store
updatePlace(place.id, { attributes: mergedAttributes });
```

### 3. State Persistence (envStore.ts)

```typescript
// Zustand automatically persists state
// Attributes are stored in place.attributes
// React components auto-update when state changes
```

## Benefits of This Architecture

✅ **Separation of Concerns**

- UI layer doesn't know about API details
- Providers are independent, testable modules
- State management is centralized

✅ **Extensibility**

- Add new providers without changing existing code
- Each provider implements same interface
- Registry pattern allows dynamic provider discovery

✅ **Dynamic & Flexible**

- No hardcoded attribute names
- All API fields automatically captured
- Namespace prefixes prevent collisions

✅ **Type-Safe**

- TypeScript throughout
- Interface contracts enforced
- Compile-time error checking

✅ **User-Friendly**

- Single button click to fetch data
- Clear loading states (⏳)
- Success/error feedback
- Merged results from multiple providers

✅ **Maintainable**

- Clear architecture diagrams
- Documented code
- Modular structure
- Easy to debug

## File Structure

```
src/
├── main.tsx                          # App entry, initializes providers
├── envStore.ts                       # Zustand state management
├── envTypes.ts                       # TypeScript type definitions
│
├── components/
│   ├── Map.tsx                       # OpenLayers map
│   ├── Header.tsx                    # Top navigation
│   └── sidebar/
│       └── physical/
│           ├── PhysicalLayer.tsx     # Container
│           ├── PhysicalElement.tsx   # 🌐 button integration here
│           └── PhysicalAttributes.tsx # Attribute display/edit
│
├── services/                         # NEW: Attribute provider system
│   ├── types.ts                      # Core interfaces
│   ├── AttributeProviderRegistry.ts  # Singleton registry
│   ├── initializeProviders.ts        # Bootstrap
│   │
│   ├── providers/                    # Individual API integrations
│   │   ├── WeatherAttributeProvider.ts
│   │   ├── GeocodingAttributeProvider.ts
│   │   └── OSMTagsAttributeProvider.ts
│   │
│   ├── utils/
│   │   ├── httpClient.ts             # HTTP wrapper
│   │   └── attributeHelpers.ts       # Utility functions
│   │
│   ├── README.md                     # Architecture docs
│   └── USAGE_EXAMPLES.md             # Code examples
│
└── hooks/
    └── useAttributeProviders.ts      # React hook (optional)
```

## Summary

The new **Attribute Provider System** seamlessly integrates with your existing **BPEnv Modeler** application:

- **No breaking changes** to existing functionality
- **Single button click** to fetch API data
- **Fully dynamic** - no manual field mapping
- **Extensible** - add new APIs easily
- **Type-safe** - TypeScript throughout
- **User-friendly** - clear UI integration

The system fetches data from external APIs and populates `PhysicalPlace.attributes` dynamically, allowing users to enrich their spatial data with real-world information from OpenStreetMap, weather services, and geocoding APIs.
