import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chargebuddy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// ==================== SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    batteryPercentage: { type: Number, default: 50 },
    profileImage: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Charging Station Schema
const stationSchema = new mongoose.Schema({
    stationId: String,
    name: String,
    address: String,
    latitude: Number,
    longitude: Number,
    totalPorts: Number,
    availablePorts: Number,
    chargingTypes: [{ // AC, DC, etc.
        type: String,
        power: Number, // in kW
        connector: String, // Type 2, CCS, CHAdeMO
        pricePerUnit: Number, // per kWh
        available: Number
    }],
    rating: { type: Number, default: 0 },
    reviews: Number,
    amenities: [String], // WiFi, Parking, etc.
    pricePerUnit: Number,
    operatingHours: String,
    owner: String,
    liveAvailability: { type: Boolean, default: true },
    occupancyRate: { type: Number, default: 0 }, // percentage
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Booking Schema
const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    stationName: String,
    chargingTypeId: String, // Reference to specific charger type
    bookingDate: { type: Date, required: true },
    startTime: String,
    endTime: String,
    slotDuration: Number, // in minutes
    estimatedChargingTime: Number, // in minutes
    estimatedCost: Number,
    actualCost: Number,
    advancePayment: Number,
    remainingPayment: Number,
    queuePosition: { type: Number, default: 0 }, // Position in queue
    status: { type: String, enum: ['pending', 'confirmed', 'queued', 'active', 'completed', 'cancelled', 'no-show'], default: 'pending' },
    bookingReference: String,
    paymentStatus: { type: String, enum: ['pending', 'partial', 'completed', 'failed', 'refunded'], default: 'pending' },
    carBrand: String,
    carModel: String,
    carVariant: String,
    carKwh: Number,
    currentBattery: Number,
    targetBattery: Number,
    chargingType: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Review Schema
const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    cleanliness: Number,
    speed: Number,
    safety: Number,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: Number,
    paymentType: { type: String, enum: ['advance', 'full', 'remaining'], default: 'advance' },
    paymentMethod: { type: String, enum: ['card', 'upi', 'wallet', 'bank'], default: 'card' },
    transactionId: String,
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Queue Management Schema
const queueSchema = new mongoose.Schema({
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    chargingTypeId: String,
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    queuePosition: Number,
    estimatedWaitTime: Number, // in minutes
    status: { type: String, enum: ['waiting', 'active', 'completed', 'reallocated'], default: 'waiting' },
    arrivedAt: Date,
    noShowAt: Date, // if user doesn't arrive
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Charging Estimate Schema
const estimateSchema = new mongoose.Schema({
    carModel: String,
    carKwh: Number,
    chargerPower: Number, // in kW
    currentBattery: Number, // percentage
    targetBattery: Number, // percentage
    estimatedTime: Number, // in minutes
    estimatedCost: Number, // based on pricing
    energyRequired: Number, // in kWh
    efficiency: { type: Number, default: 0.95 }, // charging efficiency
    createdAt: { type: Date, default: Date.now }
});

// Recommendation Schema
const recommendationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    alternativeStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    alternativeSlotTime: String,
    reason: String, // 'busy', 'faster_charger', 'closer_location'
    distance: Number, // in km
    timeAdvantage: Number, // in minutes
    costDifference: Number, // positive if cheaper
    userConsented: Boolean,
    createdAt: { type: Date, default: Date.now },
    expiredAt: { type: Date, default: () => new Date(Date.now() + 15 * 60 * 1000) } // 15 min expiry
});

// Models
const User = mongoose.model('User', userSchema);
const Station = mongoose.model('Station', stationSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Review = mongoose.model('Review', reviewSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Queue = mongoose.model('Queue', queueSchema);
const ChargingEstimate = mongoose.model('ChargingEstimate', estimateSchema);
const Recommendation = mongoose.model('Recommendation', recommendationSchema);

// ==================== MIDDLEWARE ====================

// JWT Auth Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone
        });

        await user.save();

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your_jwt_secret_key', {
            expiresIn: '7d'
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user._id, name: user.name, email: user.email },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your_jwt_secret_key', {
            expiresIn: '7d'
        });

        res.json({
            message: 'Login successful',
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== USER ROUTES ====================

// Get user profile
app.get('/api/users/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user profile
app.put('/api/users/profile', authMiddleware, async (req, res) => {
    try {
        const { name, phone, batteryPercentage } = req.body;

        const user = await User.findByIdAndUpdate(
            req.userId,
            { name, phone, batteryPercentage, updatedAt: Date.now() },
            { new: true }
        ).select('-password');

        res.json({ message: 'Profile updated', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== STATION ROUTES ====================

// Get all stations
app.get('/api/stations', async (req, res) => {
    try {
        const { latitude, longitude, distance } = req.query;

        let query = {};
        
        if (latitude && longitude && distance) {
            // Geospatial query
            query = {
                $where: `(Math.pow(this.latitude - ${latitude}, 2) + Math.pow(this.longitude - ${longitude}, 2)) <= Math.pow(${distance}, 2)`
            };
        }

        const stations = await Station.find(query).sort({ rating: -1 });
        res.json(stations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get station details
app.get('/api/stations/:stationId', async (req, res) => {
    try {
        const station = await Station.findById(req.params.stationId);
        const reviews = await Review.find({ stationId: req.params.stationId }).limit(10);
        
        res.json({
            station,
            reviews
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new station (Admin)
app.post('/api/stations', authMiddleware, async (req, res) => {
    try {
        const { name, address, latitude, longitude, totalPorts, chargingTypes, pricePerUnit } = req.body;

        const station = new Station({
            name,
            address,
            latitude,
            longitude,
            totalPorts,
            availablePorts: totalPorts,
            chargingTypes,
            pricePerUnit
        });

        await station.save();
        res.status(201).json({ message: 'Station added', station });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== BOOKING ROUTES ====================

// Create booking
app.post('/api/bookings', authMiddleware, async (req, res) => {
    try {
        const { stationId, stationName, bookingDate, startTime, endTime, chargingType } = req.body;

        // Calculate duration and cost
        const duration = calculateDuration(startTime, endTime);
        const station = await Station.findById(stationId);
        const estimatedCost = (duration / 60) * station.pricePerUnit;

        // Create booking reference
        const bookingReference = 'CBK' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const booking = new Booking({
            userId: req.userId,
            stationId,
            stationName,
            bookingDate,
            startTime,
            endTime,
            duration,
            chargingType,
            estimatedCost,
            bookingReference,
            status: 'pending'
        });

        await booking.save();

        // Update available ports
        await Station.findByIdAndUpdate(
            stationId,
            { $inc: { availablePorts: -1 } }
        );

        res.status(201).json({
            message: 'Booking created successfully',
            booking,
            bookingReference
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user bookings
app.get('/api/bookings', authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get booking details
app.get('/api/bookings/:bookingId', authMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        if (booking.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel booking
app.put('/api/bookings/:bookingId/cancel', authMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        
        if (booking.userId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ error: 'Cannot cancel this booking' });
        }

        // Update booking status
        booking.status = 'cancelled';
        await booking.save();

        // Return available port
        await Station.findByIdAndUpdate(
            booking.stationId,
            { $inc: { availablePorts: 1 } }
        );

        res.json({ message: 'Booking cancelled', booking });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== REVIEW ROUTES ====================

// Add review
app.post('/api/reviews', authMiddleware, async (req, res) => {
    try {
        const { stationId, rating, comment, cleanliness, speed, safety } = req.body;

        const review = new Review({
            userId: req.userId,
            stationId,
            rating,
            comment,
            cleanliness,
            speed,
            safety
        });

        await review.save();

        // Update station rating
        const allReviews = await Review.find({ stationId });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await Station.findByIdAndUpdate(
            stationId,
            { rating: avgRating, reviews: allReviews.length }
        );

        res.status(201).json({ message: 'Review added', review });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get reviews for station
app.get('/api/reviews/station/:stationId', async (req, res) => {
    try {
        const reviews = await Review.find({ stationId: req.params.stationId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== PAYMENT ROUTES ====================

// Process payment (MOCK MODE - for testing)
app.post('/api/payments', authMiddleware, async (req, res) => {
    try {
        const { bookingId, paymentMethod, amount } = req.body;

        // Mock payment processing - simulate success instantly
        const transactionId = 'MOCK_TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Simulate payment processing delay
        setTimeout(async () => {
            try {
                const payment = new Payment({
                    bookingId,
                    userId: req.userId,
                    amount,
                    paymentMethod,
                    transactionId,
                    status: 'completed', // Mock always succeeds
                    createdAt: new Date()
                });

                await payment.save();

                // Update booking if it exists
                if (bookingId) {
                    await Booking.findByIdAndUpdate(bookingId, {
                        paymentStatus: 'completed',
                        status: 'confirmed'
                    });
                }
            } catch (error) {
                console.error('Mock payment save error:', error);
            }
        }, 500);

        // Return success immediately (mock mode)
        res.status(201).json({
            message: 'Mock Payment successful - TEST MODE',
            payment: {
                transactionId,
                amount: parseFloat(amount).toFixed(2),
                paymentMethod,
                status: 'completed',
                isMockPayment: true,
                timestamp: new Date().toISOString()
            },
            transactionId
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== HELPER FUNCTIONS ====================

function calculateDuration(startTime, endTime) {
    // Convert time strings to minutes and calculate duration
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    return endMinutes - startMinutes;
}

// Calculate charging time
function calculateChargingTime(currentBattery, targetBattery, chargerPower, carKwh) {
    const energyRequired = (carKwh * (targetBattery - currentBattery)) / 100;
    const efficiency = 0.95; // 95% efficiency
    const effectivePower = chargerPower * efficiency;
    const timeInHours = energyRequired / effectivePower;
    return Math.ceil(timeInHours * 60); // convert to minutes
}

// Calculate charging cost
function calculateChargingCost(currentBattery, targetBattery, chargerPower, carKwh, pricePerUnit) {
    const energyRequired = (carKwh * (targetBattery - currentBattery)) / 100;
    const efficiency = 0.95;
    const actualEnergy = energyRequired / efficiency;
    return (actualEnergy * pricePerUnit).toFixed(2);
}

// Calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
}

// ==================== CHARGING ESTIMATE ROUTES ====================

// Estimate charging time and cost
app.post('/api/estimates/charging', async (req, res) => {
    try {
        const { carKwh, currentBattery, targetBattery, chargerPower, pricePerUnit } = req.body;

        const estimatedTime = calculateChargingTime(currentBattery, targetBattery, chargerPower, carKwh);
        const estimatedCost = calculateChargingCost(currentBattery, targetBattery, chargerPower, carKwh, pricePerUnit);
        const energyRequired = (carKwh * (targetBattery - currentBattery)) / 100;

        const estimate = new ChargingEstimate({
            carKwh,
            chargerPower,
            currentBattery,
            targetBattery,
            estimatedTime,
            estimatedCost,
            energyRequired
        });

        await estimate.save();

        res.json({
            estimatedTime,
            estimatedCost,
            energyRequired: energyRequired.toFixed(2),
            chargePercentage: (targetBattery - currentBattery),
            chargerPower
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== QUEUE MANAGEMENT ROUTES ====================

// Add user to queue
app.post('/api/queue/join', authMiddleware, async (req, res) => {
    try {
        const { stationId, bookingId } = req.body;

        // Get current queue length
        const currentQueue = await Queue.find({ stationId, status: 'waiting' }).sort({ createdAt: 1 });
        const queuePosition = currentQueue.length + 1;

        // Estimate wait time (assume 30 min per slot)
        const estimatedWaitTime = (queuePosition - 1) * 30;

        const queueEntry = new Queue({
            stationId,
            bookingId,
            userId: req.userId,
            queuePosition,
            estimatedWaitTime,
            status: 'waiting'
        });

        await queueEntry.save();

        // Update booking with queue info
        await Booking.findByIdAndUpdate(bookingId, {
            queuePosition,
            status: 'queued'
        });

        res.json({
            message: 'Added to queue',
            queuePosition,
            estimatedWaitTime,
            yourPosition: queuePosition,
            totalInQueue: queuePosition
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get queue status
app.get('/api/queue/status/:stationId', async (req, res) => {
    try {
        const { stationId } = req.params;
        const queue = await Queue.find({ stationId, status: { $in: ['waiting', 'active'] } })
            .sort({ queuePosition: 1 })
            .populate('userId', 'name');

        const totalWaiting = queue.filter(q => q.status === 'waiting').length;
        const averageWaitTime = totalWaiting * 30; // 30 min per slot

        res.json({
            totalInQueue: queue.length,
            totalWaiting,
            averageWaitTime,
            queue: queue.slice(0, 10) // Return top 10
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Handle no-show and reallocate slot
app.post('/api/queue/no-show/:bookingId', authMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        const queueEntry = await Queue.findOne({ bookingId: req.params.bookingId });

        if (!queueEntry) {
            return res.status(404).json({ error: 'Queue entry not found' });
        }

        // Mark as no-show
        queueEntry.status = 'reallocated';
        queueEntry.noShowAt = new Date();
        await queueEntry.save();

        booking.status = 'no-show';
        await booking.save();

        // Find next person in queue
        const nextInQueue = await Queue.findOne({
            stationId: queueEntry.stationId,
            status: 'waiting',
            queuePosition: queueEntry.queuePosition + 1
        });

        if (nextInQueue) {
            nextInQueue.queuePosition = queueEntry.queuePosition;
            nextInQueue.status = 'active';
            await nextInQueue.save();

            // Update their booking
            await Booking.findByIdAndUpdate(nextInQueue.bookingId, {
                status: 'active'
            });

            res.json({
                message: 'No-show recorded, slot reallocated',
                reallocatedTo: nextInQueue.userId
            });
        } else {
            res.json({ message: 'No-show recorded, no one to reallocate' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== RECOMMENDATION ROUTES ====================

// Get alternative station suggestions
app.post('/api/recommendations/alternatives', authMiddleware, async (req, res) => {
    try {
        const { stationId, currentLat, currentLon, targetBattery, carKwh, chargerType } = req.body;

        const originalStation = await Station.findById(stationId);
        
        // Find stations with availability within 5km and AC/DC chargers
        const nearbyStations = await Station.find({
            _id: { $ne: stationId },
            availablePorts: { $gt: 0 },
            $expr: {
                $lte: [
                    {
                        $sqrt: {
                            $add: [
                                { $pow: [{ $subtract: ['$latitude', currentLat] }, 2] },
                                { $pow: [{ $subtract: ['$longitude', currentLon] }, 2] }
                            ]
                        }
                    },
                    5 // 5km radius
                ]
            }
        }).limit(5);

        const recommendations = nearbyStations.map(station => {
            const distance = calculateDistance(currentLat, currentLon, station.latitude, station.longitude);
            const fastestCharger = station.chargingTypes.reduce((a, b) => a.power > b.power ? a : b);
            const chargeTime = calculateChargingTime(0, targetBattery, fastestCharger.power, carKwh);
            const cost = calculateChargingCost(0, targetBattery, fastestCharger.power, carKwh, fastestCharger.pricePerUnit);
            const originalCost = calculateChargingCost(0, targetBattery, originalStation.chargingTypes[0]?.power || 7, carKwh, originalStation.pricePerUnit);

            return {
                stationId: station._id,
                name: station.name,
                address: station.address,
                distance,
                availablePorts: station.availablePorts,
                chargeTime,
                cost,
                costDifference: (originalCost - cost).toFixed(2),
                chargerType: fastestCharger.type,
                reason: fastestCharger.power > (originalStation.chargingTypes[0]?.power || 7) ? 'faster_charger' : 'available_slot'
            };
        });

        res.json({
            originalStation: { id: stationId, name: originalStation.name },
            recommendations: recommendations.sort((a, b) => b.chargeTime - a.chargeTime) // Fastest first
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save recommendation
app.post('/api/recommendations/save', authMiddleware, async (req, res) => {
    try {
        const { originalStationId, alternativeStationId, reason } = req.body;

        const recommendation = new Recommendation({
            userId: req.userId,
            originalStationId,
            alternativeStationId,
            reason
        });

        await recommendation.save();

        res.status(201).json({ message: 'Recommendation saved', recommendation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== BOOKING ROUTES (ENHANCED) ====================

// Create smart booking with queue and payment
app.post('/api/bookings/smart', authMiddleware, async (req, res) => {
    try {
        const { 
            stationId, 
            stationName, 
            bookingDate, 
            startTime, 
            endTime, 
            chargingType,
            carBrand,
            carModel,
            carVariant,
            carKwh,
            currentBattery,
            targetBattery,
            chargerPower,
            pricePerUnit,
            paymentMethod
        } = req.body;

        // Calculate charging details
        const slotDuration = calculateDuration(startTime, endTime);
        const estimatedChargingTime = calculateChargingTime(currentBattery, targetBattery, chargerPower, carKwh);
        const estimatedCost = calculateChargingCost(currentBattery, targetBattery, chargerPower, carKwh, pricePerUnit);
        const advancePayment = (estimatedCost * 0.2).toFixed(2); // 20% advance
        const remainingPayment = (estimatedCost - advancePayment).toFixed(2);

        // Create booking reference
        const bookingReference = 'CBK' + Math.random().toString(36).substr(2, 9).toUpperCase();

        const booking = new Booking({
            userId: req.userId,
            stationId,
            stationName,
            bookingDate,
            startTime,
            endTime,
            slotDuration,
            estimatedChargingTime,
            estimatedCost,
            advancePayment,
            remainingPayment,
            chargingType,
            carBrand,
            carModel,
            carVariant,
            carKwh,
            currentBattery,
            targetBattery,
            bookingReference,
            status: 'pending'
        });

        await booking.save();

        // Process advance payment
        const transactionId = 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const payment = new Payment({
            bookingId: booking._id,
            userId: req.userId,
            amount: advancePayment,
            paymentType: 'advance',
            paymentMethod,
            transactionId,
            status: 'completed'
        });

        await payment.save();

        // Update booking payment status
        booking.paymentStatus = 'partial';
        booking.status = 'confirmed';
        await booking.save();

        // Add to queue
        const queue = await Queue.find({ stationId, status: 'waiting' });
        const queuePosition = queue.length + 1;

        const queueEntry = new Queue({
            stationId,
            bookingId: booking._id,
            userId: req.userId,
            queuePosition,
            estimatedWaitTime: (queuePosition - 1) * 30,
            status: 'waiting'
        });

        await queueEntry.save();

        res.status(201).json({
            message: 'Smart booking created successfully',
            booking: {
                _id: booking._id,
                bookingReference,
                stationName,
                estimatedChargingTime,
                estimatedCost,
                advancePayment,
                remainingPayment,
                queuePosition,
                status: 'confirmed',
                transactionId
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
    res.json({ status: 'Server running' });
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export { Booking, ChargingEstimate, Payment, Queue, Recommendation, Review, Station, User };

