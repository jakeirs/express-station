import { StatusBar } from 'expo-status-bar';
import { Platform, Text } from 'react-native';

import { ScreenContent } from '~/components/ScreenContent';
import { useStore } from '~/store/store';

export default function Modal() {
  const { bears } = useStore();
  return (
    <>
      <ScreenContent path="app/modal.tsx" title="Modal">
        <Text>{bears}</Text>
      </ScreenContent>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </>
  );
}
