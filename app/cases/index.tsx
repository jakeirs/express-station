import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '~/components/Button';

export default function HandlerGestureExample1Screen() {
  return (
    <ScrollView contentContainerClassName="pb-20">
      <View className="flex-1 items-center justify-center gap-4">
        <Text className="text-2xl font-bold">Cases</Text>
        <Button onPress={() => router.push('/absolute')} title="Example 1" />
        <Button
          onPress={() => router.push('/cases/flex1')}
          title="Flex 1 - Scrollable - take remaining space"
        />
      </View>
    </ScrollView>
  );
}
