# Quick Testing Guide - OSM Tags & Attribute Providers

## ✅ What Was Added

A **🌐 dropdown button** next to the **+** button in the Physical Layer sidebar that lets you fetch attributes from APIs with one click!

## 🚀 How to Test

### Step 1: Start Your App

```bash
npm run dev
```

### Step 2: Create a Physical Place

1. Click on the map to create a physical place
2. Give it a name (e.g., "Test Location")
3. Look at the sidebar - you'll see your place listed

### Step 3: Fetch Attributes

Next to each place in the sidebar, you'll see:
- **+** button (add manual attribute)
- **🌐** button (NEW! - fetch from APIs)
- **🗑️** button (delete)

Click the **🌐** button to see a dropdown with options:

#### Individual Providers:
- **Weather (NOAA)** - US locations only
- **Location (Nominatim)** - Reverse geocoding (address info)
- **OSM Tags (Overpass)** - All OpenStreetMap tags for nearest element

#### Fetch All:
- **Fetch All** - Fetches from all providers at once

### Step 4: Test OSM Tags

1. Create a place on a known location (e.g., a park, building, or landmark)
2. Click **🌐 → OSM Tags (Overpass)**
3. Wait a moment (you'll see ⏳)
4. Success! You'll see an alert showing how many attributes were fetched
5. Scroll down in the attributes section to see all the OSM tags!

## 📍 Good Test Locations

### USA (for all providers):
```javascript
// Golden Gate Park, San Francisco
coordinates: [[-122.4862, 37.7694]]

// Central Park, New York
coordinates: [[-73.9654, 40.7829]]

// Boston Common
coordinates: [[-71.0661, 42.3554]]
```

### Europe (OSM Tags & Location only):
```javascript
// Eiffel Tower, Paris
coordinates: [[2.2945, 48.8584]]

// Hyde Park, London
coordinates: [[-0.1655, 51.5074]]

// Brandenburg Gate, Berlin
coordinates: [[13.3777, 52.5163]]
```

## 🔍 What Attributes Will You See?

### OSM Tags Example (for a park):
```javascript
{
  'osm.name': 'Golden Gate Park',
  'osm.leisure': 'park',
  'osm.tourism': 'attraction',
  'osm.website': 'https://goldengatepark.com',
  'osm.opening_hours': '06:00-22:00',
  'osm.operator': 'San Francisco Recreation & Parks',
  'osm.access': 'yes',
  'osm.fee': 'no',
  'osm._element_type': 'way',
  'osm._element_id': 26836916,
  'osm._distance': 12.5
}
```

### Weather Example (US only):
```javascript
{
  'weather.temperature': 72,
  'weather.temperatureUnit': 'F',
  'weather.windSpeed': '10 mph',
  'weather.windDirection': 'SW',
  'weather.shortForecast': 'Partly Cloudy',
  'weather.detailedForecast': 'Partly cloudy with...',
  'weather.icon': 'https://api.weather.gov/icons/...',
  'weather.isDaytime': true,
  'weather.probabilityOfPrecipitation.value': 20
}
```

### Location Example:
```javascript
{
  'location.display_name': '123 Main St, San Francisco, CA, USA',
  'location.address.road': 'Main Street',
  'location.address.city': 'San Francisco',
  'location.address.state': 'California',
  'location.address.country': 'United States',
  'location.address.postcode': '94102',
  'location.type': 'building'
}
```

## 🐛 Troubleshooting

### "Provider not found" Error
**Solution:** Refresh the page. Providers initialize on startup.

### Weather Provider: "Location is outside US bounds"
**Solution:** Weather API only works for US coordinates. Try a US location or use other providers.

### OSM Tags: "No OSM elements found"
**Possible causes:**
1. Location is in the middle of nowhere (ocean, desert)
2. Search radius too small (default 50m)
3. No nearby OSM features

**Solution:** Try a more populated area or increase search radius (coming soon).

### "Cannot handle this location"
**Cause:** The provider validated the location and determined it can't fetch data
**Solution:** Try a different location or provider

## 💡 Pro Tips

1. **Start with "Fetch All"** - Gets data from all providers at once
2. **OSM Tags works anywhere** - Not limited to US like weather
3. **All attributes are dynamic** - No need to know field names in advance
4. **Attributes are merged** - Fetching from multiple providers combines all data
5. **Check the console** - Detailed logs show what's being fetched

## 🧪 Advanced Testing

### Test in Browser Console

After app loads, you can test providers manually:

```javascript
// Get the registry
const { getProviderRegistry } = await import('./services/AttributeProviderRegistry');
const registry = getProviderRegistry();

// See all providers
console.log(registry.getAvailableProviders());

// Test OSM provider directly
const osmProvider = registry.getProvider('osm-tags');
const testPlace = {
    id: 'test',
    name: 'Test',
    coordinates: [[-122.4862, 37.7694]], // Golden Gate Park
    attributes: {}
};
const result = await osmProvider.fetchAttributes(testPlace);
console.log('Result:', result);
```

### Check Provider Logs

Open browser console and look for:
```
✅ Attribute providers initialized and ready to use!
Weather provider registered
Geocoding provider registered
OSM Tags provider registered
```

## 📊 Expected Behavior

1. Click 🌐 button → Dropdown appears
2. Click provider → Button shows ⏳
3. Wait 1-5 seconds
4. Alert shows success message with count
5. Attributes section updates with new data
6. All attributes are prefixed (weather.*, osm.*, location.*)

## 🎉 Success Indicators

✅ Dropdown menu appears when clicking 🌐
✅ Loading indicator (⏳) shows during fetch
✅ Success alert with attribute count
✅ Attributes section populates with new keys
✅ No console errors
✅ Can fetch from multiple providers
✅ Attributes persist after fetch

## 🆘 Need Help?

Check:
1. Browser console for errors
2. Network tab for API requests
3. Console logs for provider initialization
4. Make sure you're in edit mode (sidebar visible)
5. Make sure you're testing on a place (not edge)

Enjoy testing! 🚀
