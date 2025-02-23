import { Text, View } from 'react-native';
import Swiper from '~/components/DataCarousel';

export default function HandlerGesture() {
  return (
    <View style={{ flex: 1 }}>
      <Swiper>
        <View style={{ backgroundColor: '#ff4081', flex: 1 }} className='w-full"'>
          <Text>Slide 1</Text>
        </View>
        <View style={{ backgroundColor: '#7c4dff', flex: 1 }} className='w-full"'>
          <Text>Slide 2</Text>
        </View>
        <View style={{ backgroundColor: '#7c9dff', flex: 1 }} className='w-full"'>
          <Text>Slide 3</Text>
        </View>
        <View style={{ backgroundColor: '#111dff', flex: 1 }} className='w-full"'>
          <Text>Slide 4</Text>
        </View>
        <View style={{ backgroundColor: '#7c4de9', flex: 1 }} className='w-full"'>
          <Text>Slide 6</Text>
        </View>
      </Swiper>
    </View>
  );
}
