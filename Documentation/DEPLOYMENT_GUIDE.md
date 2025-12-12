# ChargeBuddy Deployment Guide

Complete guide to deploy ChargeBuddy to production environments.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No console errors or warnings
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compilation successful
- [ ] No unused imports or variables
- [ ] Code review completed

### Security
- [ ] All sensitive data in environment variables
- [ ] No hardcoded API keys or tokens
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] CORS configured for production domain
- [ ] HTTPS enabled for all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] Rate limiting configured

### Performance
- [ ] Database indexes optimized
- [ ] API response time < 500ms
- [ ] Frontend bundle size acceptable
- [ ] Images optimized and compressed
- [ ] Caching strategy implemented
- [ ] CDN configured (if applicable)

### Documentation
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Setup instructions updated
- [ ] Deployment steps documented
- [ ] Rollback procedure documented

---

## Backend Deployment

### Option 1: Heroku (Recommended for Beginners)

#### Prerequisites
- Heroku account (free tier available)
- Heroku CLI installed
- Git repository initialized

#### Steps

**1. Prepare Backend**
```bash
cd backend

# Create Procfile
echo "web: node server.js" > Procfile

# Create .gitignore if not exists
echo "node_modules
.env
.DS_Store" > .gitignore

# Initialize git (if not done)
git init
git add .
git commit -m "Initial backend commit"
```

**2. Deploy to Heroku**
```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create chargebuddy-api

# Set environment variables
heroku config:set JWT_SECRET="your-strong-secret-key-32-chars-min"
heroku config:set NODE_ENV="production"
heroku config:set MONGODB_URI="your-mongodb-atlas-uri"
heroku config:set FRONTEND_URL="https://chargebuddy-app.com"

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

**3. Verify Deployment**
```bash
# Get app URL
heroku open

# Test health endpoint
curl https://chargebuddy-api.herokuapp.com/api/health
```

### Option 2: Railway (Modern Alternative)

**1. Connect Repository**
```bash
# Push code to GitHub
git push origin main
```

**2. Deploy via Railway Dashboard**
- Go to railway.app
- Connect GitHub account
- Select chargebuddy repository
- Railway auto-detects Node.js app
- Set environment variables in dashboard
- Deploy

**3. Configure Domain**
- Railway provides .railway.app domain
- Add custom domain in settings

### Option 3: DigitalOcean App Platform

**1. Connect Repository**
```bash
git push origin main
```

**2. Deploy via Dashboard**
- Create new app on DigitalOcean
- Connect GitHub repository
- Select Node.js buildpack
- Set environment variables
- Deploy

**3. Database Setup**
- Create managed PostgreSQL or MongoDB
- Use connection string in environment variable

### Option 4: AWS EC2 (Full Control)

**1. Launch EC2 Instance**
```bash
# Ubuntu 22.04 LTS recommended
# t2.micro or t2.small for starter

# Connect via SSH
ssh -i key.pem ubuntu@your-ec2-ip
```

**2. Setup Node.js**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

**3. Deploy Application**
```bash
# Clone repository
git clone your-repo-url
cd chargebuddy/backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=5000
FRONTEND_URL=your-frontend-url
EOF

# Start with PM2
pm2 start server.js --name "chargebuddy-api"
pm2 save
pm2 startup
```

**4. Setup Nginx Reverse Proxy**
```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/chargebuddy

# Add this config:
# server {
#     listen 80;
#     server_name your-domain.com;
#     
#     location / {
#         proxy_pass http://localhost:5000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_cache_bypass $http_upgrade;
#     }
# }

# Enable site
sudo ln -s /etc/nginx/sites-available/chargebuddy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**5. SSL Certificate (Let's Encrypt)**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## Frontend Deployment

### Option 1: Expo Application Services (EAS)

**Prerequisites**
```bash
npm install -g eas-cli
```

**Build for Production**
```bash
cd chargebuddy

# Create EAS project
eas build --platform android --auto-submit
# or
eas build --platform ios --auto-submit

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Option 2: Google Play Store (Android)

**1. Generate Signed APK**
```bash
# Generate keystore
keytool -genkey -v -keystore chargebuddy.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias chargebuddy_key

# Add to app.json:
# "android": {
#   "package": "com.chargebuddy.app",
#   "versionCode": 1,
#   "permissions": ["ACCESS_FINE_LOCATION", "CAMERA", ...],
#   "keystore": "chargebuddy.keystore",
#   "keystorePassword": "your-password",
#   "keyAlias": "chargebuddy_key",
#   "keyPassword": "your-password"
# }

# Build APK
eas build --platform android --type apk
```

**2. Create Play Store Account**
- Register Google Play Developer account ($25 one-time)
- Create app listing
- Complete app info and screenshots

**3. Upload APK**
- Go to Play Console
- Create release
- Upload signed APK
- Add release notes
- Submit for review (1-3 hours typically)

### Option 3: Apple App Store (iOS)

**Prerequisites**
- Apple Developer account ($99/year)
- Mac with Xcode

**1. Generate Build**
```bash
# Add to app.json:
# "ios": {
#   "bundleIdentifier": "com.chargebuddy.app",
#   "buildNumber": "1"
# }

eas build --platform ios
```

**2. Create App Store Listing**
- Go to App Store Connect
- Create new app
- Fill app information

**3. Upload Build**
- Download build from EAS
- Upload using Transporter or Xcode
- Submit for review (1-3 days typically)

### Option 4: Web Deployment

**Build Web Version**
```bash
# Install web support
npx expo install expo-web

# Build web
npx expo export:web

# Deploy to Vercel
npm install -g vercel
vercel deploy ./web-build

# Or deploy to Netlify
npm run build
# Upload ./web-build to Netlify
```

---

## Database Setup

### MongoDB Atlas (Cloud - Recommended)

**1. Create Account**
- Go to https://www.mongodb.com/cloud/atlas
- Sign up for free account

**2. Create Cluster**
- Click "Create Database"
- Choose Free tier
- Select region (US-EAST for lowest latency)
- Click "Create"

**3. Create Database User**
- Go to Database Access
- Add new database user
- Username: `chargebuddy_user`
- Generate strong password
- Add to whitelist

**4. Get Connection String**
- Go to Databases
- Click "Connect"
- Choose "Connect your application"
- Copy connection string
- Add to backend `.env`:
```
MONGODB_URI=mongodb+srv://chargebuddy_user:password@cluster0.xxxxx.mongodb.net/chargebuddy?retryWrites=true&w=majority
```

**5. Create Collections**
```bash
# Using MongoDB Compass or Atlas UI
# Create these collections:
- stations
- users
- bookings
- reviews
- payments
```

### PostgreSQL Option

```bash
# Ubuntu setup
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb chargebuddy
sudo -u postgres createuser chargebuddy_user
sudo -u postgres psql -c "ALTER USER chargebuddy_user PASSWORD 'strong_password';"

# Connection string
postgresql://chargebuddy_user:password@localhost:5432/chargebuddy
```

---

## Environment Configuration

### Backend `.env` (Production)

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/chargebuddy?retryWrites=true&w=majority

# Security
JWT_SECRET=your-super-strong-secret-key-minimum-32-characters-long
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=https://chargebuddy-app.com
ALLOWED_ORIGINS=https://chargebuddy-app.com,https://www.chargebuddy-app.com

# APIs (Optional)
GOOGLE_MAPS_API_KEY=your-key
STRIPE_SECRET_KEY=your-key
STRIPE_PUBLISHABLE_KEY=your-key

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/chargebuddy/server.log
```

### Frontend `.env` (Production)

```env
EXPO_PUBLIC_API_BASE_URL=https://api.chargebuddy-app.com
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-key
EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY=your-key
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your-key
EXPO_PUBLIC_OPEN_CHARGE_MAP_API_KEY=41d0cb16-593d-4f39-a761-040bda6e7882
```

---

## CI/CD Pipeline

### GitHub Actions Setup

**Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy ChargeBuddy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm install
          cd backend && npm install && cd ..
      
      - name: Run tests
        run: npm test
      
      - name: Lint code
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.13
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: chargebuddy-api
          heroku_email: ${{secrets.HEROKU_EMAIL}}
          appdir: backend
```

### Setup GitHub Secrets
```bash
# In GitHub Settings > Secrets:
HEROKU_API_KEY=your-heroku-api-key
HEROKU_EMAIL=your-email@example.com
```

---

## Monitoring & Logging

### Application Monitoring

**Setup with PM2 (if using EC2)**
```bash
# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 install pm2-auto-pull

# View logs
pm2 logs chargebuddy-api

# Monitor processes
pm2 monit
```

### Error Tracking with Sentry

**Backend Integration**
```bash
npm install @sentry/node

# In server.js
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production"
});

app.use(Sentry.Handlers.errorHandler());
```

### Performance Monitoring

**Setup New Relic**
```bash
npm install newrelic

# In server.js (first line)
require('newrelic');

# newrelic.js
exports.config = {
  app_name: ['ChargeBuddy API'],
  license_key: 'your-license-key'
};
```

### Logging Best Practices

```javascript
// Good logging setup
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err),
  debug: (msg) => console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`)
};

// Use in routes
logger.info(`User login: ${email}`);
logger.error(`Database error: `, err);
```

---

## Troubleshooting

### Backend Issues

**Problem: API returns 502 Bad Gateway**
```bash
# Check if backend is running
curl https://api.chargebuddy-app.com/api/health

# Check logs
pm2 logs chargebuddy-api
heroku logs --tail

# Restart backend
pm2 restart chargebuddy-api
# or
heroku restart
```

**Problem: Database connection timeout**
- Verify MongoDB URI in `.env`
- Check IP whitelist in MongoDB Atlas
- Ensure credentials are correct
- Test connection locally first

**Problem: CORS errors from frontend**
- Add frontend URL to `ALLOWED_ORIGINS` in `.env`
- Verify CORS middleware is enabled
- Check browser console for actual error

### Frontend Issues

**Problem: App crashes on startup**
- Check Metro bundler for compilation errors
- Clear cache: `npm cache clean --force`
- Rebuild: `npx expo start -c`

**Problem: Can't connect to backend**
- Verify API_BASE_URL in `.env`
- Check backend is running and accessible
- Verify network connectivity
- Check CORS settings

**Problem: Maps not showing**
- Verify Google Maps API key
- Check API key restrictions
- Test API key in browser

### Database Issues

**Problem: MongoDB connection refused**
```bash
# Check MongoDB is running
mongosh --ping

# Restart MongoDB
sudo systemctl restart mongodb
```

**Problem: Disk space full on database**
- Archive old bookings
- Delete test data
- Upgrade MongoDB tier
- Optimize indexes

---

## Rollback Procedure

### Rollback Backend (Heroku)
```bash
# View releases
heroku releases

# Rollback to previous version
heroku rollback
```

### Rollback Backend (AWS EC2)
```bash
# Stop current version
pm2 stop chargebuddy-api

# Restore previous code
git checkout previous-commit-hash

# Restart
pm2 start server.js --name "chargebuddy-api"
```

### Rollback Frontend (App Stores)
- Cannot rollback app store builds
- Must release new version
- Communicate issue to users
- Provide fix in next release

---

## Post-Deployment Checklist

- [ ] API health check passing
- [ ] All endpoints responding
- [ ] Database connection stable
- [ ] Frontend connects to backend
- [ ] Authentication working
- [ ] Bookings can be created
- [ ] Maps showing correctly
- [ ] Error logging working
- [ ] Performance acceptable
- [ ] SSL certificate valid
- [ ] Monitoring active
- [ ] Team notified of deployment

---

## Performance Optimization

### Backend
```javascript
// Enable compression
import compression from 'compression';
app.use(compression());

// Implement caching
import redis from 'redis';
const cache = redis.createClient();

// Connection pooling for database
mongoose.set('bufferTimeoutMS', 30000);
```

### Frontend
```json
// Optimize bundle size in app.json
{
  "plugins": ["./withOptimizationPlugin.js"]
}
```

### Database
```javascript
// Create indexes
db.bookings.createIndex({ userId: 1 });
db.bookings.createIndex({ stationId: 1 });
db.stations.createIndex({ coordinates: "2dsphere" });
```

---

**Last Updated:** January 2024
**Status:** Production Ready
**Support:** Contact dev@chargebuddy.com
