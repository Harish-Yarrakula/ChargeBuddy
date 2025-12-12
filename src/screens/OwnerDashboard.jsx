import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function OwnerDashboard() {
    const router = useRouter();
    const [ownerData, setOwnerData] = useState(null);
    const [chargers, setChargers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isLiveConnected, setIsLiveConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const liveConnectionRef = useRef(null);
    const autoRefreshRef = useRef(null);

    useEffect(() => {
        loadOwnerData();
        startRealtimeConnection();
        
        return () => {
            stopRealtimeConnection();
        };
    }, []);

    // Pulse animation for live indicator
    useEffect(() => {
        if (isLiveConnected) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: false,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: false,
                    }),
                ])
            ).start();
        }
    }, [isLiveConnected, pulseAnim]);

    const startRealtimeConnection = () => {
        setIsLiveConnected(true);
        
        // Simulate real-time updates every 15 seconds
        autoRefreshRef.current = setInterval(() => {
            simulateRealtimeUpdate();
        }, 15000);
    };

    const stopRealtimeConnection = () => {
        setIsLiveConnected(false);
        if (autoRefreshRef.current) {
            clearInterval(autoRefreshRef.current);
        }
    };

    const simulateRealtimeUpdate = async () => {
        try {
            // Check if chargers array exists and has items
            if (!chargers || chargers.length === 0) {
                return;
            }

            const updatedChargers = chargers.map(charger => {
                // Randomly update some chargers' status
                if (Math.random() > 0.7) {
                    const statusChanged = charger.status === 'occupied' 
                        ? Math.random() > 0.4 // 60% chance to remain occupied
                        : Math.random() > 0.6; // 40% chance to become occupied
                    
                    if (statusChanged !== (charger.status === 'occupied')) {
                        const newStatus = charger.status === 'occupied' ? 'available' : 'occupied';
                        
                        // Show notification for status change
                        notifyStatusChange(charger.id, newStatus);
                        
                        return {
                            ...charger,
                            status: newStatus,
                            vehicleId: newStatus === 'occupied' ? `VEH${Math.floor(Math.random() * 1000)}` : null,
                            currentUser: newStatus === 'occupied' ? `User${Math.floor(Math.random() * 100)}` : null,
                            timeRemaining: newStatus === 'occupied' ? Math.floor(Math.random() * 120) + 10 : 0,
                            lastUpdated: new Date().toISOString()
                        };
                    }
                }
                return charger;
            });

            setChargers(updatedChargers);
            setLastUpdate(new Date());
            
            // Update in storage
            if (ownerData) {
                const updated = { ...ownerData, chargers: updatedChargers };
                await AsyncStorage.setItem('user', JSON.stringify(updated));
            }
        } catch (error) {
            console.error('Real-time update error:', error);
        }
    };

    const notifyStatusChange = (chargerId, newStatus) => {
        // Only show alert if significant enough
        if (newStatus === 'occupied') {
            // Charger became occupied - might want to notify
            console.log(`🔴 ${chargerId} is now OCCUPIED`);
        }
    };

    const loadOwnerData = async () => {
        try {
            const user = await AsyncStorage.getItem('user');
            if (user) {
                const userData = JSON.parse(user);
                if (userData.role === 'owner') {
                    setOwnerData(userData);
                    setChargers(userData.chargers || []);
                } else {
                    router.replace('/(tabs)');
                }
            } else {
                router.replace('/');
            }
        } catch (error) {
            console.error('Error loading owner data:', error);
            Alert.alert('Error', 'Failed to load station data');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        simulateRealtimeUpdate().finally(() => setRefreshing(false));
    }, [chargers, ownerData]);

    const toggleChargerStatus = (chargerId) => {
        const updatedChargers = chargers.map(charger => {
            if (charger.id === chargerId) {
                const newStatus = charger.status === 'occupied' ? 'available' : 'occupied';
                return {
                    ...charger,
                    status: newStatus,
                    vehicleId: newStatus === 'occupied' ? `VEH${Math.floor(Math.random() * 1000)}` : null,
                    currentUser: newStatus === 'occupied' ? `User${Math.floor(Math.random() * 100)}` : null,
                    timeRemaining: newStatus === 'occupied' ? Math.floor(Math.random() * 120) + 10 : 0
                };
            }
            return charger;
        });
        setChargers(updatedChargers);
        
        // Update in storage
        const updated = { ...ownerData, chargers: updatedChargers };
        AsyncStorage.setItem('user', JSON.stringify(updated));
        
        const chargerName = updatedChargers.find(c => c.id === chargerId).id;
        Alert.alert('Success', `${chargerName} status updated to ${updatedChargers.find(c => c.id === chargerId).status}`);
    };

    const forceRelease = (chargerId) => {
        Alert.alert(
            'Force Release Charger',
            'Are you sure you want to release this charger and notify the user?',
            [
                {
                    text: 'Cancel',
                    onPress: () => {},
                    style: 'cancel'
                },
                {
                    text: 'Release',
                    onPress: () => {
                        const updatedChargers = chargers.map(charger => {
                            if (charger.id === chargerId) {
                                return {
                                    ...charger,
                                    status: 'available',
                                    vehicleId: null,
                                    currentUser: null,
                                    timeRemaining: 0
                                };
                            }
                            return charger;
                        });
                        setChargers(updatedChargers);
                        const updated = { ...ownerData, chargers: updatedChargers };
                        AsyncStorage.setItem('user', JSON.stringify(updated));
                        Alert.alert('Released', `${chargerId} has been released and user notified`);
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            {
                text: 'Cancel',
                onPress: () => {},
                style: 'cancel'
            },
            {
                text: 'Logout',
                onPress: async () => {
                    await AsyncStorage.removeItem('user');
                    router.replace('/');
                },
                style: 'destructive'
            }
        ]);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#5B9BD5" />
            </View>
        );
    }

    const occupiedCount = (chargers || []).filter(c => c.status === 'occupied').length;
    const availableCount = (chargers || []).length - occupiedCount;
    const utilization = (chargers || []).length > 0 ? Math.round((occupiedCount / (chargers || []).length) * 100) : 0;

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.titleRow}>
                        <View>
                            <Text style={styles.stationName}>{ownerData?.stationName || 'Station'}</Text>
                            <Text style={styles.stationId}>ID: {ownerData?.stationId}</Text>
                        </View>
                        <View style={styles.liveIndicator}>
                            <Animated.View style={[
                                styles.livePulse,
                                {
                                    opacity: pulseAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.3, 1],
                                    })
                                }
                            ]} />
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>Live</Text>
                        </View>
                    </View>
                    <Text style={styles.lastUpdateText}>
                        Last update: {lastUpdate.toLocaleTimeString()}
                    </Text>
                </View>
                <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="flash" size={28} color="#27AE60" />
                    <Text style={styles.statValue}>{occupiedCount}</Text>
                    <Text style={styles.statLabel}>In Use</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="checkmark-circle" size={28} color="#5B9BD5" />
                    <Text style={styles.statValue}>{availableCount}</Text>
                    <Text style={styles.statLabel}>Available</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="pie-chart" size={28} color="#F39C12" />
                    <Text style={styles.statValue}>{utilization}%</Text>
                    <Text style={styles.statLabel}>Utilization</Text>
                </View>
            </View>

            {/* Chargers Management */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Charger Locks</Text>
                    <View style={styles.headerControls}>
                        <Animated.View style={[
                            styles.connectionStatus,
                            {
                                backgroundColor: isLiveConnected ? '#27AE60' : '#E74C3C',
                                transform: [{
                                    scale: pulseAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 1.1],
                                    })
                                }]
                            }
                        ]} />
                        <TouchableOpacity onPress={onRefresh}>
                            <Ionicons name="refresh" size={20} color="#5B9BD5" />
                        </TouchableOpacity>
                    </View>
                </View>

                {!chargers || chargers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="battery-dead" size={48} color="#CCC" />
                        <Text style={styles.emptyText}>No chargers configured</Text>
                    </View>
                ) : (
                    chargers.map((charger) => (
                        <View key={charger.id} style={styles.chargerCard}>
                            <View style={styles.chargerHeader}>
                                <View style={styles.chargerInfo}>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: charger.status === 'occupied' ? '#E74C3C' : '#27AE60' }
                                    ]}>
                                        <Text style={styles.statusBadgeText}>
                                            {charger.status === 'occupied' ? 'OCCUPIED' : 'AVAILABLE'}
                                        </Text>
                                    </View>
                                    <Text style={styles.chargerId}>{charger.id}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.toggleButton,
                                        { backgroundColor: charger.status === 'occupied' ? '#5B9BD5' : '#27AE60' }
                                    ]}
                                    onPress={() => toggleChargerStatus(charger.id)}
                                >
                                    <Ionicons 
                                        name={charger.status === 'occupied' ? 'lock' : 'lock-open'} 
                                        size={18} 
                                        color="#fff" 
                                    />
                                </TouchableOpacity>
                            </View>

                            {charger.status === 'occupied' && (
                                <View style={styles.chargerDetails}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Current User:</Text>
                                        <Text style={styles.detailValue}>{charger.currentUser}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Vehicle ID:</Text>
                                        <Text style={styles.detailValue}>{charger.vehicleId}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Time Remaining:</Text>
                                        <Text style={styles.detailValue}>{charger.timeRemaining} min</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.forceReleaseButton}
                                        onPress={() => forceRelease(charger.id)}
                                    >
                                        <Ionicons name="warning" size={16} color="#fff" />
                                        <Text style={styles.forceReleaseText}>Force Release</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={24} color="#5B9BD5" />
                <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Manual Lock Control</Text>
                    <Text style={styles.infoText}>Toggle charger locks to manage availability and manually mark slots as occupied or available.</Text>
                </View>
            </View>

            <View style={{ height: 20 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        backgroundColor: '#5B9BD5',
        padding: 20,
        paddingTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    stationName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    stationId: {
        fontSize: 13,
        color: '#E8F4FB',
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    livePulse: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00FF88',
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00FF88',
        marginRight: 4,
    },
    liveText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    lastUpdateText: {
        fontSize: 11,
        color: '#E8F4FB',
        opacity: 0.8,
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2C3E50',
        marginVertical: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#7F8C8D',
        textAlign: 'center',
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    connectionStatus: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3E50',
    },
    chargerCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    chargerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    chargerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    chargerId: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
    },
    toggleButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    chargerDetails: {
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    detailLabel: {
        fontSize: 13,
        color: '#7F8C8D',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 13,
        color: '#2C3E50',
        fontWeight: '600',
    },
    forceReleaseButton: {
        backgroundColor: '#E74C3C',
        borderRadius: 8,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
    },
    forceReleaseText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 12,
    },
    infoCard: {
        marginHorizontal: 16,
        marginVertical: 16,
        backgroundColor: '#E8F4FB',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5B9BD5',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 12,
        color: '#7F8C8D',
        lineHeight: 18,
    },
});
