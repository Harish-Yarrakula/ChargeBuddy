# ChargeBuddy Backend

## Environment Variables

Create a `.env` file in the backend directory with:

```
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chargebuddy

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development
```

## Installation

```bash
cd backend
npm install
```

## Running the Server

Development (with auto-reload):
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)

### Stations
- `GET /api/stations` - Get all stations (with optional geospatial filters)
- `GET /api/stations/:stationId` - Get station details
- `POST /api/stations` - Add new station (requires auth)

### Bookings
- `POST /api/bookings` - Create new booking (requires auth)
- `GET /api/bookings` - Get user bookings (requires auth)
- `GET /api/bookings/:bookingId` - Get booking details (requires auth)
- `PUT /api/bookings/:bookingId/cancel` - Cancel booking (requires auth)

### Reviews
- `POST /api/reviews` - Add review (requires auth)
- `GET /api/reviews/station/:stationId` - Get station reviews

### Payments
- `POST /api/payments` - Process payment (requires auth)

## Database Schema

### User
- name: String
- email: String (unique)
- password: String (hashed)
- phone: String
- batteryPercentage: Number
- profileImage: String
- createdAt: Date
- updatedAt: Date

### Station
- name: String
- address: String
- latitude: Number
- longitude: Number
- totalPorts: Number
- availablePorts: Number
- chargingTypes: [String]
- rating: Number
- reviews: Number
- amenities: [String]
- pricePerUnit: Number
- operatingHours: String

### Booking
- userId: ObjectId (ref: User)
- stationId: ObjectId (ref: Station)
- stationName: String
- bookingDate: Date
- startTime: String
- endTime: String
- duration: Number
- chargingType: String
- estimatedCost: Number
- status: String (pending/confirmed/active/completed/cancelled)
- bookingReference: String
- paymentStatus: String (pending/completed/failed)

### Review
- userId: ObjectId (ref: User)
- stationId: ObjectId (ref: Station)
- rating: Number (1-5)
- comment: String
- cleanliness: Number
- speed: Number
- safety: Number

### Payment
- bookingId: ObjectId (ref: Booking)
- userId: ObjectId (ref: User)
- amount: Number
- paymentMethod: String (card/upi/wallet/bank)
- transactionId: String
- status: String (pending/completed/failed/refunded)
