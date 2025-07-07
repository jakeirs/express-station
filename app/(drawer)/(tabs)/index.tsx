import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../../components/Button';

export default function TabOneScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4">
      <Text className="text-2xl font-bold">useState Example</Text>
      <View style={{ height: 65, backgroundColor: 'black' }} className="w-full"></View>
      <Button onPress={() => router.push('/handler-gesture')} title="Go to handle gesture" />
      <Button onPress={() => router.push('/cases')} title="Cases" />
    </View>
  );
}
