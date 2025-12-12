import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getQueueStatus, reportNoShow } from '../config/chargingService';

export default function QueueStatusScreen() {
    const router = useRouter();
    const { stationId, bookingId } = useLocalSearchParams();
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [queueData, setQueueData] = useState(null);
    const [userBooking, setUserBooking] = useState(null);

    useEffect(() => {
        fetchQueueStatus();
        loadUserBooking();
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchQueueStatus, 30000);
        return () => clearInterval(interval);
    }, [stationId]);

    const fetchQueueStatus = async () => {
        try {
            const result = await getQueueStatus(stationId);
            if (result.success) {
                setQueueData(result.data);
            }
        } catch (error) {
            console.error('Error fetching queue status:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserBooking = async () => {
        try {
            const booking = await AsyncStorage.getItem('lastBooking');
            if (booking) {
                setUserBooking(JSON.parse(booking));
            }
        } catch (error) {
            console.error('Error loading booking:', error);
        }
    };

    const handleNoShow = async () => {
        Alert.alert(
            'No-Show Confirmation',
            'Are you not arriving for your slot? This will reallocate your slot to the next person.',
            [
                { text: 'Cancel', onPress: () => {} },
                {
                    text: 'Confirm No-Show',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            const result = await reportNoShow(token || 'guest', bookingId);
                            if (result.success) {
                                Alert.alert('Slot Reallocated', 'Your slot has been given to the next person in queue.');
                                router.back();
                            }
                        } catch (error) {
                            Alert.alert('Error', error.message);
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchQueueStatus();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#5B9BD5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={32} color="#5B9BD5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Queue Status</Text>
                <TouchableOpacity onPress={fetchQueueStatus}>
                    <Ionicons name="refresh" size={24} color="#5B9BD5" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={[]}
                renderItem={() => null}
                ListHeaderComponent={
                    <>
                        {/* Your Position */}
                        {userBooking && (
                            <View style={styles.card}>
                                <View style={styles.yourPositionBadge}>
                                    <Ionicons name="person" size={20} color="#fff" />
                                    <Text style={styles.yourPositionText}>Your Position</Text>
                                </View>
                                
                                <View style={styles.positionInfo}>
                                    <View style={styles.positionCircle}>
                                        <Text style={styles.positionNumber}>{userBooking.queuePosition || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.positionDetails}>
                                        <Text style={styles.detailLabel}>Position in Queue</Text>
                                        <Text style={styles.detailValue}>
                                            {userBooking.queuePosition === 1 ? 'You are next!' : `${userBooking.queuePosition - 1} people ahead`}
                                        </Text>
                                        <Text style={styles.estimatedTime}>
                                            Est. wait: {((userBooking.queuePosition - 1) * 30)} min
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    style={styles.noShowButton}
                                    onPress={handleNoShow}
                                >
                                    <Ionicons name="close-circle" size={20} color="#E74C3C" />
                                    <Text style={styles.noShowButtonText}>Report No-Show</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Queue Statistics */}
                        <View style={styles.statsContainer}>
                            <View style={[styles.statCard, styles.statActive]}>
                                <Ionicons name="people" size={28} color="#5B9BD5" />
                                <Text style={styles.statNumber}>{queueData?.totalInQueue || 0}</Text>
                                <Text style={styles.statLabel}>Total in Queue</Text>
                            </View>
                            
                            <View style={[styles.statCard, styles.statWaiting]}>
                                <Ionicons name="hourglass" size={28} color="#F39C12" />
                                <Text style={styles.statNumber}>{queueData?.totalWaiting || 0}</Text>
                                <Text style={styles.statLabel}>Waiting</Text>
                            </View>

                            <View style={[styles.statCard, styles.statTime]}>
                                <Ionicons name="timer" size={28} color="#27AE60" />
                                <Text style={styles.statNumber}>{queueData?.averageWaitTime || 0}m</Text>
                                <Text style={styles.statLabel}>Avg Wait</Text>
                            </View>
                        </View>

                        {/* Queue List */}
                        <View style={styles.queueListContainer}>
                            <Text style={styles.listTitle}>Queue Order</Text>
                            {queueData?.queue && queueData.queue.length > 0 ? (
                                queueData.queue.map((entry, index) => (
                                    <View key={index} style={styles.queueItem}>
                                        <View style={styles.queueNumber}>
                                            <Text style={styles.queueNumberText}>{index + 1}</Text>
                                        </View>
                                        <View style={styles.queueInfo}>
                                            <Text style={styles.queueName}>
                                                {entry.userId?.name || `User ${index + 1}`}
                                            </Text>
                                            <Text style={styles.queueStatus}>
                                                {entry.status === 'active' ? '🔴 Charging' : '⏳ Waiting'}
                                            </Text>
                                        </View>
                                        <View style={[
                                            styles.queueStatusBadge,
                                            entry.status === 'active' && styles.activeStatus
                                        ]}>
                                            <Text style={styles.statusText}>
                                                {entry.status === 'active' ? 'Active' : 'Next'}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyQueue}>
                                    <Ionicons name="checkmark-circle" size={40} color="#27AE60" />
                                    <Text style={styles.emptyText}>Queue is empty!</Text>
                                </View>
                            )}
                        </View>

                        {/* Safety Info */}
                        <View style={styles.infoCard}>
                            <Ionicons name="information-circle" size={20} color="#5B9BD5" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoTitle}>Queue Management</Text>
                                <Text style={styles.infoText}>• Slots are automatically allocated in order</Text>
                                <Text style={styles.infoText}>• No-show slots go to next in queue</Text>
                                <Text style={styles.infoText}>• Estimated 30 min per charging slot</Text>
                            </View>
                        </View>

                        <View style={styles.spacing} />
                    </>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
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
        marginVertical: 12,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    yourPositionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5B9BD5',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 16,
        width: '50%',
    },
    yourPositionText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 12,
    },
    positionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
    },
    positionCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F4FB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 3,
        borderColor: '#5B9BD5',
    },
    positionNumber: {
        fontSize: 36,
        fontWeight: '700',
        color: '#5B9BD5',
    },
    positionDetails: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: '#7F8C8D',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
    },
    estimatedTime: {
        fontSize: 13,
        color: '#5B9BD5',
        marginTop: 4,
        fontWeight: '500',
    },
    noShowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E74C3C',
        gap: 8,
    },
    noShowButtonText: {
        color: '#E74C3C',
        fontWeight: '600',
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        marginHorizontal: 12,
        marginVertical: 8,
        gap: 10,
    },
    statCard: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statActive: {
        backgroundColor: '#E8F4FB',
    },
    statWaiting: {
        backgroundColor: '#FFF8E8',
    },
    statTime: {
        backgroundColor: '#E8F5E9',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2C3E50',
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#7F8C8D',
        textAlign: 'center',
    },
    queueListContainer: {
        marginHorizontal: 12,
        marginVertical: 12,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 12,
    },
    queueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    queueNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E8F4FB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    queueNumberText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#5B9BD5',
    },
    queueInfo: {
        flex: 1,
    },
    queueName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2C3E50',
    },
    queueStatus: {
        fontSize: 12,
        color: '#7F8C8D',
        marginTop: 2,
    },
    queueStatusBadge: {
        backgroundColor: '#FFF8E8',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    activeStatus: {
        backgroundColor: '#E8F5E9',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#F39C12',
    },
    emptyQueue: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    emptyText: {
        marginTop: 10,
        fontSize: 14,
        color: '#7F8C8D',
        fontWeight: '500',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#F0F7FF',
        marginHorizontal: 12,
        marginVertical: 12,
        padding: 12,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#5B9BD5',
    },
    infoContent: {
        marginLeft: 12,
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 12,
        color: '#7F8C8D',
        marginVertical: 2,
    },
    spacing: {
        height: 40,
    },
});
