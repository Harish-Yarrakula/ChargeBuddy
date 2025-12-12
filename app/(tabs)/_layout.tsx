import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <Label>Nearby Stations</Label>
        {Platform.select({
          ios: <Icon sf="list.bullet" />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="list" />} />,
        })}
      </NativeTabs.Trigger>
      
      <NativeTabs.Trigger name="maps">
        <Label>Maps</Label>
        {Platform.select({
          ios: <Icon sf="map.fill" />,
          android: <Icon src={<VectorIcon family={MaterialIcons} name="map" />} />,
        })}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
