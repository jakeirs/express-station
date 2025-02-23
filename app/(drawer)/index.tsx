import { Stack } from 'expo-router';
import { View, Text } from 'react-native';

import { Container } from '~/components/Container';
import { ScreenContent } from '~/components/ScreenContent';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container>
        <View>
          <Text className="text-4xl font-bold">Zustand with Persistence</Text>
        </View>
        <View>
          <Text className="text-4xl font-bold"></Text>
        </View>
      </Container>
    </>
  );
}
