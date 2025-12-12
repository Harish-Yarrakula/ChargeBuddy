import { useRouter } from 'expo-router';
import { View } from 'react-native';
import MainScreen from '../../src/screens/MainScreen';

export default function NearbyStations() {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <MainScreen router={router} />
    </View>
  );
}
