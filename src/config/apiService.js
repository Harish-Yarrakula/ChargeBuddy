/**
 * API Service Functions
 * Handles all API calls with Google Maps, Places, Directions, and Charging Station data
 */

import { API_CONFIG } from './apiConfig';

/**
 * Get directions between two coordinates using Google Directions API
 * @param {number} originLat - Origin latitude
 * @param {number} originLng - Origin longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @returns {Promise} - Distance and duration information
 */
export const getDirections = async (originLat, originLng, destLat, destLng) => {
    try {
        const origin = `${originLat},${originLng}`;
        const destination = `${destLat},${destLng}`;
        
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${API_CONFIG.GOOGLE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK') {
            const route = data.routes[0];
            return {
                distance: route.legs[0].distance.text,
                duration: route.legs[0].duration.text,
                polyline: route.overview_polyline.points,
                success: true
            };
        } else {
            console.error('Directions API Error:', data.status);
            return { success: false, error: data.status };
        }
    } catch (error) {
        console.error('Error fetching directions:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Search for places nearby using Google Places API
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @param {string} keyword - Search keyword (e.g., "restaurant", "parking")
 * @returns {Promise} - List of nearby places
 */
export const searchNearbyPlaces = async (latitude, longitude, keyword) => {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1500&keyword=${keyword}&key=${API_CONFIG.GOOGLE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK') {
            return {
                places: data.results,
                success: true
            };
        } else {
            console.error('Places API Error:', data.status);
            return { success: false, error: data.status };
        }
    } catch (error) {
        console.error('Error searching places:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get place details using Google Places API
 * @param {string} placeId - Google Place ID
 * @returns {Promise} - Detailed place information
 */
export const getPlaceDetails = async (placeId) => {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_CONFIG.GOOGLE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK') {
            return {
                details: data.result,
                success: true
            };
        } else {
            console.error('Place Details API Error:', data.status);
            return { success: false, error: data.status };
        }
    } catch (error) {
        console.error('Error fetching place details:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get geocoding information for coordinates
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise} - Address information
 */
export const getGeocodeFromCoordinates = async (latitude, longitude) => {
    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_CONFIG.GOOGLE_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK') {
            return {
                address: data.results[0].formatted_address,
                success: true
            };
        } else {
            console.error('Geocoding API Error:', data.status);
            return { success: false, error: data.status };
        }
    } catch (error) {
        console.error('Error fetching geocoding:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Fetch charging stations from OpenChargeMap API
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @param {number} distance - Search radius in KM
 * @param {number} maxResults - Maximum results to return
 * @returns {Promise} - List of charging stations
 */
export const fetchChargingStations = async (latitude, longitude, distance = 25, maxResults = 50) => {
    try {
        const url = `https://api.openchargemap.io/v3/poi/?output=json&latitude=${latitude}&longitude=${longitude}&distance=${distance}&distanceunit=KM&maxresults=${maxResults}&key=${API_CONFIG.OPEN_CHARGE_MAP_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
            return {
                stations: data,
                success: true
            };
        } else {
            console.error('Charging Stations API Error');
            return { success: false, error: 'Invalid response' };
        }
    } catch (error) {
        console.error('Error fetching charging stations:', error);
        return { success: false, error: error.message };
    }
};

export default {
    getDirections,
    searchNearbyPlaces,
    getPlaceDetails,
    getGeocodeFromCoordinates,
    fetchChargingStations
};
