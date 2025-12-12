import data from '@/carmodels.json';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export default function LoginScreen() {
  const router = useRouter();
  const [userRole, setUserRole] = useState(null); // 'user' or 'owner'
  const [name, setName] = useState("");
  const [Percentage, setPercentage] = useState("");
  const [selectedCar, setSelectedCar] = useState(null);
  const [stationName, setStationName] = useState("");
  const [stationId, setStationId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user already has a session
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        // Route based on role
        if (userData.role === 'owner') {
          router.replace('/owner-dashboard');
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (error) {
      console.log("Error checking session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!userRole) {
      Alert.alert("Error", "Please select your role");
      return;
    }

    if (userRole === 'owner') {
      // Station Owner Login
      if (!stationName || !stationId) {
        Alert.alert("Error", "Please fill in all station details");
        return;
      }

      try {
        const ownerData = {
          role: 'owner',
          stationName,
          stationId,
          loginTime: new Date().toISOString(),
          chargers: Array.from({ length: Math.floor(Math.random() * 3) + 2 }, (_, i) => ({
            id: `CH${i + 1}`,
            status: Math.random() > 0.5 ? 'occupied' : 'available',
            vehicleId: Math.random() > 0.5 ? `VEH${Math.floor(Math.random() * 1000)}` : null,
            currentUser: Math.random() > 0.5 ? `User${Math.floor(Math.random() * 100)}` : null,
            timeRemaining: Math.floor(Math.random() * 120) + 10 // minutes
          }))
        };

        await AsyncStorage.setItem("user", JSON.stringify(ownerData));
        router.replace('/owner-dashboard');
      } catch (error) {
        Alert.alert("Error", "Failed to save session: " + error.message);
      }
    } else {
      // Regular User Login
      if (!name || !Percentage || !selectedCar) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      const batteryPercentage = parseInt(Percentage);
      if (isNaN(batteryPercentage) || batteryPercentage < 0 || batteryPercentage > 100) {
        Alert.alert("Error", "Battery percentage must be between 0 and 100");
        return;
      }

      try {
        // Find the selected car object from the data array
        const carObject = data.find(car => car.value === selectedCar);
        
        // Save user session to AsyncStorage
        const userData = {
          role: 'user',
          name,
          batteryPercentage,
          car: carObject.value,
          carBrand: carObject.brand,
          carModel: carObject.model,
          carVariant: carObject.variant,
          carKwh: carObject.kwh,
          loginTime: new Date().toISOString()
        };

        await AsyncStorage.setItem("user", JSON.stringify(userData));
        
        // Navigate to tabs on successful login
        router.replace("/(tabs)");
      } catch (error) {
        Alert.alert("Error", "Failed to save session: " + error.message);
      }
    }
  };
  // const data = [
  //   { id: 'tesla_m3_sr', label: 'Tesla Model 3 (Standard Range, 57 kWh)', value: 'tesla_m3_sr', brand: 'Tesla', model: 'Model 3', variant: 'Standard Range', kwh: 57, image: require('../../assets/images/tesla3.png') },
  //   { id: 'tesla_m3_lr', label: 'Tesla Model 3 (Long Range, 75 kWh)', value: 'tesla_m3_lr', brand: 'Tesla', model: 'Model 3', variant: 'Long Range', kwh: 75, image: require('../../assets/images/tesla3.png') },
  //   { id: 'tesla_mY_lr', label: 'Tesla Model Y (Long Range, 75 kWh)', value: 'tesla_mY_lr', brand: 'Tesla', model: 'Model Y', variant: 'Long Range', kwh: 75, image: require('../../assets/images/teslay.png') },
  //   { id: 'nissan_leaf_40', label: 'Nissan Leaf (40 kWh)', value: 'nissan_leaf_40', brand: 'Nissan', model: 'Leaf', variant: '40 kWh', kwh: 40, image: require('../../assets/images/nleaf.png') },
  //   { id: 'nissan_leaf_62', label: 'Nissan Leaf e+ (62 kWh)', value: 'nissan_leaf_62', brand: 'Nissan', model: 'Leaf e+', variant: '62 kWh', kwh: 62, image: require('../../assets/images/nleaf.png') },
  //   { id: 'hyundai_ioniq5_std', label: 'Hyundai Ioniq 5 (Standard, 58 kWh)', value: 'hyundai_ioniq5_std', brand: 'Hyundai', model: 'Ioniq 5', variant: 'Standard', kwh: 58, image: require('../../assets/images/hy5.png') },
  //   { id: 'hyundai_ioniq5_lr', label: 'Hyundai Ioniq 5 (Long Range, 77 kWh)', value: 'hyundai_ioniq5_lr', brand: 'Hyundai', model: 'Ioniq 5', variant: 'Long Range', kwh: 77, image: require('../../assets/images/hy5.png') },
  //   { id: 'kia_ev6_std', label: 'Kia EV6 (Standard, 58 kWh)', value: 'kia_ev6_std', brand: 'Kia', model: 'EV6', variant: 'Standard', kwh: 58, image: require('../../assets/images/kia6.png') },
  //   { id: 'kia_ev6_lr', label: 'Kia EV6 (Long Range, 77 kWh)', value: 'kia_ev6_lr', brand: 'Kia', model: 'EV6', variant: 'Long Range', kwh: 77, image: require('../../assets/images/kia6.png') },
  // ];

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome! 👋</Text>
        <Text style={styles.subtitle}>Select your role to continue</Text>

        {!userRole ? (
          // Role Selection Screen
          <View style={styles.roleButtonsContainer}>
            <TouchableOpacity 
              style={styles.roleButton}
              onPress={() => setUserRole('user')}
              activeOpacity={0.8}
            >
              <View style={styles.roleIconContainer}>
                <Text style={styles.roleIcon}>🚗</Text>
              </View>
              <Text style={styles.roleButtonText}>EV Driver</Text>
              <Text style={styles.roleButtonSubtext}>Book charging slots</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.roleButton, { backgroundColor: '#F39C12' }]}
              onPress={() => setUserRole('owner')}
              activeOpacity={0.8}
            >
              <View style={styles.roleIconContainer}>
                <Text style={styles.roleIcon}>⚙️</Text>
              </View>
              <Text style={styles.roleButtonText}>Station Owner</Text>
              <Text style={styles.roleButtonSubtext}>Manage chargers</Text>
            </TouchableOpacity>
          </View>
        ) : userRole === 'owner' ? (
          // Station Owner Login Form
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}        
              placeholder="Station Name"
              placeholderTextColor="#999"
              value={stationName}
              onChangeText={setStationName}
              keyboardType="default"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Station ID"
              placeholderTextColor="#999"
              value={stationId}
              onChangeText={setStationId}
              keyboardType="default"
              autoCapitalize="none"
            />
          </View>
        ) : (
          // Regular User Login Form
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}        
              placeholder="Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              keyboardType="default"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Percentage of your battery (0-100)"
              placeholderTextColor="#999"
              value={Percentage}
              onChangeText={setPercentage}
              keyboardType="numeric"
              autoCapitalize="none"
            />
            <Dropdown
              style={styles.input}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={data}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select your car model"
              searchPlaceholder="Search..."
              value={selectedCar}
              onChange={(item) => setSelectedCar(item.value)}
              renderLeftIcon={() => {
                const selected = data.find(car => car.value === selectedCar);
                return selected ? (
                  <Image source={selected.image} style={styles.carImageIcon} />
                ) : null;
              }}
              renderItem={(item) => (
                <View style={styles.dropdownItem}>
                  <Image source={item.image} style={styles.carImageDropdown} />
                  <Text style={styles.dropdownItemText}>{item.label}</Text>
                </View>
              )}
            />
          </View>
        )}

        <View style={styles.buttonContainer}>
          {userRole && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                setUserRole(null);
                setName('');
                setPercentage('');
                setSelectedCar(null);
                setStationName('');
                setStationId('');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="#5B9BD5" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.loginButton, !userRole && { flex: 1 }]} 
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#7F8C8D",
    marginBottom: 40,
  },
  roleButtonsContainer: {
    marginBottom: 30,
    gap: 12,
  },
  roleButton: {
    backgroundColor: "#5B9BD5",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#5B9BD5",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  roleIconContainer: {
    marginBottom: 12,
  },
  roleIcon: {
    fontSize: 40,
  },
  roleButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  roleButtonSubtext: {
    color: "#fff",
    fontSize: 13,
    opacity: 0.85,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: "#fff",
    borderColor: "#5B9BD5",
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row',
    gap: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  backButtonText: {
    color: "#5B9BD5",
    fontSize: 15,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#27AE60",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: 'row',
    gap: 6,
    elevation: 5,
    shadowColor: "#27AE60",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  placeholderStyle: { 
    fontSize: 16,
    color: "#999",
  },
  selectedTextStyle: { 
    fontSize: 16,
    color: "#2C3E50",
  },
  iconStyle: { 
    width: 20, 
    height: 20,
  },
  inputSearchStyle: { 
    height: 40, 
    fontSize: 16,
    borderRadius: 10,
  },
  icon: { marginRight: 5 },
  carImageIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 10,
    resizeMode: 'contain',
  },
  carImageDropdown: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'contain',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
});
