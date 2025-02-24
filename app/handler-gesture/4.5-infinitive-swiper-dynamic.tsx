import React, { useState } from 'react';
import { View, Text } from 'react-native';
import InfiniteSwiper from '~/components/4.5-InfinitiveSwiperDynamic';

export default function SwiperDemo() {
  const [items, setItems] = useState([
    // Your 12 initial slides here
  ]);

  const handleEndSwipe = async (direction, virtualIndex) => {
    console.log(`Swiped ${direction} at virtual index ${virtualIndex}`);

    // Simulate an API fetch with a delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (direction === 'next') {
      // Return 3 new items to add at the end
      return [
        <View
          key="new1"
          style={{ backgroundColor: '#ff9966', flex: 1 }}
          className="h-96 w-full p-2">
          <Text>New Next Slide 1</Text>
        </View>,
        // More new items...
      ];
    } else {
      // Return items to add at the beginning
      return [
        <View
          key="prev1"
          style={{ backgroundColor: '#99ccff', flex: 1 }}
          className="h-96 w-full p-2">
          <Text>New Previous Slide 1</Text>
        </View>,
        // More new items...
      ];
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <InfiniteSwiper
        initialIndex={6} // Start in the middle (7th item, index 6)
        onEndSwipe={handleEndSwipe}>
        {items}
      </InfiniteSwiper>
    </View>
  );
}
