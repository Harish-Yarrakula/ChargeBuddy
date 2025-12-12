import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TowStatusScreen() {
    const router = useRouter();
    const { requestId } = useLocalSearchParams();
    const [towRequest, setTowRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [towArrived, setTowArrived] = useState(false);

    useEffect(() => {
        loadTowStatus();
        // Simulate tow arrival after 2 minutes
        const timer = setTimeout(() => {
            setTowArrived(true);
        }, 120000);
        return () => clearTimeout(timer);
    }, []);

    const loadTowStatus = async () => {
        try {
            const requests = await AsyncStorage.getItem('towRequests');
            if (requests) {
                const allRequests = JSON.parse(requests);
                const request = allRequests.find(r => r.id === requestId);
                if (request) {
                    setTowRequest(request);
                }
            }
        } catch (error) {
            console.error('Error loading tow status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCallDriver = () => {
        if (towRequest?.phone) {
            Linking.openURL(`tel:${towRequest.phone.replace(/\D/g, '')}`);
        }
    };

    const handleCancelRequest = () => {
        Alert.alert(
            'Cancel Request',
            'Are you sure you want to cancel this tow request?',
            [
                {
                    text: 'Keep Active',
                    onPress: () => {},
                    style: 'cancel'
                },
                {
                    text: 'Cancel Request',
                    onPress: async () => {
                        try {
                            const requests = await AsyncStorage.getItem('towRequests');
                            if (requests) {
                                const allRequests = JSON.parse(requests);
                                const updated = allRequests.filter(r => r.id !== requestId);
                                await AsyncStorage.setItem('towRequests', JSON.stringify(updated));
                            }
                            Alert.alert('Cancelled', 'Tow request has been cancelled');
                            router.back();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to cancel request');
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#5B9BD5" />
            </View>
        );
    }

    if (!towRequest) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={32} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Tow Status</Text>
                    <View style={{ width: 32 }} />
                </View>
                <View style={[styles.centerContainer, { justifyContent: 'center' }]}>
                    <Ionicons name="alert-circle" size={48} color="#CCC" />
                    <Text style={styles.errorText}>Request not found</Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={32} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tow Status</Text>
                <View style={{ width: 32 }} />
            </View>

            {/* Status Badge */}
            <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: towArrived ? '#27AE60' : '#3498DB' }]}>
                    <Ionicons 
                        name={towArrived ? 'checkmark-circle' : 'timer'} 
                        size={32} 
                        color="#fff" 
                    />
                </View>
                <Text style={styles.statusTitle}>
                    {towArrived ? 'Tow Vehicle Arrived!' : 'Tow Vehicle On the Way'}
                </Text>
                <Text style={styles.statusSubtitle}>
                    {towRequest.service}
                </Text>
            </View>

            {/* Request Details */}
            <View style={styles.detailsCard}>
                <Text style={styles.cardTitle}>Request Details</Text>
                
                <View style={styles.detailRow}>
                    <View style={styles.detailLabel}>
                        <Ionicons name="document" size={16} color="#5B9BD5" />
                        <Text style={styles.label}>Reference ID</Text>
                    </View>
                    <Text style={styles.value}>{towRequest.id}</Text>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.detailLabel}>
                        <Ionicons name="time" size={16} color="#F39C12" />
                        <Text style={styles.label}>ETA</Text>
                    </View>
                    <Text style={styles.value}>{towRequest.eta}</Text>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.detailLabel}>
                        <Ionicons name="car" size={16} color="#E67E22" />
                        <Text style={styles.label}>Your Vehicle</Text>
                    </View>
                    <Text style={styles.value}>{towRequest.carModel}</Text>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.detailLabel}>
                        <Ionicons name="location" size={16} color="#E74C3C" />
                        <Text style={styles.label}>Location</Text>
                    </View>
                    <Text style={styles.value}>{towRequest.location}</Text>
                </View>

                {towRequest.details && (
                    <View style={styles.detailRow}>
                        <View style={styles.detailLabel}>
                            <Ionicons name="document-text" size={16} color="#7F8C8D" />
                            <Text style={styles.label}>Details</Text>
                        </View>
                        <Text style={styles.valueMulti}>{towRequest.details}</Text>
                    </View>
                )}
            </View>

            {/* Service Provider Info */}
            <View style={styles.serviceCard}>
                <Text style={styles.cardTitle}>Service Provider</Text>

                <View style={styles.providerInfo}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="car" size={32} color="#fff" />
                    </View>
                    <View style={styles.providerDetails}>
                        <Text style={styles.providerName}>{towRequest.service}</Text>
                        <View style={styles.contactRow}>
                            <Ionicons name="phone" size={14} color="#5B9BD5" />
                            <Text style={styles.phone}>{towRequest.phone}</Text>
                        </View>
                    </View>
                </View>

                {/* Call Button */}
                <TouchableOpacity 
                    style={styles.callButton}
                    onPress={handleCallDriver}
                >
                    <Ionicons name="call" size={20} color="#fff" />
                    <Text style={styles.callButtonText}>Call Service</Text>
                </TouchableOpacity>
            </View>

            {/* Live Tracking (Mock) */}
            <View style={styles.trackingCard}>
                <Text style={styles.cardTitle}>Live Tracking</Text>
                
                <View style={styles.timeline}>
                    <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: '#27AE60' }]} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Request Accepted</Text>
                            <Text style={styles.timelineTime}>Just now</Text>
                        </View>
                    </View>

                    <View style={styles.timelineConnector} />

                    <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: '#3498DB' }]} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Driver En Route</Text>
                            <Text style={styles.timelineTime}>2-3 mins away</Text>
                        </View>
                    </View>

                    <View style={styles.timelineConnector} />

                    <View style={styles.timelineItem}>
                        <View style={[
                            styles.timelineDot, 
                            { backgroundColor: towArrived ? '#27AE60' : '#E0E0E0' }
                        ]} />
                        <View style={styles.timelineContent}>
                            <Text style={[
                                styles.timelineTitle,
                                { color: towArrived ? '#27AE60' : '#CCC' }
                            ]}>
                                Driver Arrived
                            </Text>
                            <Text style={[
                                styles.timelineTime,
                                { color: towArrived ? '#27AE60' : '#CCC' }
                            ]}>
                                {towArrived ? 'Arrived!' : 'Arriving soon'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Safety Tips During Wait */}
            <View style={styles.tipsCard}>
                <Text style={styles.cardTitle}>While You Wait</Text>
                <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                    <Text style={styles.tipText}>Stay in your vehicle with doors locked</Text>
                </View>
                <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                    <Text style={styles.tipText}>Keep hazard lights on</Text>
                </View>
                <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                    <Text style={styles.tipText}>Have your ID and vehicle documents ready</Text>
                </View>
                <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                    <Text style={styles.tipText}>Share your live location with emergency contacts</Text>
                </View>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelRequest}
            >
                <Ionicons name="close-circle" size={20} color="#E74C3C" />
                <Text style={styles.cancelButtonText}>Cancel Request</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
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
        backgroundColor: '#5B9BD5',
        paddingHorizontal: 15,
        paddingVertical: 16,
        paddingTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    errorText: {
        fontSize: 16,
        color: '#2C3E50',
        marginTop: 16,
    },
    statusContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#fff',
        marginVertical: 12,
        marginHorizontal: 12,
        borderRadius: 12,
    },
    statusBadge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 4,
    },
    statusSubtitle: {
        fontSize: 14,
        color: '#7F8C8D',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 16,
    },
    detailsCard: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    detailLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        fontSize: 13,
        color: '#7F8C8D',
        fontWeight: '500',
    },
    value: {
        fontSize: 13,
        color: '#2C3E50',
        fontWeight: '600',
        maxWidth: '50%',
        textAlign: 'right',
    },
    valueMulti: {
        fontSize: 12,
        color: '#7F8C8D',
        maxWidth: '50%',
        textAlign: 'right',
        lineHeight: 16,
    },
    serviceCard: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    providerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#5B9BD5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    providerDetails: {
        flex: 1,
    },
    providerName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 4,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    phone: {
        fontSize: 13,
        color: '#5B9BD5',
        fontWeight: '600',
    },
    callButton: {
        backgroundColor: '#5B9BD5',
        borderRadius: 8,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    callButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    trackingCard: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    timeline: {
        marginLeft: 8,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
        marginTop: 4,
    },
    timelineConnector: {
        width: 2,
        height: 20,
        backgroundColor: '#E0E0E0',
        marginLeft: 5,
        marginVertical: -8,
    },
    timelineContent: {
        flex: 1,
    },
    timelineTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 2,
    },
    timelineTime: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    tipsCard: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#27AE60',
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    tipText: {
        fontSize: 12,
        color: '#7F8C8D',
        flex: 1,
    },
    cancelButton: {
        marginHorizontal: 12,
        backgroundColor: '#fff',
        borderColor: '#E74C3C',
        borderWidth: 2,
        borderRadius: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    cancelButtonText: {
        color: '#E74C3C',
        fontWeight: '700',
        fontSize: 14,
    },
});
