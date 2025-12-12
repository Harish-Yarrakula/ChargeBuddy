import { useRouter } from 'expo-router';
import { View } from 'react-native';
import MapsScreen from '../../src/screens/MapsScreen';

export default function Maps() {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <MapsScreen router={router} />
    </View>
  );
}
