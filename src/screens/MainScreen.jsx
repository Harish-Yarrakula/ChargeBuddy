import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { Component } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export class MainScreen extends Component {
    constructor(props) {
        super(props)
        this.state = {
            stations: [],
            loading: true,
            error: null,
            carInfo: null,
            batteryPct: null
        }
    }
    
    componentDidMount() {
        this.loadUserCarData().finally(() => {
            this.requestLocationPermission()
        })
    }

    loadUserCarData = async () => {
        try {
            const raw = await AsyncStorage.getItem('user')
            if (!raw) return
            const parsed = JSON.parse(raw)
            const batteryPct = typeof parsed?.batteryPercentage === 'number' ? parsed.batteryPercentage : null
            const carInfo = {
                car: parsed?.car || null,
                brand: parsed?.carBrand || null,
                model: parsed?.carModel || null,
                variant: parsed?.carVariant || null,
                kwh: parsed?.carKwh || null
            }
            this.setState({ carInfo, batteryPct })
        } catch (error) {
            console.log('loadUserCarData error:', error)
        }
    }

    getCarImage = (carValue) => {
        const carImages = {
            'tesla_m3_sr': require('../../assets/images/tesla3.png'),
            'tesla_m3_lr': require('../../assets/images/tesla3.png'),
            'tesla_mY_lr': require('../../assets/images/teslay.png'),
            'nissan_leaf_40': require('../../assets/images/nleaf.png'),
            'nissan_leaf_62': require('../../assets/images/nleaf.png'),
            'hyundai_ioniq5_std': require('../../assets/images/hy5.png'),
            'hyundai_ioniq5_lr': require('../../assets/images/hy5.png'),
            'kia_ev6_std': require('../../assets/images/kia6.png'),
            'kia_ev6_lr': require('../../assets/images/kia6.png'),
        };
        return carImages[carValue] || null;
    }

    handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', onPress: () => {} },
                {
                    text: 'Logout',
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('user')
                            if (this.props.router) {
                                this.props.router.replace('/')
                            }
                        } catch (error) {
                            console.log('Logout error:', error)
                        }
                    },
                    style: 'destructive'
                }
            ]
        )
    }

    handleEmergencyTow = () => {
        if (this.props.router) {
            this.props.router.push('/emergency-tow')
        }
    }

    // Calculate distance between two coordinates using Haversine formula (in km)
    calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    }

    requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required to find charging stations near you.',
                    [{ text: 'OK' }]
                )
                this.setState({ loading: false, error: 'Permission denied' })
                return
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            })
            
            const { latitude, longitude } = location.coords
            this.fetchStations(latitude, longitude)
        } catch (error) {
            console.log(error)
            Alert.alert('Error', 'Unable to get your location. Please try again.')
            this.setState({ loading: false, error: error.message })
        }
    }

    fetchStations = async (lat, lng) => {
        try {
            // Import API_CONFIG at the top
            const { API_CONFIG } = await import('../config/apiConfig')
            
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&keyword=electric%20vehicle%20charging&key=${API_CONFIG.GOOGLE_API_KEY}`
            
            const response = await fetch(url)
            const data = await response.json()
            
            console.log('Google Places Response status:', data.status)
            console.log('Stations fetched:', data.results?.length || 0)
            
            let stationsData = []
            if (data.status === 'OK' && data.results && data.results.length > 0) {
                // Transform Google Places data to OpenChargeMap format for compatibility
                stationsData = data.results.map(place => {
                    // Calculate distance from user's current location to this station
                    const distance = this.calculateDistance(
                        lat, 
                        lng, 
                        place.geometry.location.lat, 
                        place.geometry.location.lng
                    )
                    
                    return {
                        ID: place.place_id,
                        AddressInfo: {
                            Title: place.name,
                            AddressLine1: place.vicinity || place.formatted_address || '',
                            Town: '',
                            Latitude: place.geometry.location.lat,
                            Longitude: place.geometry.location.lng,
                            Distance: distance
                        },
                        Connections: [{Type: 'Unknown'}],
                        StatusType: { Title: place.opening_hours?.open_now ? 'Open' : 'Closed' },
                        Rating: place.rating || 0,
                        OpeningHours: place.opening_hours
                    }
                })

                // Sort by nearest distance
                stationsData = stationsData.sort((a, b) => {
                    const da = parseFloat(a.AddressInfo.Distance)
                    const db = parseFloat(b.AddressInfo.Distance)
                    if (isNaN(da)) return 1
                    if (isNaN(db)) return -1
                    return da - db
                })
            }
            
            // If no stations found or API error, use mock data
            if (stationsData.length === 0) {
                console.log('No stations found from API, using mock data')
                const mockData = [
                    {
                        ID: 1,
                        AddressInfo: { 
                            Title: 'Tesla Supercharger - Demo Station 1', 
                            AddressLine1: '123 Main St',
                            Town: 'Demo City',
                            Distance: 0.5,
                            Latitude: lat,
                            Longitude: lng
                        },
                        Connections: [{Type: 'Tesla'}],
                        StatusType: { Title: 'Operational' }
                    },
                    {
                        ID: 2,
                        AddressInfo: { 
                            Title: 'EV Charging Hub - Demo Station 2', 
                            AddressLine1: '456 Oak Ave',
                            Town: 'Demo City',
                            Distance: 1.2,
                            Latitude: lat + 0.01,
                            Longitude: lng + 0.01
                        },
                        Connections: [{Type: 'CCS'}, {Type: 'Type 2'}],
                        StatusType: { Title: 'Operational' }
                    }
                ]
                stationsData = mockData
            }
            
            this.setState({ stations: stationsData, loading: false })
        } catch (error) {
            console.log('Fetch error:', error)
            Alert.alert('Error', 'Failed to fetch charging stations.')
            this.setState({ loading: false, error: error.message })
        }
    }

    renderItem = ({ item }) => {
        // Handle Distance which could be a number, string, or undefined
        let distance = 'N/A'
        if (typeof item.AddressInfo.Distance === 'number') {
            distance = item.AddressInfo.Distance.toFixed(2)
        } else if (typeof item.AddressInfo.Distance === 'string') {
            distance = item.AddressInfo.Distance
        }
        
        const connections = item.Connections?.length || 0
        const status = item.StatusType?.Title || 'Unknown'
        
        return (
            <TouchableOpacity 
                style={styles.card}
                onPress={() => {
                    // Navigate to station details
                    if (this.props.router) {
                        this.props.router.push({
                            pathname: '/station-details',
                            params: { station: encodeURIComponent(JSON.stringify(item)) }
                        })
                    }
                }}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="battery-charging" size={32} color="#5B9BD5" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.stationName} numberOfLines={1}>
                            {item.AddressInfo.Title}
                        </Text>
                        <Text style={styles.address} numberOfLines={2}>
                            {item.AddressInfo.AddressLine1}
                            {item.AddressInfo.Town && `, ${item.AddressInfo.Town}`}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.cardFooter}>
                    <View style={styles.infoItem}>
                        <Ionicons name="location" size={16} color="#7F8C8D" />
                        <Text style={styles.infoText}>{distance} km</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="flash" size={16} color="#7F8C8D" />
                        <Text style={styles.infoText}>{connections} ports</Text>
                    </View>
                    <View style={[styles.statusBadge, status === 'Operational' && styles.statusOperational]}>
                        <Text style={styles.statusText}>{status}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    render() {
        const { stations, loading, error } = this.state
        const carInfo = this.state.carInfo
        const batteryPct = typeof this.state.batteryPct === 'number' ? this.state.batteryPct : 50
        const usableKwh = carInfo?.kwh || 60
        const remainingKwh = Math.max(0, (usableKwh * batteryPct) / 100)
        const kmPerKwh = 6.5
        const estRangeKm = Math.round(remainingKwh * kmPerKwh)

        const speeds = [
            { label: 'Home (3.6 kW)', speed: 3.6 },
            { label: 'AC 7 kW', speed: 7 },
            { label: 'AC 11 kW', speed: 11 },
            { label: 'Fast 22 kW', speed: 22 },
        ]

        const formatHours = (hoursDecimal) => {
            const h = Math.floor(hoursDecimal)
            const m = Math.round((hoursDecimal - h) * 60)
            if (h <= 0 && m <= 0) return '0m'
            if (h <= 0) return `${m}m`
            if (m <= 0) return `${h}h`
            return `${h}h ${m}m`
        }

        const renderCarInfo = () => {
            const missing = !carInfo || !carInfo.car
            const deficitKwh = Math.max(0, usableKwh - remainingKwh)
            const carImage = carInfo?.car ? this.getCarImage(carInfo.car) : null
            return (
                <View style={styles.carCard}>
                    <View style={styles.carCardHeader}>
                        {carImage ? (
                            <View style={styles.carImageContainer}>
                                <Image source={carImage} style={styles.carImage} />
                            </View>
                        ) : (
                            <View style={styles.carIconWrap}>
                                <Ionicons name="car" size={22} color="#fff" />
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.carTitle} numberOfLines={1}>
                                {missing ? 'Set your EV to see estimates' : `${carInfo.brand} ${carInfo.model}`}
                            </Text>
                            <Text style={styles.carSubtitle} numberOfLines={1}>
                                {missing ? 'Add in profile (login/register)' : `${carInfo.variant || ''} • ${carInfo.kwh || usableKwh} kWh`}
                            </Text>
                        </View>
                        <View style={styles.batteryPill}>
                            <Ionicons name="battery-half" size={16} color="#5B9BD5" />
                            <Text style={styles.batteryPillText}>{batteryPct}%</Text>
                        </View>
                    </View>

                    <View style={styles.rangeRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="speedometer" size={18} color="#5B9BD5" />
                            <Text style={styles.rangeLabel}> Est. range now</Text>
                        </View>
                        <Text style={styles.rangeValue}>{estRangeKm} km</Text>
                    </View>

                    <View style={styles.chargeTimeRow}>
                        {speeds.map((item) => {
                            const hours = deficitKwh / item.speed
                            return (
                                <View key={item.speed} style={styles.chargePill}>
                                    <Text style={styles.chargeLabel}>{item.label}</Text>
                                    <Text style={styles.chargeValue}>{formatHours(hours)}</Text>
                                </View>
                            )
                        })}
                    </View>
                </View>
            )
        }

        if (loading) {
            return (
                <View style={[styles.container, styles.centered]}>
                    <ActivityIndicator size="large" color="#5B9BD5" />
                    <Text style={styles.loadingText}>Finding nearby charging stations...</Text>
                </View>
            )
        }

        if (error) {
            return (
                <View style={[styles.container, styles.centered]}>
                    <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
                    <Text style={styles.errorTitle}>Oops!</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={this.requestLocationPermission}
                    >
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            )
        }

        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerIconContainer}>
                            <Ionicons name="location-sharp" size={28} color="#fff" />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Nearby Stations</Text>
                            <Text style={styles.headerSubtitle}>
                                {(stations || []).length} charging points found
                            </Text>
                        </View>
                    </View>
                    <View style={styles.headerButtonsContainer}>
                        <TouchableOpacity
                            style={styles.emergencyButton}
                            onPress={this.handleEmergencyTow}
                        >
                            <Ionicons name="alert-circle" size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={this.handleLogout}
                        >
                            <Ionicons name="log-out" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
                <FlatList
                    data={stations}
                    renderItem={this.renderItem}
                    keyExtractor={(item) => item.ID.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={renderCarInfo}
                    ListHeaderComponentStyle={{ marginBottom: 12 }}
                />
            </View>
        )
    }
}

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
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#5B9BD5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
    },
    headerButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    emergencyButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#E74C3C',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E74C3C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    carCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    carCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    carIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#5B9BD5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    carImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#E8F4FB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    carImage: {
        width: 56,
        height: 56,
        resizeMode: 'contain',
    },
    carTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#2C3E50',
    },
    carSubtitle: {
        fontSize: 13,
        color: '#7F8C8D',
        marginTop: 2,
    },
    batteryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F4FB',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginLeft: 8,
    },
    batteryPillText: {
        color: '#5B9BD5',
        fontWeight: '700',
        marginLeft: 6,
    },
    rangeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    rangeLabel: {
        fontSize: 14,
        color: '#7F8C8D',
        marginLeft: 6,
    },
    rangeValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#5B9BD5',
    },
    chargeTimeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chargePill: {
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        minWidth: 110,
        marginRight: 8,
        marginBottom: 8,
    },
    chargeLabel: {
        fontSize: 12,
        color: '#7F8C8D',
        marginBottom: 2,
    },
    chargeValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2C3E50',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#2C3E50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#E8F4FB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    stationName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
    },
    address: {
        fontSize: 14,
        color: '#7F8C8D',
        lineHeight: 18,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    infoText: {
        fontSize: 14,
        color: '#7F8C8D',
        marginLeft: 4,
    },
    statusBadge: {
        marginLeft: 'auto',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#F2F2F7',
    },
    statusOperational: {
        backgroundColor: '#D4EDDA',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#27AE60',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#8E8E93',
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#8E8E93',
        textAlign: 'center',
        paddingHorizontal: 40,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#5B9BD5',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})

// Wrapper component to inject router
export default function MainScreenWrapper() {
    const router = useRouter()
    return <MainScreen router={router} />
}
