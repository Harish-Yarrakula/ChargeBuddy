/**
 * Database Initialization Script
 * Run this once to populate the database with sample data
 * 
 * Usage: node init-db.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chargebuddy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Define Schemas
const stationSchema = new mongoose.Schema({
    name: String,
    address: String,
    latitude: Number,
    longitude: Number,
    totalPorts: Number,
    availablePorts: Number,
    chargingTypes: [String],
    rating: Number,
    reviews: Number,
    amenities: [String],
    pricePerUnit: Number,
    operatingHours: String,
    createdAt: { type: Date, default: Date.now }
});

const Station = mongoose.model('Station', stationSchema);

// Run initialization
initializeDatabase();
// Sample charging stations data
const sampleStations = [
    {
        name: 'Tesla Supercharger - Kothapet',
        address: 'MG Road, Kothapet, Vijayawada',
        latitude: 16.5062,
        longitude: 80.6480,
        totalPorts: 8,
        availablePorts: 3,
        chargingTypes: ['DC', 'Supercharger'],
        rating: 4.5,
        reviews: 245,
        amenities: ['WiFi', 'Restroom', 'Cafe', 'Parking'],
        pricePerUnit: 0.28,
        operatingHours: '24/7'
    },
    {
        name: 'ChargePoint Station - Benz Circle',
        address: 'Benz Circle, Kothapet, Vijayawada',
        latitude: 16.5070,
        longitude: 80.6490,
        totalPorts: 6,
        availablePorts: 2,
        chargingTypes: ['AC', 'DC'],
        rating: 4.2,
        reviews: 189,
        amenities: ['Shopping', 'WiFi', 'Parking'],
        pricePerUnit: 0.22,
        operatingHours: '6AM - 11PM'
    },
    {
        name: 'Electrify America - Vijayawada Airport',
        address: 'Airport Road, Kothapet, Vijayawada',
        latitude: 16.5080,
        longitude: 80.6470,
        totalPorts: 10,
        availablePorts: 5,
        chargingTypes: ['DC', 'Fast Charging'],
        rating: 4.7,
        reviews: 312,
        amenities: ['WiFi', 'Lounge', '24/7 Security', 'Parking'],
        pricePerUnit: 0.35,
        operatingHours: '24/7'
    },
    {
        name: 'EVgo - IT Park',
        address: 'IT Park Road, Kothapet, Vijayawada',
        latitude: 16.5050,
        longitude: 80.6500,
        totalPorts: 4,
        availablePorts: 4,
        chargingTypes: ['DC'],
        rating: 4.3,
        reviews: 128,
        amenities: ['Office Area', 'WiFi', 'Parking'],
        pricePerUnit: 0.25,
        operatingHours: '24/7'
    },
    {
        name: 'Blink Charging - Hotel Grand',
        address: 'Grand Hotel Lane, Kothapet, Vijayawada',
        latitude: 16.5090,
        longitude: 80.6460,
        totalPorts: 5,
        availablePorts: 1,
        chargingTypes: ['AC'],
        rating: 4.0,
        reviews: 95,
        amenities: ['Hotel Amenities', 'Restaurant', 'WiFi', 'Valet Parking'],
        pricePerUnit: 0.20,
        operatingHours: '24/7'
    },
    {
        name: 'Volta Charging - Mall Plaza',
        address: 'Plaza Mall, Kothapet, Vijayawada',
        latitude: 16.5040,
        longitude: 80.6510,
        totalPorts: 3,
        availablePorts: 2,
        chargingTypes: ['AC'],
        rating: 3.8,
        reviews: 76,
        amenities: ['Shopping', 'WiFi', 'Free Charging', 'Parking'],
        pricePerUnit: 0.0,
        operatingHours: '8AM - 9PM'
    },
    {
        name: 'Ionity Charger - Railway Station',
        address: 'Railway Station Road, Kothapet, Vijayawada',
        latitude: 16.5100,
        longitude: 80.6450,
        totalPorts: 7,
        availablePorts: 4,
        chargingTypes: ['DC', 'Ultra Fast'],
        rating: 4.6,
        reviews: 201,
        amenities: ['WiFi', 'Waiting Area', 'Parking'],
        pricePerUnit: 0.30,
        operatingHours: '24/7'
    },
    {
        name: 'Greenlots - Bus Stand',
        address: 'Bus Stand Area, Kothapet, Vijayawada',
        latitude: 16.5030,
        longitude: 80.6520,
        totalPorts: 5,
        availablePorts: 3,
        chargingTypes: ['AC', 'DC'],
        rating: 4.1,
        reviews: 167,
        amenities: ['Restroom', 'WiFi', 'Parking'],
        pricePerUnit: 0.24,
        operatingHours: '5AM - 10PM'
    },
    {
        name: 'ChargeHub - College Campus',
        address: 'College Road, Kothapet, Vijayawada',
        latitude: 16.5110,
        longitude: 80.6440,
        totalPorts: 4,
        availablePorts: 2,
        chargingTypes: ['AC'],
        rating: 3.9,
        reviews: 89,
        amenities: ['Library Access', 'WiFi', 'Parking'],
        pricePerUnit: 0.18,
        operatingHours: '6AM - 8PM'
    },
    {
        name: 'Fastned - Highway Junction',
        address: 'Highway Junction, Kothapet, Vijayawada',
        latitude: 16.5020,
        longitude: 80.6530,
        totalPorts: 9,
        availablePorts: 6,
        chargingTypes: ['DC', 'Supercharger'],
        rating: 4.4,
        reviews: 278,
        amenities: ['Cafe', 'WiFi', 'Rest Area', 'Parking'],
        pricePerUnit: 0.32,
        operatingHours: '24/7'
    }
];