import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '~/components/Button';

export default function HandlerGestureExample1Screen() {
  return (
    <ScrollView contentContainerClassName="pb-20">
      <View className="flex-1 items-center justify-center gap-4">
        <Text className="text-2xl font-bold">Example 1 Handler Gesture</Text>
        <Button onPress={() => router.push('/simple-gesture/1-example')} title="Example 1" />
        <Button onPress={() => router.push('/simple-gesture/1-example')} title="Example 2" />
        <Button onPress={() => router.push('/simple-gesture/1-example')} title="Example 3" />
      </View>
    </ScrollView>
  );
}
