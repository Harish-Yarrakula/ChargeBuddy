import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { API_CONFIG } from '../config/apiConfig';

const EVStationScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [isBooking, setIsBooking] = useState(false);

    // Get station data from route params
    let station = {};
    try {
        if (params?.station) {
            station = JSON.parse(decodeURIComponent(params.station));
        }
    } catch (err) {
        console.log('Station param parse error:', err);
    }

    if (!station.ID) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
                <Text style={styles.errorText}>Station not found</Text>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const connections = station.Connections?.length || 0;
    const avgRating = (Math.random() * 2 + 3).toFixed(1); // Mock rating
    const reviewCount = Math.floor(Math.random() * 500) + 50;
    const capacity = station.Connections?.reduce((sum, conn) => sum + (conn.Amps || 16), 0) || 'N/A';
    const availablePorts = Math.floor(Math.random() * connections) + 1;

    // Get directions to station using Google Maps API
    const handleNavigate = async () => {
        if (!station.AddressInfo) return;

        try {
            const destination = `${station.AddressInfo.Latitude},${station.AddressInfo.Longitude}`;
            
            // Using Google Directions API
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=USER_LOCATION&destination=${destination}&key=${API_CONFIG.GOOGLE_API_KEY}`
            );
            const data = await response.json();
            
            if (data.status === 'OK') {
                const route = data.routes[0];
                const distance = route.legs[0].distance.text;
                const duration = route.legs[0].duration.text;
                
                Alert.alert(
                    'Navigation',
                    `Distance: ${distance}\nEstimated Time: ${duration}`,
                    [{ text: 'OK' }]
                );
            }
        } catch (err) {
            console.log('Error getting directions:', err);
            Alert.alert('Note', 'To enable directions, add your Google Maps API key to src/config/apiConfig.js');
        }
    };

    const handlePreBook = () => {
        // Navigate to smart booking screen
        router.push({
            pathname: '/booking',
            params: {
                stationId: station.ID,
                stationName: station.AddressInfo?.Title || 'Charging Station',
                chargerType: station.Connections?.[0]?.ConnectionType?.Title || 'AC',
                chargerPower: station.Connections?.[0]?.Amps || 7,
                pricePerUnit: 8 // Default price, can be fetched from DB
            }
        });
    };

    const handleAlternatives = () => {
        // Navigate to alternatives screen
        router.push({
            pathname: '/alternatives',
            params: {
                stationId: station.ID,
                latitude: station.AddressInfo?.Latitude || '17.3850',
                longitude: station.AddressInfo?.Longitude || '78.4867',
                targetBattery: 80,
                carKwh: 60,
                stationName: station.AddressInfo?.Title || 'Charging Station',
                chargerType: station.Connections?.[0]?.ConnectionType?.Title || 'AC',
                chargerPower: station.Connections?.[0]?.Amps || 7,
                pricePerUnit: 8
            }
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backIconButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <View style={styles.stationIcon}>
                        <Ionicons name="battery-charging" size={32} color="#007AFF" />
                    </View>
                    <Text style={styles.headerTitle} numberOfLines={2}>
                        {station.AddressInfo.Title}
                    </Text>
                </View>
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{avgRating}</Text>
                </View>
            </View>

            <ScrollView 
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Address Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="location" size={20} color="#007AFF" />
                        <Text style={styles.cardTitle}>Location</Text>
                    </View>
                    <Text style={styles.addressText}>
                        {station.AddressInfo.AddressLine1}
                    </Text>
                    {station.AddressInfo.Town && (
                        <Text style={styles.addressText}>
                            {station.AddressInfo.Town}, {station.AddressInfo.StateOrProvince}
                        </Text>
                    )}
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={styles.statIcon}>
                            <Ionicons name="flash" size={24} color="#007AFF" />
                        </View>
                        <Text style={styles.statValue}>{connections}</Text>
                        <Text style={styles.statLabel}>Charging Ports</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={styles.statIcon}>
                            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                        </View>
                        <Text style={styles.statValue}>{availablePorts}</Text>
                        <Text style={styles.statLabel}>Available Now</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={styles.statIcon}>
                            <Ionicons name="power" size={24} color="#FF9500" />
                        </View>
                        <Text style={styles.statValue}>{capacity}A</Text>
                        <Text style={styles.statLabel}>Total Capacity</Text>
                    </View>
                </View>

                {/* Charging Details */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="settings" size={20} color="#007AFF" />
                        <Text style={styles.cardTitle}>Charging Details</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>
                                {station.StatusType?.Title || 'Operational'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Connection Types</Text>
                        <View style={styles.connectionTypes}>
                            {station.Connections?.slice(0, 3).map((conn, idx) => (
                                <View key={idx} style={styles.connectionBadge}>
                                    <Text style={styles.connectionText}>
                                        {conn.ConnectionType?.Title?.substring(0, 3) || 'DC'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Last Updated</Text>
                        <Text style={styles.detailValue}>Today</Text>
                    </View>
                </View>

                {/* Ratings */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="star" size={20} color="#FFD700" />
                        <Text style={styles.cardTitle}>Ratings & Reviews</Text>
                    </View>
                    
                    <View style={styles.ratingContainer}>
                        <View style={styles.ratingScore}>
                            <Text style={styles.ratingNumber}>{avgRating}</Text>
                            <View style={styles.starsContainer}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Ionicons 
                                        key={star}
                                        name={star <= Math.round(avgRating) ? "star" : "star-outline"} 
                                        size={16} 
                                        color="#FFD700" 
                                    />
                                ))}
                            </View>
                            <Text style={styles.reviewCount}>
                                {reviewCount} reviews
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Amenities */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="checkmark-done" size={20} color="#007AFF" />
                        <Text style={styles.cardTitle}>Amenities</Text>
                    </View>
                    
                    <View style={styles.amenitiesList}>
                        <View style={styles.amenityItem}>
                            <Ionicons name="wifi" size={18} color="#007AFF" />
                            <Text style={styles.amenityText}>Free WiFi</Text>
                        </View>
                        <View style={styles.amenityItem}>
                            <Ionicons name="restaurant" size={18} color="#007AFF" />
                            <Text style={styles.amenityText}>Nearby Restaurants</Text>
                        </View>
                        <View style={styles.amenityItem}>
                            <Ionicons name="car" size={18} color="#007AFF" />
                            <Text style={styles.amenityText}>Parking Available</Text>
                        </View>
                        <View style={styles.amenityItem}>
                            <Ionicons name="shield-checkmark" size={18} color="#007AFF" />
                            <Text style={styles.amenityText}>24/7 Security</Text>
                        </View>
                    </View>
                </View>

                {/* Spacing for sticky button */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Buttons Container */}
            <View style={styles.bookingContainer}>
                <TouchableOpacity 
                    style={styles.directionsButton}
                    onPress={() => {
                        router.push({
                            pathname: '/(tabs)/maps',
                            params: { station: encodeURIComponent(JSON.stringify(station)) }
                        });
                    }}
                >
                    <Ionicons name="navigate" size={20} color="#5B9BD5" />
                    <Text style={styles.directionsButtonText}>Directions</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.alternativesButton}
                    onPress={handleAlternatives}
                >
                    <Ionicons name="swap-horizontal" size={20} color="#F39C12" />
                    <Text style={styles.alternativesButtonText}>Alternatives</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.preBookButton, isBooking && styles.preBookButtonDisabled]}
                    onPress={handlePreBook}
                    disabled={isBooking}
                >
                    {isBooking ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Ionicons name="calendar" size={20} color="#fff" />
                            <Text style={styles.preBookButtonText}>Book Now</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#5B9BD5',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#5B9BD5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    backIconButton: {
        padding: 8,
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    stationIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    ratingBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 120,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#2C3E50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginLeft: 10,
    },
    addressText: {
        fontSize: 14,
        color: '#7F8C8D',
        marginBottom: 4,
        lineHeight: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#2C3E50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    statIcon: {
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#5B9BD5',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#7F8C8D',
        textAlign: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    detailLabel: {
        fontSize: 14,
        color: '#7F8C8D',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#5B9BD5',
        fontWeight: '600',
    },
    statusBadge: {
        backgroundColor: '#D4EDDA',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#27AE60',
    },
    connectionTypes: {
        flexDirection: 'row',
        gap: 8,
    },
    connectionBadge: {
        backgroundColor: '#E8F4FB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    connectionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#5B9BD5',
    },
    ratingContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    ratingScore: {
        alignItems: 'center',
    },
    ratingNumber: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#5B9BD5',
    },
    starsContainer: {
        flexDirection: 'row',
        marginVertical: 8,
        gap: 4,
    },
    reviewCount: {
        fontSize: 14,
        color: '#8E8E93',
    },
    amenitiesList: {
        gap: 12,
    },
    amenityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    amenityText: {
        fontSize: 14,
        color: '#7F8C8D',
        marginLeft: 12,
    },
    bookingContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        flexDirection: 'row',
        gap: 12,
    },
    directionsButton: {
        flex: 1,
        backgroundColor: '#E8F4FB',
        paddingVertical: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#5B9BD5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    directionsButtonText: {
        color: '#5B9BD5',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 6,
    },
    alternativesButton: {
        flex: 1,
        backgroundColor: '#FFF8E8',
        paddingVertical: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F39C12',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    alternativesButtonText: {
        color: '#F39C12',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 6,
    },
    preBookButton: {
        flex: 1,
        backgroundColor: '#5B9BD5',
        paddingVertical: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#5B9BD5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    preBookButtonDisabled: {
        opacity: 0.6,
    },
    buttonIcon: {
        marginRight: 8,
    },
    preBookButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 6,
    },
    backButton: {
        marginTop: 20,
        backgroundColor: '#5B9BD5',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 16,
        color: '#8E8E93',
        marginTop: 16,
    },
});

export default EVStationScreen;
