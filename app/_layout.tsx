import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="station-details" options={{ headerShown: false }} />
      <Stack.Screen name="booking" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="queue-status" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="alternatives" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="emergency-tow" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="tow-status" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}
