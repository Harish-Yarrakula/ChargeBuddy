# ChargeBuddy - Complete Setup Guide

## Project Structure

```
chargebuddy/
├── app/                    # Expo Router app structure
│   ├── (tabs)/            # Tab navigation group
│   │   ├── index.jsx      # Nearby Stations
│   │   ├── maps.jsx       # Maps view
│   │   └── _layout.tsx    # Tab configuration
│   ├── index.jsx          # Login screen
│   └── _layout.tsx        # Root layout
├── src/
│   ├── LoginScreen.jsx    # Authentication
│   ├── config/
│   │   ├── apiConfig.js   # API configuration
│   │   └── apiService.js  # API utilities
│   └── screens/
│       ├── MainScreen.jsx       # Charging stations list
│       ├── MapsScreen.jsx       # Map view
│       └── EVStationScreen.jsx  # Station details
├── backend/               # Node.js/Express backend
│   ├── server.js         # Main server file
│   ├── package.json
│   ├── .env.example
│   └── README.md
└── package.json           # Frontend dependencies
```

## Frontend Setup

### 1. Install Dependencies

```bash
# From root directory
npm install

# Install AsyncStorage for token storage
npx expo install @react-native-async-storage/async-storage

# Install required packages
npm install expo-router expo-location react-native-maps
npm install @expo/vector-icons
npm install react-native-element-dropdown
```

### 2. Update Configuration

Edit `src/config/apiConfig.js`:
```javascript
API_BASE_URL: 'http://YOUR_BACKEND_IP:5000'  // Change to your backend URL
```

For local development:
- Android: Use your machine's IP (e.g., 192.168.1.100)
- iOS: Use localhost or your machine IP

### 3. Add Permissions

The app.json already includes location permissions. For production, update:

```json
{
  "android": {
    "permissions": [
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.INTERNET"
    ]
  }
}
```

### 4. Run Frontend

```bash
npx expo start
```

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. MongoDB Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB community edition
# Then start MongoDB service
mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Copy to `.env` file

### 3. Configure Environment

Create `backend/.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chargebuddy
JWT_SECRET=your_very_secure_jwt_secret_key_here
PORT=5000
NODE_ENV=development
```

### 4. Run Backend

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

Server will run on `http://localhost:5000`

## Feature Implementation

### Authentication Flow

1. **Register**
   - User enters name, email, password
   - Backend validates and hashes password
   - JWT token generated and stored locally
   - User navigated to tabs

2. **Login**
   - User enters email and password
   - Backend validates credentials
   - JWT token stored in AsyncStorage
   - User navigated to tabs

### Charging Station Flow

1. **List Stations (MainScreen)**
   - Fetch user location
   - Call `/api/stations` endpoint
   - Display stations in list with distance
   - Tap to view details

2. **Map View (MapsScreen)**
   - Display user location
   - Show all stations with markers
   - Click marker to see quick info
   - Get directions button

3. **Station Details (EVStationScreen)**
   - Display all station info
   - Show amenities
   - Display ratings and reviews
   - Pre-book charging slot

### Booking Flow

1. **Create Booking**
   - User selects time slot
   - Call `POST /api/bookings`
   - Generate booking reference
   - Show confirmation

2. **Payment**
   - Process payment via `POST /api/payments`
   - Update booking status to confirmed
   - Send confirmation

3. **View Bookings**
   - Fetch user bookings from `GET /api/bookings`
   - Show booking status
   - Allow cancellation

## API Integration Examples

### Register User
```javascript
const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password })
});
```

### Fetch Stations
```javascript
const response = await fetch(
  `${API_BASE_URL}/api/stations?latitude=${lat}&longitude=${lng}&distance=25`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
```

### Create Booking
```javascript
const response = await fetch(`${API_BASE_URL}/api/bookings`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    stationId, bookingDate, startTime, endTime, chargingType
  })
});
```

## Testing Endpoints

Use Postman or curl to test:

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"123456"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"123456"}'
```

### Get Stations
```bash
curl http://localhost:5000/api/stations
```

## Deployment

### Frontend Deployment

Deploy with Expo:
```bash
eas build --platform ios
eas build --platform android
eas submit
```

### Backend Deployment

Options:
- Heroku
- AWS EC2
- DigitalOcean
- Render
- Railway

Example Heroku:
```bash
heroku login
heroku create chargebuddy-api
git push heroku main
heroku config:set MONGODB_URI=your_uri
```

## Troubleshooting

### "Network Error" on Login
- Check backend is running: `http://localhost:5000/api/health`
- Verify API_BASE_URL in apiConfig.js
- Check firewall settings

### Map Not Displaying
- Add Google Maps API key to apiConfig.js
- Verify API is enabled in Google Cloud Console

### Database Connection Error
- Verify MongoDB is running
- Check MONGODB_URI in .env
- For Atlas: Check IP whitelist

### Token Expiration
- Token expires in 7 days
- User needs to login again
- Implement token refresh (optional)

## Security Considerations

1. **Never commit `.env` files**
2. **Use HTTPS in production**
3. **Implement rate limiting**
4. **Validate all inputs**
5. **Use environment variables for secrets**
6. **Implement payment gateway security**
7. **Hash passwords with bcrypt**
8. **Use JWT with expiration**

## Next Steps

1. Add payment integration (Stripe/Razorpay)
2. Implement email notifications
3. Add real-time booking status updates (WebSocket)
4. Add review and rating system
5. Implement user profile management
6. Add booking history
7. Implement wallet system
8. Add push notifications

## Support & Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [JWT Authentication](https://jwt.io/)
