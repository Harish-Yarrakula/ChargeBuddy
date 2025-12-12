import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { createSmartBooking, estimateCharging } from '../config/chargingService';

const { width } = Dimensions.get('window');

export default function BookingScreen() {
    const router = useRouter();
    const { stationId, stationName, chargerType, chargerPower, pricePerUnit } = useLocalSearchParams();
    
    const [loading, setLoading] = useState(false);
    const [estimating, setEstimating] = useState(false);
    const [currentBattery, setCurrentBattery] = useState(20);
    const [targetBattery, setTargetBattery] = useState(80);
    const [carInfo, setCarInfo] = useState(null);
    const [estimate, setEstimate] = useState(null);
    const [userData, setUserData] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('card');

    useEffect(() => {
        loadUserData();
    }, []);

    useEffect(() => {
        if (carInfo) {
            calculateEstimate();
        }
    }, [currentBattery, targetBattery]);

    const loadUserData = async () => {
        try {
            const raw = await AsyncStorage.getItem('user');
            if (raw) {
                const data = JSON.parse(raw);
                setUserData(data);
                setCurrentBattery(data.batteryPercentage || 20);
                setCarInfo({
                    brand: data.carBrand,
                    model: data.carModel,
                    variant: data.carVariant,
                    kwh: data.carKwh
                });
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const calculateEstimate = async () => {
        setEstimating(true);
        try {
            const result = await estimateCharging(
                parseInt(carInfo.kwh),
                parseInt(currentBattery),
                parseInt(targetBattery),
                parseFloat(chargerPower) || 7,
                parseFloat(pricePerUnit) || 8
            );

            if (result.success) {
                setEstimate(result.data);
            }
        } catch (error) {
            console.error('Error calculating estimate:', error);
        } finally {
            setEstimating(false);
        }
    };

    const handleBooking = async () => {
        if (!userData) {
            Alert.alert('Error', 'User data not found');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            
            const bookingData = {
                stationId,
                stationName,
                bookingDate: new Date(),
                startTime: '10:00',
                endTime: '11:00',
                chargingType: chargerType || 'AC',
                carBrand: carInfo.brand,
                carModel: carInfo.model,
                carVariant: carInfo.variant,
                carKwh: parseInt(carInfo.kwh),
                currentBattery: parseInt(currentBattery),
                targetBattery: parseInt(targetBattery),
                chargerPower: parseFloat(chargerPower) || 7,
                pricePerUnit: parseFloat(pricePerUnit) || 8,
                paymentMethod
            };

            const result = await createSmartBooking(token || 'guest', bookingData);

            if (result.success) {
                const mockPaymentNote = result.data.booking.isMockPayment 
                    ? '\n\nMock Payment - TEST MODE\nTransaction ID: ' + result.data.booking.transactionId
                    : '';

                Alert.alert(
                    'Success', 
                    `Booking confirmed!\nReference: ${result.data.booking.bookingReference}\nAdvance Payment: ₹${result.data.booking.advancePayment}${mockPaymentNote}`,
                    [
                        {
                            text: 'View Queue',
                            onPress: () => {
                                router.push({
                                    pathname: '/queue-status',
                                    params: { stationId: stationId }
                                });
                            }
                        },
                        {
                            text: 'Done',
                            onPress: () => router.back()
                        }
                    ]
                );
                
                // Store booking details
                await AsyncStorage.setItem('lastBooking', JSON.stringify(result.data.booking));
            } else {
                Alert.alert('Error', result.error || 'Failed to create booking');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Booking failed');
        } finally {
            setLoading(false);
        }
    };

    if (!carInfo) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#5B9BD5" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={32} color="#5B9BD5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Smart Booking</Text>
                <View style={{ width: 32 }} />
            </View>

            {/* Station Info */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Charging Station</Text>
                <Text style={styles.stationName}>{stationName}</Text>
                <View style={styles.infoRow}>
                    <Ionicons name="flash" size={16} color="#5B9BD5" />
                    <Text style={styles.infoText}>{chargerType || 'AC'} - {chargerPower || 7}kW</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="cash" size={16} color="#27AE60" />
                    <Text style={styles.infoText}>₹{pricePerUnit || 8}/kWh</Text>
                </View>
            </View>

            {/* Car & Battery Info */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Your Vehicle</Text>
                <Text style={styles.carInfo}>{carInfo.brand} {carInfo.model}</Text>
                <Text style={styles.variant}>{carInfo.variant}</Text>
                <Text style={styles.kwh}>{carInfo.kwh} kWh Battery</Text>
            </View>

            {/* Battery Adjustment */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Charging Duration</Text>
                
                <View style={styles.sliderContainer}>
                    <View style={styles.batteryRow}>
                        <Text style={styles.batteryLabel}>Current</Text>
                        <View style={styles.batteryInput}>
                            <TouchableOpacity 
                                onPress={() => setCurrentBattery(Math.max(0, currentBattery - 5))}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>−</Text>
                            </TouchableOpacity>
                            <TextInput
                                style={styles.input}
                                value={String(currentBattery)}
                                onChangeText={(val) => setCurrentBattery(Math.min(100, parseInt(val) || 0))}
                                keyboardType="numeric"
                            />
                            <TouchableOpacity 
                                onPress={() => setCurrentBattery(Math.min(100, currentBattery + 5))}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>+</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.percent}>%</Text>
                    </View>

                    <View style={styles.batteryRow}>
                        <Text style={styles.batteryLabel}>Target</Text>
                        <View style={styles.batteryInput}>
                            <TouchableOpacity 
                                onPress={() => setTargetBattery(Math.max(currentBattery, targetBattery - 5))}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>−</Text>
                            </TouchableOpacity>
                            <TextInput
                                style={styles.input}
                                value={String(targetBattery)}
                                onChangeText={(val) => setTargetBattery(Math.min(100, parseInt(val) || 100))}
                                keyboardType="numeric"
                            />
                            <TouchableOpacity 
                                onPress={() => setTargetBattery(Math.min(100, targetBattery + 5))}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>+</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.percent}>%</Text>
                    </View>
                </View>
            </View>

            {/* Charging Estimate */}
            {estimate && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>⚡ Charging Estimate</Text>
                    
                    <View style={styles.estimateRow}>
                        <View style={styles.estimateItem}>
                            <Ionicons name="timer" size={24} color="#5B9BD5" />
                            <Text style={styles.estimateValue}>{Math.round(estimate.estimatedTime)}</Text>
                            <Text style={styles.estimateLabel}>minutes</Text>
                        </View>
                        <View style={styles.estimateItem}>
                            <Ionicons name="flash" size={24} color="#F39C12" />
                            <Text style={styles.estimateValue}>{estimate.energyRequired}</Text>
                            <Text style={styles.estimateLabel}>kWh</Text>
                        </View>
                        <View style={styles.estimateItem}>
                            <Ionicons name="cash" size={24} color="#27AE60" />
                            <Text style={styles.estimateValue}>₹{estimate.estimatedCost}</Text>
                            <Text style={styles.estimateLabel}>cost</Text>
                        </View>
                    </View>

                    {/* Payment Breakdown */}
                    <View style={styles.paymentBreakdown}>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Advance Payment (20%)</Text>
                            <Text style={styles.paymentAmount}>₹{(estimate.estimatedCost * 0.2).toFixed(2)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>After Charging (80%)</Text>
                            <Text style={styles.paymentAmount}>₹{(estimate.estimatedCost * 0.8).toFixed(2)}</Text>
                        </View>
                        <View style={[styles.paymentRow, { marginTop: 10 }]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalAmount}>₹{estimate.estimatedCost}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Payment Method Selection */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Payment Method</Text>
                {['card', 'upi', 'wallet'].map((method) => (
                    <TouchableOpacity
                        key={method}
                        style={[
                            styles.paymentOption,
                            paymentMethod === method && styles.paymentOptionActive
                        ]}
                        onPress={() => setPaymentMethod(method)}
                    >
                        <Ionicons 
                            name={method === 'card' ? 'card' : method === 'upi' ? 'wallet' : 'wallet'} 
                            size={20} 
                            color={paymentMethod === method ? '#5B9BD5' : '#999'}
                        />
                        <Text style={[
                            styles.paymentOptionText,
                            paymentMethod === method && styles.paymentOptionTextActive
                        ]}>
                            {method.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Queue Info */}
            <View style={[styles.card, styles.infoCard]}>
                <View style={styles.infoContent}>
                    <Ionicons name="information-circle" size={20} color="#5B9BD5" />
                    <View style={styles.infoText}>
                        <Text style={styles.infoTitle}>Smart Booking Benefits</Text>
                        <Text style={styles.infoDescription}>• Pay 20% advance, rest after charging</Text>
                        <Text style={styles.infoDescription}>• Automatic queue management</Text>
                        <Text style={styles.infoDescription}>• Guaranteed slot availability</Text>
                        <Text style={styles.infoDescription}>• Free cancellation up to 1 hour before</Text>
                    </View>
                </View>
            </View>

            {/* Booking Button */}
            <TouchableOpacity 
                style={[styles.bookButton, loading && styles.bookButtonDisabled]}
                onPress={handleBooking}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        <Text style={styles.bookButtonText}>Confirm Smart Booking</Text>
                    </>
                )}
            </TouchableOpacity>

            <View style={styles.spacing} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2C3E50',
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 12,
    },
    stationName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#5B9BD5',
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
    },
    infoText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#7F8C8D',
        flex: 1,
    },
    carInfo: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
    },
    variant: {
        fontSize: 13,
        color: '#7F8C8D',
        marginBottom: 2,
    },
    kwh: {
        fontSize: 12,
        color: '#999',
    },
    sliderContainer: {
        marginVertical: 10,
    },
    batteryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        justifyContent: 'space-between',
    },
    batteryLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2C3E50',
        width: 60,
    },
    batteryInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 10,
    },
    button: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#5B9BD5',
    },
    input: {
        flex: 1,
        height: 40,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
        color: '#2C3E50',
    },
    percent: {
        fontSize: 14,
        fontWeight: '500',
        color: '#7F8C8D',
        width: 30,
        textAlign: 'center',
    },
    estimateRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 15,
        paddingVertical: 12,
        backgroundColor: '#E8F4FB',
        borderRadius: 10,
    },
    estimateItem: {
        alignItems: 'center',
    },
    estimateValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3E50',
        marginTop: 4,
    },
    estimateLabel: {
        fontSize: 12,
        color: '#7F8C8D',
        marginTop: 2,
    },
    paymentBreakdown: {
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    paymentLabel: {
        fontSize: 13,
        color: '#7F8C8D',
    },
    paymentAmount: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2C3E50',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2C3E50',
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#27AE60',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginVertical: 6,
    },
    paymentOptionActive: {
        backgroundColor: '#E8F4FB',
        borderColor: '#5B9BD5',
    },
    paymentOptionText: {
        marginLeft: 12,
        fontSize: 14,
        fontWeight: '500',
        color: '#999',
    },
    paymentOptionTextActive: {
        color: '#5B9BD5',
        fontWeight: '600',
    },
    infoCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#5B9BD5',
        backgroundColor: '#F0F7FF',
    },
    infoContent: {
        flexDirection: 'row',
    },
    infoText: {
        marginLeft: 12,
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 6,
    },
    infoDescription: {
        fontSize: 12,
        color: '#7F8C8D',
        marginVertical: 2,
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#27AE60',
        marginHorizontal: 12,
        marginVertical: 16,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 10,
    },
    bookButtonDisabled: {
        opacity: 0.6,
    },
    bookButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    spacing: {
        height: 40,
    },
});
