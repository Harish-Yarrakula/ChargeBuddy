/**
 * Charging Service
 * Handles all charging-related operations: estimates, bookings, queue, payments, and recommendations
 */

import { API_CONFIG } from './apiConfig';

const BACKEND_URL = API_CONFIG.BACKEND_URL || 'http://localhost:5000';

/**
 * Calculate charging time and cost estimate
 * @param {number} carKwh - Car battery capacity
 * @param {number} currentBattery - Current battery percentage
 * @param {number} targetBattery - Target battery percentage
 * @param {number} chargerPower - Charger power in kW
 * @param {number} pricePerUnit - Price per kWh
 * @returns {Promise} - Charging estimate
 */
export const estimateCharging = async (carKwh, currentBattery, targetBattery, chargerPower, pricePerUnit) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/estimates/charging`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                carKwh,
                currentBattery,
                targetBattery,
                chargerPower,
                pricePerUnit
            })
        });

        const data = await response.json();
        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Error estimating charging:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Create smart booking with queue and advance payment (MOCK MODE)
 * @param {string} token - User authentication token
 * @param {object} bookingData - Booking details
 * @returns {Promise} - Booking confirmation
 */
export const createSmartBooking = async (token, bookingData) => {
    try {
        // Mock booking mode - simulate booking instantly for testing
        return new Promise((resolve) => {
            setTimeout(() => {
                const bookingRef = 'CBK' + Math.random().toString(36).substr(2, 9).toUpperCase();
                const mockTransactionId = 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase();
                const totalCost = bookingData.chargerPower || 240;
                const advanceAmount = (totalCost * 0.2).toFixed(2);
                const remainingAmount = (totalCost * 0.8).toFixed(2);
                
                resolve({
                    success: true,
                    data: {
                        booking: {
                            _id: 'booking_' + Math.random().toString(36).substr(2, 9),
                            bookingReference: bookingRef,
                            stationName: bookingData.stationName,
                            estimatedChargingTime: bookingData.estimatedChargingTime || 45,
                            estimatedCost: totalCost,
                            advancePayment: advanceAmount,
                            remainingPayment: remainingAmount,
                            queuePosition: Math.floor(Math.random() * 5) + 1,
                            status: 'confirmed',
                            transactionId: mockTransactionId,
                            paymentStatus: 'advance_completed',
                            createdAt: new Date().toISOString(),
                            isMockPayment: true
                        }
                    }
                });
            }, 1200); // Simulate 1.2s booking time
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Join queue for a station
 * @param {string} token - User authentication token
 * @param {string} stationId - Station ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise} - Queue position
 */
export const joinQueue = async (token, stationId, bookingId) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/queue/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ stationId, bookingId })
        });

        const data = await response.json();
        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Error joining queue:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get queue status for a station (MOCK MODE)
 * @param {string} stationId - Station ID
 * @returns {Promise} - Queue information
 */
export const getQueueStatus = async (stationId) => {
    try {
        // Mock queue status - return simulated queue data
        return new Promise((resolve) => {
            setTimeout(() => {
                const queuePosition = Math.floor(Math.random() * 8) + 1;
                const totalInQueue = Math.floor(Math.random() * 10) + queuePosition + 2;
                const waitingCount = Math.floor(totalInQueue * 0.6);
                
                // Mock queue list
                const queueList = Array.from({ length: Math.min(10, totalInQueue) }, (_, i) => ({
                    position: i + 1,
                    userId: 'USER' + Math.random().toString(36).substr(2, 5).toUpperCase(),
                    status: i < 2 ? 'active' : 'waiting',
                    estimatedWaitTime: (i * 15) + Math.floor(Math.random() * 10),
                    joinedAt: new Date(Date.now() - i * 600000).toISOString()
                }));

                resolve({
                    success: true,
                    data: {
                        stationId,
                        yourPosition: queuePosition,
                        peopleAhead: queuePosition - 1,
                        totalInQueue,
                        waitingCount,
                        activeChargingCount: 2,
                        averageWaitTime: Math.floor(queuePosition * 12),
                        estimatedYourWaitTime: Math.floor((queuePosition - 1) * 15),
                        queueList,
                        isMockData: true,
                        lastUpdated: new Date().toISOString()
                    }
                });
            }, 800); // Simulate 0.8s fetch time
        });
    } catch (error) {
        console.error('Error fetching queue status:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Report no-show and reallocate slot (MOCK MODE)
 * @param {string} token - User authentication token
 * @param {string} bookingId - Booking ID
 * @returns {Promise} - Reallocation status
 */
export const reportNoShow = async (token, bookingId) => {
    try {
        // Mock no-show reporting
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: {
                        message: 'No-show reported successfully',
                        bookingId,
                        newQueuePosition: Math.floor(Math.random() * 3) + 1,
                        reallocatedSlot: 'CBK' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                        refundStatus: 'processed',
                        refundAmount: Math.floor(Math.random() * 100) + 50,
                        isMockData: true
                    }
                });
            }, 600);
        });
    } catch (error) {
        console.error('Error reporting no-show:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get alternative station recommendations (MOCK MODE)
 * @param {string} token - User authentication token
 * @param {object} params - Station and preferences
 * @returns {Promise} - Alternative stations
 */
export const getAlternativeStations = async (token, params) => {
    try {
        // Mock alternatives - return simulated alternatives
        return new Promise((resolve) => {
            setTimeout(() => {
                const alternatives = [
                    {
                        _id: 'station_' + Math.random().toString(36).substr(2, 9),
                        name: 'FastCharge Premium Hub - 2.5km',
                        distance: 2.5,
                        chargingTime: 35,
                        availablePorts: 4,
                        chargerType: 'DC Fast',
                        chargerPower: 50,
                        pricePerUnit: 12,
                        reason: 'faster',
                        costDifference: -15,
                        timeAdvantage: 10
                    },
                    {
                        _id: 'station_' + Math.random().toString(36).substr(2, 9),
                        name: 'Green Energy Station - 1.8km',
                        distance: 1.8,
                        chargingTime: 50,
                        availablePorts: 2,
                        chargerType: 'AC 3-phase',
                        chargerPower: 22,
                        pricePerUnit: 8,
                        reason: 'available',
                        costDifference: 0,
                        timeAdvantage: -5
                    },
                    {
                        _id: 'station_' + Math.random().toString(36).substr(2, 9),
                        name: 'Budget Charging Point - 3.2km',
                        distance: 3.2,
                        chargingTime: 60,
                        availablePorts: 6,
                        chargerType: 'AC',
                        chargerPower: 7,
                        pricePerUnit: 6,
                        reason: 'cheaper',
                        costDifference: 25,
                        timeAdvantage: -15
                    }
                ];

                resolve({
                    success: true,
                    data: {
                        originalStation: params.stationId,
                        alternatives,
                        isMockData: true,
                        expiresIn: 15 * 60 // 15 minutes
                    }
                });
            }, 700);
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Process remaining payment after charging (MOCK MODE)
 * @param {string} token - User authentication token
 * @param {string} bookingId - Booking ID
 * @param {number} amount - Amount to charge
 * @param {string} paymentMethod - Payment method
 * @returns {Promise} - Payment confirmation
 */
export const processRemainingPayment = async (token, bookingId, amount, paymentMethod) => {
    try {
        // Mock payment mode - simulate payment instantly for testing
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockTransactionId = 'MOCK_TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
                resolve({
                    success: true,
                    data: {
                        transactionId: mockTransactionId,
                        amount: parseFloat(amount).toFixed(2),
                        paymentMethod,
                        status: 'completed',
                        message: `Mock Payment: ₹${amount} charged via ${paymentMethod.toUpperCase()}`,
                        isMockPayment: true,
                        timestamp: new Date().toISOString()
                    }
                });
            }, 1000); // Simulate 1s processing time
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get user's charging history
 * @param {string} token - User authentication token
 * @returns {Promise} - Booking history
 */
export const getChargingHistory = async (token) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/bookings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Error fetching history:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get real-time station availability
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Search radius in km
 * @returns {Promise} - Available stations
 */
export const getNearbyStations = async (lat, lon, radius = 5) => {
    try {
        const response = await fetch(
            `${BACKEND_URL}/api/stations?latitude=${lat}&longitude=${lon}&distance=${radius}`
        );

        const data = await response.json();
        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Error fetching nearby stations:', error);
        return { success: false, error: error.message };
    }
};
