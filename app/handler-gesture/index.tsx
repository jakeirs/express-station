import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '~/components/Button';

export default function HandlerGestureExample1Screen() {
  return (
    <ScrollView contentContainerClassName="pb-20">
      <View className="flex-1 items-center justify-center gap-4">
        <Text className="text-2xl font-bold">Example 1 Handler Gesture</Text>
        <Button onPress={() => router.push('/handler-gesture/1-example')} title="Example 1" />
        <Button onPress={() => router.push('/handler-gesture/2-example')} title="Example 2" />
        <Button onPress={() => router.push('/handler-gesture/3-example')} title="Example 3" />
        <Button
          onPress={() => router.push('/handler-gesture/4-infinitive-swiper')}
          title="infinitive swiper"
        />
        <Button
          onPress={() => router.push('/handler-gesture/5-infinitive-fetch')}
          title="infinitive swiper Fetch"
        />
        <Button
          onPress={() => router.push('/handler-gesture/6-infinitive-fetch-2')}
          title="infinitive swiper Fetch 2"
        />
        <Button
          onPress={() => router.push('/handler-gesture/7-infinitive-fetch-logging')}
          title="infinitive swiper Fetch + logging"
        />
        <Button
          onPress={() => router.push('/handler-gesture/7-infinitive-fetch-logging-TRY-TO-DESTROY')}
          title="infinitive swiper Fetch + logging - Simon"
        />
        <Button
          onPress={() => router.push('/handler-gesture/8-infinitive-fetch-logging-both-directions')}
          title="infinitive swiper Fetch + logging + both directions"
        />
      </View>
    </ScrollView>
  );
}
