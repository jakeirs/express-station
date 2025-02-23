import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '~/components/Button';

export default function HandlerGestureExample1Screen() {
  return (
    <View className="flex-1 items-center justify-center gap-4">
      <Text className="text-2xl font-bold">Example 1 Handler Gesture</Text>
      <Button onPress={() => router.push('/handler-gesture/1-example')} title="Example 1" />
      <Button onPress={() => router.push('/handler-gesture/2-example')} title="Example 2" />
      <Button onPress={() => router.push('/handler-gesture/3-example')} title="Example 3" />
      <Button
        onPress={() => router.push('/handler-gesture/4-infinitive-swiper')}
        title="infinitive swiper"
      />
    </View>
  );
}
