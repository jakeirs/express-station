import { Text, View } from 'react-native';
import { useStore } from '../../../store/store';
import { useZustandExample } from './hooks/useZustandExample';
import { Button } from '../../../components/Button';

export default function TabTwoScreen() {
  const { bears, increasePopulation, removeAllBears } = useStore();

  return (
    <View className="flex-1 items-center justify-center gap-4">
      <Text className="text-2xl font-bold">Zustand Example</Text>

      <View className="items-center gap-2">
        <Text className="text-xl">Bears: {bears}</Text>

        <Button title="Add Bear 🐻" onPress={increasePopulation} />

        <Button title="Remove All Bears" onPress={removeAllBears} />
      </View>

      <Text className="mt-4 max-w-[80%] text-center text-sm text-gray-500">
        This is a simple Zustand example showing state management across components. The state
        persists as you navigate between tabs.
      </Text>
    </View>
  );
}
