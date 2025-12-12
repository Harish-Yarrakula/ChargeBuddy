# ChargeBuddy Testing Guide

Complete guide to test all features of the ChargeBuddy application.

## Prerequisites

Before testing, ensure:
1. ✅ Node.js and npm installed
2. ✅ MongoDB running locally or MongoDB Atlas connection string ready
3. ✅ Backend server running on `http://localhost:5000`
4. ✅ Expo dev server running: `npx expo start`
5. ✅ Android emulator or iOS simulator open
6. ✅ API keys configured (optional for basic testing)

## Backend Testing

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```
Expected response: `{ "status": "Server is running" }`

### 2. User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "1234567890"
  }'
```
Expected: User created with token

### 3. User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```
Expected: JWT token in response (save this token for authenticated requests)

### 4. Get User Profile
```bash
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```
Expected: User data returned

### 5. Get All Stations
```bash
curl http://localhost:5000/api/stations
```
Expected: Array of charging stations

### 6. Get Station by ID
```bash
curl http://localhost:5000/api/stations/<STATION_ID>
```
Expected: Specific station details

### 7. Create Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "<STATION_ID>",
    "bookingDate": "2024-01-15",
    "startTime": "14:00",
    "endTime": "16:00"
  }'
```
Expected: Booking created with reference number

### 8. Get User Bookings
```bash
curl http://localhost:5000/api/bookings \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```
Expected: Array of user's bookings

### 9. Cancel Booking
```bash
curl -X PUT http://localhost:5000/api/bookings/<BOOKING_ID>/cancel \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```
Expected: Booking status changed to 'cancelled'

### 10. Add Review
```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "<STATION_ID>",
    "rating": 4.5,
    "comment": "Great charging station!",
    "cleanliness": 4,
    "speed": 5,
    "safety": 4
  }'
```
Expected: Review created and station rating updated

### 11. Get Station Reviews
```bash
curl http://localhost:5000/api/reviews/station/<STATION_ID>
```
Expected: Array of reviews for the station

## Frontend Testing

### 1. Authentication Flow

**Step 1: Test Registration**
- Open app on emulator/simulator
- Tap "Create Account" button
- Fill in:
  - Name: "Test User"
  - Email: "test@example.com"
  - Password: "Test123!"
  - Battery %: "45"
- Tap "Register"
- Expected: Navigate to main app after successful registration

**Step 2: Test Login**
- Exit app or force logout
- Fill in:
  - Email: "test@example.com"
  - Password: "Test123!"
- Tap "Login"
- Expected: Navigate to Nearby Stations tab

### 2. Nearby Stations Tab

**Test Features:**
1. **Location Permission**
   - App should request location access
   - Grant permission when prompted
   - Location marker should appear on map

2. **Station List**
   - Stations should load within 5 seconds
   - Each card shows: name, distance, ports, status
   - Distance should be calculated from user location

3. **Pull to Refresh**
   - Scroll to top and pull down
   - Station list should refresh

4. **Station Selection**
   - Tap on any station card
   - Should navigate to station details page

### 3. Maps Tab

**Test Features:**
1. **Map Display**
   - Map should render with user location (blue dot)
   - Multiple charging station markers should be visible

2. **Map Interactions**
   - Pinch to zoom in/out
   - Drag to pan around
   - Compass icon appears in top right

3. **Marker Interaction**
   - Tap on any marker
   - Station info card should appear at bottom
   - Shows station name and available ports

4. **Get Directions**
   - Tap "Get Directions" button on station card
   - Should show route distance and time
   - Note: Requires valid Google Directions API key

### 4. Station Details Page

**Test Features:**
1. **Station Information**
   - Station name and address visible at top
   - Stats grid shows ports, available, capacity
   - Charging details and amenities listed

2. **Rating and Reviews**
   - Current rating displayed
   - Reviews section shows recent reviews
   - Each review shows: rating, comment, author

3. **Pre-Booking**
   - Tap "Pre-Book Charging Slot"
   - Confirm booking
   - Should show booking reference (CBK-XXXXXX)
   - Booking added to user's bookings list

4. **Error Handling**
   - Tap back button to return to list
   - App should not crash if station data is missing

## Integration Testing

### Complete User Journey

**Scenario 1: Register and Book**
1. Launch app
2. Create new account with valid email
3. Accept location permission
4. Wait for stations to load
5. Tap first station
6. Review details
7. Tap "Pre-Book"
8. Confirm booking
9. Verify booking reference shown
10. Go back and verify station ports decreased

**Scenario 2: Login and View Bookings**
1. App startup - should check for existing token
2. If token exists, skip login and go to main app
3. If token expired/not found, show login
4. Login with registered credentials
5. View bookings (from previous scenario)
6. Cancel a booking
7. Verify ports increased at station

**Scenario 3: Maps and Directions**
1. Navigate to Maps tab
2. View markers on map
3. Tap a marker to see station info
4. Tap "Get Directions"
5. Verify route displays
6. Navigate back to list

## Database Testing

### 1. Check Inserted Data
```bash
# In MongoDB client (mongosh)
use chargebuddy
db.stations.find()
db.users.find()
db.bookings.find()
```

### 2. Verify Relationships
```bash
# Check if booking references correct station and user
db.bookings.findOne().station
db.bookings.findOne().user
```

### 3. Check Calculated Fields
```bash
# Verify booking reference format
db.bookings.findOne().bookingReference
# Expected: CBK + 9 alphanumeric chars

# Check available ports decreased after booking
db.stations.findOne({ name: "Tesla Supercharger - Downtown" }).availablePorts
```

## Performance Testing

### 1. Load Times

**Expected Times:**
- App startup: < 3 seconds
- Station list load: < 5 seconds
- Map render: < 4 seconds
- Station details: < 2 seconds
- Booking creation: < 3 seconds

### 2. Memory Usage

Test with React Native debugger:
- Initial app load: ~50-80 MB
- With map open: ~100-150 MB
- After 10 bookings: ~80-120 MB

### 3. Network Performance

Monitor in Network tab:
- Auth requests: ~100-200ms
- Station fetch: ~200-500ms
- Map API calls: ~300-600ms
- Booking creation: ~150-300ms

## Error Handling Testing

### 1. Network Errors

**Test Offline Mode:**
```bash
# Stop backend server
curl http://localhost:5000/api/health
# Should timeout/fail
```
App should:
- Show "Connection Error" message
- Provide retry button
- Not crash

### 2. Invalid Credentials

**Test Wrong Password:**
- Email: test@example.com
- Password: wrongpassword
- Expected: "Invalid email or password" error

### 3. Expired Token

**Test Token Expiration:**
- Edit AsyncStorage to change token to invalid value
- Try to access protected endpoint
- Should redirect to login

### 4. Missing Location Permission

**Test Location Denial:**
- Deny location permission
- Should show "Location access required" message
- Provide option to enable in settings

## Security Testing

### 1. Token Validation

```bash
# Try with invalid token
curl http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer invalid_token"
```
Expected: 401 Unauthorized

### 2. Endpoint Authorization

```bash
# Try to access protected endpoint without token
curl http://localhost:5000/api/bookings
```
Expected: 401 Unauthorized

### 3. User Isolation

```bash
# Login as user1, get token1
# Login as user2, get token2
# Use token1 to try accessing user2's data
curl http://localhost:5000/api/bookings \
  -H "Authorization: Bearer token1_for_user2"
```
Expected: Should only see user1's bookings

## Troubleshooting Tests

### Issue: Backend not responding
```bash
# Check if server is running
curl http://localhost:5000/api/health

# Check logs for errors
# Verify MongoDB connection in logs
```

### Issue: App crashes on startup
```bash
# Check Metro bundler for errors
npx expo start

# Look for red error screens
# Check console logs
```

### Issue: Maps not showing
```bash
# Verify PROVIDER_GOOGLE in MapsScreen.jsx
# Check if Google Maps API key is valid
# Test without API key - should still show map (just without real tiles)
```

### Issue: Bookings not saving
```bash
# Check backend logs for database errors
# Verify MongoDB is running
# Check if user has valid token
# Verify station exists with valid ID
```

## Test Checklist

### Backend (Express API)
- [ ] Health endpoint responds
- [ ] User registration works
- [ ] User login returns token
- [ ] Protected endpoints require token
- [ ] Station list returns data
- [ ] Booking creation works
- [ ] Booking cancellation updates ports
- [ ] Reviews save correctly
- [ ] Error handling shows proper messages

### Frontend (React Native)
- [ ] App starts without crashes
- [ ] Login/Register forms work
- [ ] Station list loads
- [ ] Map displays correctly
- [ ] Navigation between tabs works
- [ ] Station details page shows info
- [ ] Pre-booking completes successfully
- [ ] Back navigation works
- [ ] Pull-to-refresh works
- [ ] Location permission handled correctly

### Integration
- [ ] Complete registration → login → book flow works
- [ ] Token persists across app restarts
- [ ] Bookings appear in list after creation
- [ ] Database reflects all changes
- [ ] Error states handled gracefully

### Performance
- [ ] App startup < 5 seconds
- [ ] Station list loads < 5 seconds
- [ ] No memory leaks after operations
- [ ] Network requests complete timely

### Security
- [ ] Invalid tokens rejected
- [ ] Users can't access others' data
- [ ] Passwords hashed in database
- [ ] Protected routes require authentication

## Running Test Suite

```bash
# Install testing dependencies
cd backend
npm install --save-dev jest supertest

# Run tests
npm test

# With coverage
npm test -- --coverage
```

## Continuous Testing

Monitor these during development:
- Console logs for errors
- Network tab for API calls
- Performance tab for memory usage
- Device logs for crashes

---

**Last Updated:** January 2024
**Test Coverage:** Frontend, Backend, Integration, Performance, Security
**Status:** Ready for production testing
