import React from 'react';
import { View, Text } from 'react-native';
import Swiper, { type SwipeDirection } from '~/components/4.6-SwiperDynamic2';

// Define some sample slide data to make the example more realistic
const slides = [
  {
    id: 1,
    title: 'Welcome to Swiper',
    description: 'A simple and efficient swiper for React Native',
    color: '#ff4081',
  },
  {
    id: 2,
    title: 'Easy to Use',
    description: 'Just import and add your content inside',
    color: '#7c4dff',
  },
  {
    id: 3,
    title: 'Customizable',
    description: 'Change the appearance to match your app design',
    color: '#64b5f6',
  },
  {
    id: 4,
    title: 'Optimized',
    description: 'Only renders items that could be visible on screen',
    color: '#4caf50',
  },
  {
    id: 5,
    title: 'Get Started Now',
    description: 'Start implementing in your own projects',
    color: '#ff9800',
  },
];

const onSwipeEnd = ({ direction }: { direction: SwipeDirection }) => {
  console.log('direction', direction);
};

const SwiperExample = () => {
  // We can use the initialIndex prop to start from any slide
  // Here we start from the middle (index 2)
  return (
    <View style={{ flex: 1 }}>
      <Swiper initialIndex={2} onSwipeEnd={onSwipeEnd}>
        {slides.map((slide) => (
          <View
            key={slide.id}
            style={{ backgroundColor: slide.color, flex: 1 }}
            className="h-full w-full items-center justify-center p-8">
            <Text className="mb-4 text-3xl font-bold text-white">{slide.title}</Text>
            <Text className="text-xl text-white">{slide.description}</Text>
            <Text className="mt-12 text-center text-white/70">
              Slide {slide.id} of {slides.length}
            </Text>
          </View>
        ))}
      </Swiper>
    </View>
  );
};

export default SwiperExample;
