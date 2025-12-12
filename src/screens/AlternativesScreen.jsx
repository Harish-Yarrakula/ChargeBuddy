import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getAlternativeStations } from '../config/chargingService';

const { width } = Dimensions.get('window');

export default function AlternativesScreen() {
    const router = useRouter();
    const { stationId, latitude, longitude, targetBattery, carKwh, stationName, chargerType, chargerPower, pricePerUnit } = useLocalSearchParams();
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [alternatives, setAlternatives] = useState([]);
    const [originalStation, setOriginalStation] = useState(null);

    const originalFromParams = {
        name: stationName || 'Selected Station',
        chargerType: chargerType || 'AC',
        chargerPower: chargerPower ? Number(chargerPower) : 7,
        pricePerUnit: pricePerUnit ? Number(pricePerUnit) : 8,
    };

    useEffect(() => {
        fetchAlternatives();
    }, [stationId]);

    const fetchAlternatives = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const result = await getAlternativeStations(token || 'guest', {
                stationId,
                currentLat: parseFloat(latitude) || 17.3850,
                currentLon: parseFloat(longitude) || 78.4867,
                targetBattery: parseInt(targetBattery) || 80,
                carKwh: parseInt(carKwh) || 60,
                chargerType: 'DC'
            });

            if (result.success) {
                setOriginalStation(result.data.originalStation || originalFromParams);

                // Normalize alternative fields so UI has complete data
                const normalized = (result.data.alternatives || []).map((alt) => {
                    const pricePerUnit = alt.pricePerUnit ?? 8;
                    const chargerPower = alt.chargerPower ?? (alt.chargerType === 'DC' ? 50 : 7);
                    const chargeTime = alt.chargingTime ?? alt.chargeTime ?? 45;
                    const distance = alt.distance ?? 0;
                    const availablePorts = alt.availablePorts ?? 0;
                    const reason = alt.reason ?? 'available';
                    const timeAdvantage = alt.timeAdvantage ?? 0;
                    const costDifference = alt.costDifference ?? 0;
                    const cost = alt.cost ?? Math.round(pricePerUnit * 12); // fallback cost estimate

                    return {
                        ...alt,
                        stationId: alt._id || alt.stationId || stationId,
                        name: alt.name || 'Alternative Station',
                        pricePerUnit,
                        chargerPower,
                        chargeTime,
                        distance,
                        availablePorts,
                        reason,
                        timeAdvantage,
                        costDifference,
                        cost,
                    };
                });

                setAlternatives(normalized);
            } else {
                setOriginalStation(originalFromParams);
                setAlternatives([]);
            }
        } catch (error) {
            console.error('Error fetching alternatives:', error);
            setOriginalStation(originalFromParams);
            setAlternatives([]);
            Alert.alert('Error', 'Failed to fetch alternative stations');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAlternatives();
        setRefreshing(false);
    };

    const handleSelectAlternative = (station) => {
        Alert.alert(
            'Book Alternative Station',
            `Switch to ${station.name}?\n\nCharging Time: ${Math.round(station.chargeTime)} min\nCost Savings: ₹${station.costDifference}`,
            [
                { text: 'Cancel', onPress: () => {} },
                {
                    text: 'Book',
                    onPress: () => {
                        // Navigate to booking screen with alternative station
                        router.push({
                            pathname: '/booking',
                            params: {
                                stationId: station.stationId,
                                stationName: station.name,
                                chargerType: station.chargerType,
                                chargerPower: station.chargerType === 'DC' ? 50 : 7,
                                pricePerUnit: (station.cost / station.chargeTime * 60).toFixed(2)
                            }
                        });
                    },
                    style: 'default'
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#5B9BD5" />
            </View>
        );
    }

    const displayOriginal = originalStation || originalFromParams;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={32} color="#5B9BD5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Better Options</Text>
                <View style={{ width: 32 }} />
            </View>

            <FlatList
                data={alternatives}
                keyExtractor={(item, index) => item.stationId?.toString() || item._id?.toString() || index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.stationCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.stationInfo}>
                                <Text style={styles.stationName}>{item.name}</Text>
                                <View style={styles.addressRow}>
                                    <Ionicons name="location" size={14} color="#7F8C8D" />
                                    <Text style={styles.address}>{item.distance}km away</Text>
                                </View>
                            </View>
                            <View style={[
                                styles.reasonBadge,
                                item.reason === 'faster' || item.reason === 'faster_charger' ? styles.fasterBadge 
                                    : item.reason === 'cheaper' ? styles.cheaperBadge
                                    : styles.availableBadge
                            ]}>
                                <Text style={styles.reasonText}>
                                    {item.reason === 'faster' || item.reason === 'faster_charger' ? '⚡ Faster' 
                                        : item.reason === 'cheaper' ? '💰 Cheaper' 
                                        : '✓ Available'}
                                </Text>
                            </View>
                        </View>

                        {/* Advantages */}
                        <View style={styles.advantagesContainer}>
                            <View style={styles.advantageItem}>
                                <Ionicons name="timer" size={20} color="#5B9BD5" />
                                <View style={styles.advantageText}>
                                    <Text style={styles.advantageLabel}>Charging Time</Text>
                                    <Text style={styles.advantageValue}>{Math.round(item.chargeTime)} min</Text>
                                </View>
                            </View>

                            <View style={styles.advantageItem}>
                                <Ionicons name="flash" size={20} color="#F39C12" />
                                <View style={styles.advantageText}>
                                    <Text style={styles.advantageLabel}>Power</Text>
                                    <Text style={styles.advantageValue}>{item.chargerPower} kW ({item.chargerType})</Text>
                                </View>
                            </View>

                            <View style={styles.advantageItem}>
                                <Ionicons name="cash" size={20} color="#27AE60" />
                                <View style={styles.advantageText}>
                                    <Text style={styles.advantageLabel}>Est. Session Cost</Text>
                                    <Text style={styles.advantageValue}>₹{item.cost}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Extra facts */}
                        <View style={styles.metaRow}>
                            <View style={styles.metaChip}>
                                <Ionicons name="pricetag" size={14} color="#5B9BD5" />
                                <Text style={styles.metaText}>₹{item.pricePerUnit}/kWh</Text>
                            </View>
                            <View style={styles.metaChip}>
                                <Ionicons name="time" size={14} color="#E67E22" />
                                <Text style={styles.metaText}>{item.timeAdvantage} min faster</Text>
                            </View>
                            <View style={styles.metaChip}>
                                <Ionicons name="cash" size={14} color="#27AE60" />
                                <Text style={styles.metaText}>{item.costDifference <= 0 ? `Save ₹${Math.abs(item.costDifference)}` : `+₹${item.costDifference}`}</Text>
                            </View>
                        </View>

                        {/* Cost Comparison */}
                        {item.costDifference < 0 && (
                            <View style={styles.savingsContainer}>
                                <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                                <Text style={styles.savingsText}>
                                    Save ₹{Math.abs(item.costDifference)} with this station
                                </Text>
                            </View>
                        )}

                        {/* Availability */}
                        <View style={styles.availabilityRow}>
                            <Ionicons name="checkmark" size={16} color="#27AE60" />
                            <Text style={styles.availabilityText}>
                                {item.availablePorts} ports available
                            </Text>
                        </View>

                        {/* Book Button */}
                        <TouchableOpacity
                            style={styles.bookButton}
                            onPress={() => handleSelectAlternative(item)}
                        >
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                            <Text style={styles.bookButtonText}>Book This Station</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListHeaderComponent={
                    <>
                        {/* Original Station */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Your Original Choice</Text>
                            <Text style={styles.originalStationName}>{displayOriginal?.name}</Text>
                            <View style={styles.metaRow}>
                                <View style={styles.metaChip}>
                                    <Ionicons name="flash" size={14} color="#F39C12" />
                                    <Text style={styles.metaText}>{displayOriginal?.chargerPower || 7} kW ({displayOriginal?.chargerType || 'AC'})</Text>
                                </View>
                                <View style={styles.metaChip}>
                                    <Ionicons name="pricetag" size={14} color="#5B9BD5" />
                                    <Text style={styles.metaText}>₹{displayOriginal?.pricePerUnit || 8}/kWh</Text>
                                </View>
                            </View>
                            <View style={styles.busyBadge}>
                                <Ionicons name="alert-circle" size={16} color="#E74C3C" />
                                <Text style={styles.busyText}>Currently Busy</Text>
                            </View>
                        </View>

                        {/* Recommendations Header */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Better Alternatives Nearby</Text>
                            <Text style={styles.cardSubtitle}>
                                {(alternatives || []).length} {(alternatives || []).length === 1 ? 'option' : 'options'} found within 5km
                            </Text>
                        </View>
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>No alternatives found</Text>
                        <Text style={styles.emptySubtext}>Try expanding your search radius</Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        marginBottom: 10,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#7F8C8D',
    },
    originalStationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginVertical: 8,
    },
    busyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FADBD8',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    busyText: {
        color: '#E74C3C',
        fontWeight: '600',
        fontSize: 12,
    },
    listContent: {
        paddingBottom: 100,
    },
    stationCard: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    stationInfo: {
        flex: 1,
    },
    stationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 6,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    address: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    reasonBadge: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    fasterBadge: {
        backgroundColor: '#E8F5E9',
    },
    availableBadge: {
        backgroundColor: '#E8F4FB',
    },
    reasonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#27AE60',
    },
    advantagesContainer: {
        marginVertical: 12,
        paddingVertical: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    advantageItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    advantageText: {
        marginLeft: 12,
        flex: 1,
    },
    advantageLabel: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    advantageValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2C3E50',
        marginTop: 2,
    },
    savingsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginVertical: 10,
        gap: 8,
    },
    savingsText: {
        color: '#27AE60',
        fontWeight: '600',
        fontSize: 13,
    },
    availabilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 8,
    },
    availabilityText: {
        fontSize: 13,
        color: '#7F8C8D',
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#5B9BD5',
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    bookButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 13,
        color: '#7F8C8D',
        marginTop: 6,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F2F6FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    metaText: {
        fontSize: 12,
        color: '#2C3E50',
        fontWeight: '600',
    },
});
