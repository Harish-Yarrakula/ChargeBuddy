# ChargeBuddy - API Configuration Guide

This guide explains how to set up Google Maps API keys and other required APIs for ChargeBuddy.

## Required APIs

### 1. Google Maps API
**Required for:**
- Map display in the Maps tab
- Location visualization
- Current location marker

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the "Maps SDK for Android" and "Maps SDK for iOS"
4. Create an API key (Credentials → Create Credentials → API Key)
5. Add the key to `src/config/apiConfig.js`

### 2. Google Directions API
**Required for:**
- Route planning between user and charging station
- Distance and duration calculation
- Navigation features

**Setup Steps:**
1. In the same Google Cloud Console project
2. Enable "Directions API"
3. Use the same API key or create a separate one
4. Add the key to `src/config/apiConfig.js`

### 3. Google Places API
**Required for:**
- Search for nearby amenities (restaurants, parking)
- Place details and ratings
- Location search and autocomplete

**Setup Steps:**
1. In Google Cloud Console
2. Enable "Places API"
3. Create or use existing API key
4. Add the key to `src/config/apiConfig.js`

### 4. OpenChargeMap API (Already Configured)
**Used for:**
- Fetching EV charging station data
- No API key required (but included if you have one)

## Configuration Files

### `src/config/apiConfig.js`
Main configuration file with all API keys:

```javascript
export const API_CONFIG = {
  GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
  GOOGLE_DIRECTIONS_API_KEY: 'YOUR_GOOGLE_DIRECTIONS_API_KEY_HERE',
  GOOGLE_PLACES_API_KEY: 'YOUR_GOOGLE_PLACES_API_KEY_HERE',
  OPEN_CHARGE_MAP_API_KEY: '41d0cb16-593d-4f39-a761-040bda6e7882',
};
```

### `src/config/apiService.js`
Utility functions for API calls:
- `getDirections()` - Get route information
- `searchNearbyPlaces()` - Find amenities nearby
- `getPlaceDetails()` - Get detailed place information
- `getGeocodeFromCoordinates()` - Convert coordinates to address
- `fetchChargingStations()` - Get charging stations

### `.env.example`
Template for environment variables (create `.env` based on this)

## Implementation Details

### Maps Screen
- Displays map with charging stations
- Shows user's current location
- Click on station marker to see options
- Directions button calculates route using Google Directions API

### Station Details Screen
- Shows all station information
- Pre-book charging slot
- Navigate using Google Directions API
- View nearby amenities using Google Places API

### Main Screen (List View)
- Lists charging stations with distance
- Click on station to view details
- Uses OpenChargeMap API for station data

## Testing Without API Keys

The app has fallback functionality:
- Maps will show but may not display correctly without Google Maps API key
- Direction features will show a notice to add API key
- Station data will still load from OpenChargeMap (free service)

## Security Best Practices

1. **Never commit actual API keys** to version control
2. Use `.env` files for local development
3. Set API key restrictions in Google Cloud Console:
   - Android app restrictions
   - iOS app restrictions
   - HTTP referrer restrictions
   - IP address restrictions (if applicable)
4. Regularly rotate your API keys
5. Monitor API usage in Google Cloud Console to detect unusual activity

## API Usage Costs

- **Google Maps Platform**: Usage-based pricing (Maps, Directions, Places)
- **OpenChargeMap**: Free with optional paid plans

Monitor your usage at [Google Cloud Console Billing](https://console.cloud.google.com/billing/).

## Troubleshooting

### "Invalid API Key" Error
- Check that key is added to `apiConfig.js`
- Verify API is enabled in Google Cloud Console
- Check API restrictions in Console

### Map Not Displaying
- Ensure Google Maps API is enabled
- Check for JavaScript errors in console
- Verify API key is correct

### Directions Not Working
- Ensure Google Directions API is enabled
- Check if routes exist between coordinates
- Verify API key has Directions API enabled

### Places Search Not Working
- Ensure Google Places API is enabled
- Check API key restrictions
- Verify location coordinates are valid

## Support

For more information:
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Maps Platform Documentation](https://developers.google.com/maps)
- [OpenChargeMap Documentation](https://openchargemap.org/site/develop/api)
