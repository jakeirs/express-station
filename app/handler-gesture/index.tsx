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
          title="infinitive swiper 4.0"
        />
        <Button
          onPress={() => router.push('/handler-gesture/4.5-infinitive-swiper-dynamic')}
          title="infinitive swiper + dynamic 4.5"
        />
        <Button
          onPress={() => router.push('/handler-gesture/4.6-swiper-dynamic')}
          title="infinitive swiper + init items 4.6"
        />
        <Button
          onPress={() => router.push('/handler-gesture/4.7-swiper-dynamic')}
          title="infinitive swiper + add items 4.7"
        />
        <Button
          onPress={() => router.push('/handler-gesture/4.8-swiper-previous')}
          title="infinitive swiper + previous items 4.8"
        />
        <Button
          onPress={() => router.push('/handler-gesture/4.9-swiper-previousMigocze')}
          title="infinitive swiper + previous items + migocze 4.9"
        />
        <Button
          onPress={() => router.push('/handler-gesture/4.9.1-swiper-previousExp')}
          title="infinitive swiper + previous items + exp 4.9.1"
        />
        <Button
          onPress={() => router.push('/handler-gesture/4.9.2-swiper-previousVirtual')}
          title="infinitive swiper + previous items + virtual 4.9.2"
        />
        <Button
          onPress={() => router.push('/handler-gesture/4.9.2xxx.1-swiper-previousVirtual')}
          title="swiper + 4.9.2 + self-alignment - 4.9.2xxx.1"
        />
        <Button
          onPress={() => router.push('/handler-gesture/4.9.2.1-fade-in')}
          title="fade in 4.9.2.1"
        />
        <Button
          onPress={() => router.push('/handler-gesture/4.9.2.2-swiper-self-correction')}
          title="self - correction 4.9.2.2 CONFIGURATION 30 fetch size"
        />
        <Button
          onPress={() => router.push('/handler-gesture/4.9.3-swiper-previousEndStopping')}
          title="infinitive swiper + is prepended 4.9.3"
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
