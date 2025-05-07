import { StatusBar } from 'expo-status-bar';
import { Platform, Text } from 'react-native';

import { ScreenContent } from '~/components/ScreenContent';

export default function Modal() {
  return (
    <>
      <ScreenContent path="app/modal.tsx" title="Modal">
        <Text>asd</Text>
      </ScreenContent>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </>
  );
}
