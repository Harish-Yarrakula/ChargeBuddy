import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { API_CONFIG } from '../config/apiConfig';

const MapsScreen = ({ router }) => {
    const [location, setLocation] = useState(null);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStation, setSelectedStation] = useState(null);
    const [pendingNavStation, setPendingNavStation] = useState(null);
    const [routeCoords, setRouteCoords] = useState([]);
    const [routeInfo, setRouteInfo] = useState(null);
    const params = useLocalSearchParams();

    // Haversine distance (km)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    };

    // Decode Google polyline
    const decodePolyline = (t) => {
        let points = [];
        let index = 0, lat = 0, lng = 0;
        while (index < t.length) {
            let b, shift = 0, result = 0;
            do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
            const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
            lat += dlat;
            shift = 0; result = 0;
            do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
            const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
            lng += dlng;
            points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
        }
        return points;
    };

    useEffect(() => {
        requestLocationAndFetchStations();
    }, []);

    // Handle station param (from booking)
    useEffect(() => {
        if (params?.station) {
            try {
                const parsed = JSON.parse(decodeURIComponent(params.station));
                setSelectedStation(parsed);
                setPendingNavStation(parsed);
            } catch (err) {
                console.log('Map station param parse error:', err);
            }
        }
    }, [params?.station]);

    // Kick off directions when we have both location and pending station
    useEffect(() => {
        if (pendingNavStation && location) {
            handleGetDirections(pendingNavStation);
            setPendingNavStation(null);
        }
    }, [pendingNavStation, location]);

    const requestLocationAndFetchStations = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Location permission is required to show nearby charging stations.');
                setLoading(false);
                setError('Permission denied');
                return;
            }

            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation(loc.coords);
            await fetchStations(loc.coords.latitude, loc.coords.longitude);
        } catch (err) {
            console.log(err);
            Alert.alert('Error', 'Unable to get your location. Please try again.');
            setError(err.message);
            setLoading(false);
        }
    };

    const fetchStations = async (lat, lng) => {
        try {
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&keyword=electric%20vehicle%20charging&key=${API_CONFIG.GOOGLE_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            let stationsData = [];
            if (data.status === 'OK' && data.results && data.results.length > 0) {
                stationsData = data.results.map(place => {
                    const distance = calculateDistance(
                        lat,
                        lng,
                        place.geometry.location.lat,
                        place.geometry.location.lng
                    );
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
                        Connections: [{ Type: 'Unknown' }],
                        StatusType: { Title: place.opening_hours?.open_now ? 'Open' : 'Closed' },
                        Rating: place.rating || 0,
                        OpeningHours: place.opening_hours
                    };
                });

                stationsData = stationsData.sort((a, b) => {
                    const da = parseFloat(a.AddressInfo.Distance);
                    const db = parseFloat(b.AddressInfo.Distance);
                    if (isNaN(da)) return 1;
                    if (isNaN(db)) return -1;
                    return da - db;
                });
            }

            if (stationsData.length === 0) {
                stationsData = [
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
                        Connections: [{ Type: 'Tesla' }],
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
                        Connections: [{ Type: 'CCS' }, { Type: 'Type 2' }],
                        StatusType: { Title: 'Operational' }
                    }
                ];
            }

            setStations(stationsData);
            setLoading(false);
        } catch (err) {
            console.log('Fetch error:', err);
            Alert.alert('Error', 'Failed to fetch charging stations.');
            setError(err.message);
            setLoading(false);
        }
    };

    const handleGetDirections = async (station) => {
        if (!location) return;

        const origin = `${location.latitude},${location.longitude}`;
        const destination = `${station.AddressInfo.Latitude},${station.AddressInfo.Longitude}`;

        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${API_CONFIG.GOOGLE_API_KEY}`
            );
            const data = await response.json();

            if (data.status === 'OK') {
                const route = data.routes[0];
                const distance = route.legs[0].distance.text;
                const duration = route.legs[0].duration.text;
                const points = decodePolyline(route.overview_polyline.points);
                setRouteCoords(points);
                setRouteInfo({ distance, duration });
            } else {
                Alert.alert('Directions', 'Could not fetch directions.');
            }
        } catch (err) {
            console.log('Error fetching directions:', err);
            Alert.alert('Error', 'Could not fetch directions. Please check your Google Maps API key.');
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#5B9BD5" />
                <Text style={styles.loadingText}>Loading map...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
                <Text style={styles.errorTitle}>Oops!</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={requestLocationAndFetchStations}
                >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const initialRegion = location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    } : {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.headerIconContainer}>
                        <Ionicons name="map" size={28} color="#fff" />
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Maps</Text>
                        <Text style={styles.headerSubtitle}>{stations.length} charging points</Text>
                    </View>
                </View>
                <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={() => {
                        setRouteCoords([]);
                        setRouteInfo(null);
                        requestLocationAndFetchStations();
                    }}
                >
                    <Ionicons name="refresh" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
                showsCompass={true}
                zoomEnabled={true}
                scrollEnabled={true}
            >
                {stations.map((station) => (
                    <Marker
                        key={station.ID}
                        coordinate={{
                            latitude: station.AddressInfo.Latitude,
                            longitude: station.AddressInfo.Longitude,
                        }}
                        title={station.AddressInfo.Title}
                        description={`${station.AddressInfo.AddressLine1}, ${station.AddressInfo.Town || ''}`}
                        onPress={() => setSelectedStation(station)}
                    >
                        <View style={styles.customMarker}>
                            <Ionicons name="battery-charging" size={16} color="#fff" />
                        </View>
                    </Marker>
                ))}

                {routeCoords.length > 0 && (
                    <Polyline
                        coordinates={routeCoords}
                        strokeColor="#5B9BD5"
                        strokeWidth={4}
                    />
                )}
            </MapView>

            {routeInfo && (
                <View style={styles.routeChip}>
                    <Ionicons name="navigate" size={16} color="#fff" />
                    <Text style={styles.routeChipText}>{routeInfo.distance} • {routeInfo.duration}</Text>
                </View>
            )}

            {selectedStation && (
                <View style={styles.stationCard}>
                    <View style={styles.stationHeader}>
                        <View style={styles.stationTitleContainer}>
                            <Text style={styles.stationName} numberOfLines={1}>
                                {selectedStation.AddressInfo.Title}
                            </Text>
                            <Text style={styles.stationAddress} numberOfLines={1}>
                                {selectedStation.AddressInfo.AddressLine1}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setSelectedStation(null);
                                setRouteCoords([]);
                                setRouteInfo(null);
                            }}
                        >
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.stationActions}>
                        <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleGetDirections(selectedStation)}
                        >
                            <Ionicons name="navigate" size={18} color="#007AFF" />
                            <Text style={styles.actionButtonText}>Directions</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => {
                                if (router) {
                                    router.push({
                                        pathname: '/station-details',
                                        params: { station: encodeURIComponent(JSON.stringify(selectedStation)) }
                                    });
                                }
                            }}
                        >
                            <Ionicons name="information-circle" size={18} color="#007AFF" />
                            <Text style={styles.actionButtonText}>Details</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
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
        paddingBottom: 16,
        paddingHorizontal: 20,
        shadowColor: '#5B9BD5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        flex: 1,
    },
    routeChip: {
        position: 'absolute',
        top: 120,
        alignSelf: 'center',
        backgroundColor: '#5B9BD5',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 6,
    },
    routeChipText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    },
    stationCard: {
        position: 'absolute',
        bottom: 70,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 16,
        shadowColor: '#2C3E50',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
        maxHeight: 200,
    },
    stationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    stationTitleContainer: {
        flex: 1,
        marginRight: 12,
    },
    stationName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3E50',
    },
    stationAddress: {
        fontSize: 14,
        color: '#7F8C8D',
        marginTop: 4,
    },
    closeButton: {
        padding: 4,
    },
    stationActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#E8F4FB',
        gap: 6,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5B9BD5',
    },
    customMarker: {
        backgroundColor: '#5B9BD5',
        padding: 4,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
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
});

export default MapsScreen;