import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../../components/Button';

export default function TabOneScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4">
      <Text className="text-2xl font-bold">useState Example</Text>
      <Button onPress={() => router.push('/handler-gesture')} title="Go to handle gesture" />
    </View>
  );
}
