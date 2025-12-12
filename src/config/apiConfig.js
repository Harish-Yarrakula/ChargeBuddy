/**
 * API Configuration File
 * Add your API keys here
 * 
 * IMPORTANT: Never commit actual API keys to version control
 * Use environment variables or secret management in production
 */

export const API_CONFIG = {
  // Backend API Base URL
  API_BASE_URL: 'http://192.168.1.100:5000', // Change to your backend URL
  
  // Google API Key (used for Maps, Places, and Directions)
  GOOGLE_API_KEY: 'AIzaSyCluWKZ0ox2u7EmHXoum28eGrmV9nYVsk0',
  
  // EV Charging API Key
  EV_CHARGING_API_KEY: 'YOUR_EV_CHARGING_API_KEY_HERE',
  
  // OpenChargeMap API (free, no key required but can add if needed)
  OPEN_CHARGE_MAP_API_KEY: '41d0cb16-593d-4f39-a761-040bda6e7882',
};

export default API_CONFIG;
