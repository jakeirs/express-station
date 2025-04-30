import { Text, View } from 'react-native';
import { useStore } from '../../../store/store';
import { useZustandExample } from './hooks/useZustandExample';
import { Button } from '../../../components/Button';

export default function TabTwoScreen() {
  const { bears, increasePopulation, removeAllBears } = useStore();

  return (
    <View className="flex-1 items-center justify-center gap-4">

    </View>
  );
}
