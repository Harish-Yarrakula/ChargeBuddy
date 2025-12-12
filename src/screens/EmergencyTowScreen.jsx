import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function EmergencyTowScreen() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [selectedTowService, setSelectedTowService] = useState(null);
    const [additionalDetails, setAdditionalDetails] = useState('');

    const towServices = [
        {
            id: 1,
            name: 'AAA Towing Service',
            phone: '+1-800-AAA-HELP',
            rating: 4.8,
            eta: '15-20 mins',
            coverage: 'Nationwide',
            features: ['GPS Tracking', '24/7 Support', 'Insurance Accepted'],
            costEstimate: '₹2,500 - ₹4,000'
        },
        {
            id: 2,
            name: 'QuickTow EV Specialists',
            phone: '+1-888-QUICKTOW',
            rating: 4.9,
            eta: '12-18 mins',
            coverage: 'Major Cities',
            features: ['EV Expert', 'Same Day', 'Roadside Assist'],
            costEstimate: '₹2,000 - ₹3,500'
        },
        {
            id: 3,
            name: 'Emergency Roadside Plus',
            phone: '+1-800-ROADPLUS',
            rating: 4.6,
            eta: '20-25 mins',
            coverage: 'All areas',
            features: ['Battery Service', 'Parts Delivery', 'Mobile Repair'],
            costEstimate: '₹1,800 - ₹3,000'
        },
    ];

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const user = await AsyncStorage.getItem('user');
            if (user) {
                setUserData(JSON.parse(user));
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCallTowService = (phone) => {
        Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
    };

    const handleRequestTow = async (service) => {
        if (!selectedTowService && !service) {
            Alert.alert('Select Service', 'Please select a tow service first');
            return;
        }

        const chosen = service || towServices.find(s => s.id === selectedTowService);

        Alert.alert(
            'Confirm Tow Request',
            `Request tow from ${chosen.name}?\n\nETA: ${chosen.eta}\nEstimated Cost: ${chosen.costEstimate}`,
            [
                {
                    text: 'Cancel',
                    onPress: () => {},
                    style: 'cancel'
                },
                {
                    text: 'Call Service',
                    onPress: () => handleCallTowService(chosen.phone),
                    style: 'default'
                },
                {
                    text: 'Request Online',
                    onPress: () => submitTowRequest(chosen),
                    style: 'default'
                }
            ]
        );
    };

    const submitTowRequest = async (service) => {
        setRequesting(true);
        try {
            // Simulate tow request
            const towRequest = {
                id: 'TOW' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                service: service.name,
                phone: service.phone,
                userName: userData?.name || 'User',
                carModel: userData?.carModel || 'Unknown',
                status: 'confirmed',
                eta: service.eta,
                timestamp: new Date().toISOString(),
                details: additionalDetails,
                location: 'Current Location'
            };

            // Save to AsyncStorage
            const requests = await AsyncStorage.getItem('towRequests');
            const allRequests = requests ? JSON.parse(requests) : [];
            allRequests.push(towRequest);
            await AsyncStorage.setItem('towRequests', JSON.stringify(allRequests));

            Alert.alert(
                'Tow Request Confirmed! ✓',
                `${service.name}\nReference: ${towRequest.id}\nETA: ${service.eta}\n\nA representative will contact you shortly.`,
                [
                    {
                        text: 'Track Status',
                        onPress: () => {
                            router.push({
                                pathname: '/tow-status',
                                params: { requestId: towRequest.id }
                            });
                        }
                    },
                    {
                        text: 'Done',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to submit tow request. Please call directly.');
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#E74C3C" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.emergencyHeader}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={32} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Ionicons name="warning" size={32} color="#fff" />
                    <Text style={styles.headerTitle}>Emergency Tow</Text>
                </View>
                <View style={{ width: 32 }} />
            </View>

            {/* Emergency Info */}
            <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={24} color="#E74C3C" />
                <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Need Quick Help?</Text>
                    <Text style={styles.infoText}>
                        Request professional EV towing service. Our partners are trained in electric vehicle safety.
                    </Text>
                </View>
            </View>

            {/* Quick Emergency Calls */}
            <View style={styles.quickCallSection}>
                <Text style={styles.sectionTitle}>Quick Emergency Numbers</Text>
                <View style={styles.quickCallRow}>
                    <TouchableOpacity 
                        style={styles.quickCallButton}
                        onPress={() => handleCallTowService('911')}
                    >
                        <Ionicons name="call" size={20} color="#fff" />
                        <Text style={styles.quickCallText}>Emergency (911)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.quickCallButton, { backgroundColor: '#3498DB' }]}
                        onPress={() => handleCallTowService('18005551212')}
                    >
                        <Ionicons name="phone-portrait" size={20} color="#fff" />
                        <Text style={styles.quickCallText}>1-800-555-1212</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tow Services */}
            <View style={styles.servicesSection}>
                <Text style={styles.sectionTitle}>Available Tow Services</Text>

                {towServices.map((service) => (
                    <TouchableOpacity
                        key={service.id}
                        style={[
                            styles.serviceCard,
                            selectedTowService === service.id && styles.serviceCardSelected
                        ]}
                        onPress={() => setSelectedTowService(service.id)}
                    >
                        <View style={styles.serviceHeader}>
                            <View style={styles.serviceInfo}>
                                <Text style={styles.serviceName}>{service.name}</Text>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={14} color="#FFD700" />
                                    <Text style={styles.rating}>{service.rating}</Text>
                                    <Text style={styles.coverage}>• {service.coverage}</Text>
                                </View>
                            </View>
                            <View style={[
                                styles.checkbox,
                                selectedTowService === service.id && styles.checkboxActive
                            ]}>
                                {selectedTowService === service.id && (
                                    <Ionicons name="checkmark" size={18} color="#fff" />
                                )}
                            </View>
                        </View>

                        {/* ETA & Cost */}
                        <View style={styles.etaCostRow}>
                            <View style={styles.etaBadge}>
                                <Ionicons name="time" size={14} color="#3498DB" />
                                <Text style={styles.etaText}>{service.eta}</Text>
                            </View>
                            <View style={styles.costBadge}>
                                <Ionicons name="cash" size={14} color="#27AE60" />
                                <Text style={styles.costText}>{service.costEstimate}</Text>
                            </View>
                        </View>

                        {/* Features */}
                        <View style={styles.featuresRow}>
                            {service.features.map((feature, idx) => (
                                <View key={idx} style={styles.featureBadge}>
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => handleCallTowService(service.phone)}
                            >
                                <Ionicons name="call" size={16} color="#fff" />
                                <Text style={styles.callButtonText}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.requestButton}
                                onPress={() => handleRequestTow(service)}
                            >
                                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                <Text style={styles.requestButtonText}>Request</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Additional Details */}
            <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
                <TextInput
                    style={styles.detailsInput}
                    placeholder="Describe your situation..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    value={additionalDetails}
                    onChangeText={setAdditionalDetails}
                />
            </View>

            {/* Submit Button */}
            {selectedTowService && (
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => handleRequestTow()}
                    disabled={requesting}
                >
                    {requesting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>Request Selected Service</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}

            {/* Safety Tips */}
            <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>Safety Tips</Text>
                <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                    <Text style={styles.tipText}>Turn on hazard lights and move to safety</Text>
                </View>
                <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                    <Text style={styles.tipText}>Share your location with the service</Text>
                </View>
                <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                    <Text style={styles.tipText}>Keep your phone charged and nearby</Text>
                </View>
                <View style={styles.tipItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                    <Text style={styles.tipText}>Do not attempt repairs if unsafe</Text>
                </View>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    emergencyHeader: {
        backgroundColor: '#E74C3C',
        paddingHorizontal: 15,
        paddingVertical: 16,
        paddingTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    infoCard: {
        backgroundColor: '#FADBD8',
        marginHorizontal: 12,
        marginVertical: 16,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#E74C3C',
        flexDirection: 'row',
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#E74C3C',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 12,
        color: '#7F8C8D',
        lineHeight: 18,
    },
    quickCallSection: {
        paddingHorizontal: 12,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 12,
    },
    quickCallRow: {
        flexDirection: 'row',
        gap: 12,
    },
    quickCallButton: {
        flex: 1,
        backgroundColor: '#E74C3C',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        gap: 8,
        elevation: 3,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    quickCallText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    servicesSection: {
        paddingHorizontal: 12,
        marginBottom: 20,
    },
    serviceCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        elevation: 2,
    },
    serviceCardSelected: {
        borderColor: '#5B9BD5',
        backgroundColor: '#E8F4FB',
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 6,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rating: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFD700',
    },
    coverage: {
        fontSize: 12,
        color: '#7F8C8D',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: '#5B9BD5',
        borderColor: '#5B9BD5',
    },
    etaCostRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    etaBadge: {
        backgroundColor: '#E8F4FB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    etaText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#3498DB',
    },
    costBadge: {
        backgroundColor: '#E8F9F0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    costText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#27AE60',
    },
    featuresRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    featureBadge: {
        backgroundColor: '#F2F6FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    featureText: {
        fontSize: 11,
        color: '#5B9BD5',
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    callButton: {
        flex: 1,
        backgroundColor: '#3498DB',
        borderRadius: 8,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    callButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    requestButton: {
        flex: 1,
        backgroundColor: '#27AE60',
        borderRadius: 8,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    requestButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    detailsSection: {
        paddingHorizontal: 12,
        marginBottom: 20,
    },
    detailsInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#2C3E50',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        textAlignVertical: 'top',
    },
    submitButton: {
        marginHorizontal: 12,
        backgroundColor: '#E74C3C',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        elevation: 4,
        marginBottom: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    tipsCard: {
        marginHorizontal: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#27AE60',
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 12,
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
});
