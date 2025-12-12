# ChargeBuddy Developer Cheat Sheet

Quick reference for common tasks and commands.

## 🚀 Common Commands

### Frontend
```bash
# Start development server
npx expo start

# Clear cache and rebuild
npx expo start -c

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios

# Build production APK
eas build --platform android --type apk

# Build production IPA
eas build --platform ios

# Lint code
npm run lint

# Format code
npm run format
```

### Backend
```bash
# Start development server
npm start

# Start with auto-reload (nodemon)
npm run dev

# Initialize database with sample data
cd backend && node init-db.js

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Lint code
npm run lint
```

## 🔑 API Quick Reference

### Create Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "bookingDate": "2024-01-20",
    "startTime": "14:00",
    "endTime": "16:00"
  }'
```

### Get Stations
```bash
curl http://localhost:5000/api/stations
```

### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Add Review
```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "rating": 4.5,
    "comment": "Great station!",
    "cleanliness": 4,
    "speed": 5,
    "safety": 4
  }'
```

## 📁 File Locations

| File | Purpose | Location |
|------|---------|----------|
| API Configuration | API keys and base URL | `src/config/apiConfig.js` |
| API Service | Reusable API functions | `src/config/apiService.js` |
| Login Screen | Auth UI | `src/LoginScreen.jsx` |
| Main Screen | Station list | `src/screens/MainScreen.jsx` |
| Maps Screen | Interactive map | `src/screens/MapsScreen.jsx` |
| Station Details | Detailed station info | `src/screens/EVStationScreen.jsx` |
| Backend Server | Express API | `backend/server.js` |
| Backend Config | .env template | `backend/.env.example` |
| Sample Data | DB initialization | `backend/init-db.js` |

## 🔧 Configuration Files

### Frontend Config (`src/config/apiConfig.js`)
```javascript
export const API_CONFIG = {
  API_BASE_URL: 'http://localhost:5000',
  GOOGLE_MAPS_API_KEY: 'YOUR_KEY',
  OPEN_CHARGE_MAP_API_KEY: '41d0cb16-593d-4f39-a761-040bda6e7882'
};
```

### Backend Config (`backend/.env`)
```env
MONGODB_URI=mongodb://localhost:27017/chargebuddy
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=5000
```

## 🗂️ Component Structure

### Screen Components
- `LoginScreen.jsx` - Authentication
- `MainScreen.jsx` - Nearby stations list
- `MapsScreen.jsx` - Interactive map
- `EVStationScreen.jsx` - Station details

### Service Layer
- `apiService.js` - API calls
- `apiConfig.js` - Configuration

## 📊 Database Models

### User
```javascript
const userSchema = {
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  batteryPercentage: Number
};
```

### Station
```javascript
const stationSchema = {
  name: String,
  address: String,
  coordinates: { lat: Number, lng: Number },
  totalPorts: Number,
  availablePorts: Number,
  chargingTypes: [String],
  rating: Number,
  amenities: [String],
  pricePerUnit: Number
};
```

### Booking
```javascript
const bookingSchema = {
  userId: ObjectId,
  stationId: ObjectId,
  bookingDate: Date,
  startTime: String,
  endTime: String,
  status: String, // pending, confirmed, active, completed, cancelled
  bookingReference: String
};
```

## 🔐 Authentication Flow

```
1. User registers/logs in
   ↓
2. Backend validates credentials
   ↓
3. JWT token created (7-day expiry)
   ↓
4. Token stored in AsyncStorage
   ↓
5. Token sent in Authorization header for protected routes
   ↓
6. Backend verifies token with middleware
```

## 🎨 Styling

### Common Colors
```javascript
const colors = {
  primary: '#007AFF',      // Blue
  success: '#34C759',      // Green
  danger: '#FF3B30',       // Red
  warning: '#FF9500',      // Orange
  background: '#F2F2F7',   // Light gray
  text: '#000000',         // Black
  textSecondary: '#666666' // Gray
};
```

### Common Styles
```javascript
const commonStyles = {
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  button: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center'
  }
};
```

## 🧪 Testing URLs

### Local Development
- **Frontend:** http://localhost:8081 (Expo)
- **Backend:** http://localhost:5000
- **MongoDB:** mongodb://localhost:27017

### Production
- **Frontend:** https://chargebuddy-app.com
- **Backend:** https://api.chargebuddy-app.com
- **Database:** MongoDB Atlas

## 📱 Device Testing

### Android Emulator
```bash
# List emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_5

# In Expo: Press 'a'
```

### iOS Simulator
```bash
# List simulators
xcrun simctl list devices

# Start simulator
open -a Simulator

# In Expo: Press 'i'
```

## 🐛 Debug Mode

### Frontend Debugging
```bash
# Enable React Native Debugger
# Press 'd' in Expo

# View network requests
# Enable Network tab in debugger

# View Redux/State
# Install Redux DevTools
```

### Backend Debugging
```bash
# Add console.logs
console.log('Variable:', variable);

# Use debugger
node --inspect server.js

# View MongoDB operations
// In server.js
mongoose.set('debug', true);
```

## 📦 Add Dependencies

### Frontend
```bash
npm install package-name
npx expo install expo-compatible-package
```

### Backend
```bash
cd backend
npm install package-name
```

## 🚀 Hot Reload vs Full Reload

### Hot Reload (Faster)
- Saves file automatically
- App updates without restart
- State often preserved
- Press 'R' in Expo

### Full Reload (Complete)
- Clears all state
- Rebuilds entire bundle
- Slower but guaranteed refresh
- Press 'R' twice or restart Expo

## 🔗 Important Links

| Link | Purpose |
|------|---------|
| http://localhost:5000/api/health | API health check |
| http://localhost:8081 | Expo frontend |
| https://www.mongodb.com/cloud/atlas | MongoDB cloud |
| https://console.cloud.google.com | Google Cloud Console |
| https://railway.app | Railway deployment |
| https://www.heroku.com | Heroku deployment |

## 📚 Documentation Files

- `README_MAIN.md` - Project overview
- `QUICK_START.md` - 5-minute setup
- `FULL_SETUP_GUIDE.md` - Complete setup
- `API_SETUP_GUIDE.md` - API configuration
- `TESTING_GUIDE.md` - Testing procedures
- `DEPLOYMENT_GUIDE.md` - Production deployment
- `backend/README.md` - API documentation

## 💾 Git Commands

```bash
# Create feature branch
git checkout -b feature/feature-name

# Commit changes
git commit -m "Feat: Add feature description"

# Push to remote
git push origin feature/feature-name

# Create pull request
# Go to GitHub and create PR

# Merge to main
git checkout main
git merge feature/feature-name

# Deploy to production
git tag v1.0.0
git push --tags
```

## ⚠️ Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgot to install dependencies | `npm install && cd backend && npm install` |
| API key not in .env | Add to .env file and restart backend |
| Port 5000 already in use | Kill process: `lsof -i :5000 \| kill -9 <PID>` |
| MongoDB not running | Start: `mongosh` or MongoDB Compass |
| Token expired | Re-login to get new token |
| CORS errors | Add frontend URL to CORS whitelist |
| Maps not showing | Verify PROVIDER_GOOGLE in MapsScreen |
| Station data not loading | Check backend is running and MongoDB connected |
| Build fails | Clear cache: `npx expo start -c` |

## 🔄 Workflow

### Feature Development
```
1. Create feature branch
2. Make changes
3. Test locally
4. Commit with clear message
5. Push to GitHub
6. Create Pull Request
7. Code review
8. Merge to main
9. Deploy to staging
10. Test on staging
11. Deploy to production
```

### Bug Fixing
```
1. Create hotfix branch
2. Reproduce bug locally
3. Fix issue
4. Test thoroughly
5. Commit and push
6. Create urgent PR
7. Fast-track merge
8. Deploy immediately
```

## 📊 Performance Tips

### Frontend
- Use React.memo() for components that don't change often
- Lazy load heavy components
- Optimize images (use WebP format)
- Use FlatList instead of ScrollView for long lists

### Backend
- Index frequently queried fields in MongoDB
- Use pagination for large datasets
- Implement caching for static data
- Use connection pooling for database

## 🎓 Learning Resources

- [React Native Docs](https://reactnative.dev)
- [Expo Guide](https://docs.expo.dev)
- [MongoDB Docs](https://docs.mongodb.com)
- [Express.js Guide](https://expressjs.com)
- [JWT Authentication](https://jwt.io)

## 🆘 Emergency Contacts

- **Tech Lead:** (Add contact)
- **DevOps:** (Add contact)
- **Database Admin:** (Add contact)

## 📝 Notes

- Always use HTTPS in production
- Rotate secrets regularly
- Keep dependencies updated
- Backup database regularly
- Monitor error logs daily
- Test before deploying

---

**Version:** 1.0  
**Last Updated:** January 2024  
**Status:** Ready for Reference
