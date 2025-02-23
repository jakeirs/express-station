import { Text, View } from 'react-native';
import Swiper from '~/components/DataCarousel-1';
import InfiniteSwiper from '~/components/InfinitiveSwiper-4';

export default function HandlerGesture() {
  return (
    <View style={{ flex: 1 }}>
      <InfiniteSwiper>
        <View style={{ backgroundColor: '#ff4081', flex: 1 }} className="h-96 w-full p-2">
          <Text>Slide 1</Text>
        </View>
        <View style={{ backgroundColor: '#7c4dff', flex: 1 }} className="h-96 w-full p-2">
          <Text>Slide 2</Text>
        </View>
        <View style={{ backgroundColor: '#7c9dff', flex: 1 }} className="h-96 w-full p-2">
          <Text>Slide 3</Text>
        </View>
        <View style={{ backgroundColor: '#111dff', flex: 1 }} className="h-96 w-full p-2">
          <Text>Slide 4</Text>
        </View>
        <View style={{ backgroundColor: '#7c4de9', flex: 1 }} className="h-96 w-full p-2">
          <Text>Slide 6</Text>
        </View>
      </InfiniteSwiper>
    </View>
  );
}
