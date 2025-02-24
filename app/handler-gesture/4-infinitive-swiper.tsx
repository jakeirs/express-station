import { Text, View } from 'react-native';
import InfiniteSwiper from '~/components/4-InfinitiveSwiper';

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
        <View style={{ backgroundColor: '#7ceee9', flex: 1 }} className="h-96 w-full p-2">
          <Text>Slide 5</Text>
        </View>
        <View style={{ backgroundColor: '#7c4d', flex: 1 }} className="h-96 w-full p-2">
          <Text>Slide 6</Text>
        </View>
        <View style={{ backgroundColor: '#7ce9', flex: 1 }} className="h-96 w-full p-2">
          <Text>Slide 7</Text>
        </View>
        <View style={{ backgroundColor: '#ec4de9', flex: 1 }} className="h-96 w-full p-2">
          <Text>Slide 8</Text>
        </View>
        <View style={{ backgroundColor: '#7cdee9', flex: 1 }} className="h-96 w-full p-2">
          <Text>Slide 9</Text>
        </View>
        <View style={{ backgroundColor: '#cccdec', flex: 1 }} className="h-96 w-full p-2">
          <Text>Slide 10</Text>
        </View>
        <View style={{ backgroundColor: '#dd4d3d', flex: 1 }} className="h-96 w-full p-2">
          <Text>Slide 11</Text>
        </View>
        <View style={{ backgroundColor: '#7c3c39', flex: 1 }} className="h-96 w-full p-2">
          <Text>Slide 12</Text>
        </View>
      </InfiniteSwiper>
    </View>
  );
}
