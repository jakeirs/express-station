import React from 'react';
import { Text, View } from 'react-native';
import InfiniteSwiper from '~/components/4.5-InfinitiveSwiperDynamic';

export default function SwiperImplementation() {
  // Create an array of different colored slides
  const slides = [
    {
      id: 1,
      color: '#FF4081', // Pink
      title: 'Welcome to Infinite Swiper',
      description: 'Swipe in any direction to explore content',
    },
    {
      id: 2,
      color: '#7C4DFF', // Purple
      title: 'Smooth Transitions',
      description: 'Gestures and animations create a fluid experience',
    },
    {
      id: 3,
      color: '#00BCD4', // Cyan
      title: 'Smart Recycling',
      description: "Only renders what's needed for optimal performance",
    },
    {
      id: 4,
      color: '#4CAF50', // Green
      title: 'Infinite Content',
      description: 'Seamlessly scroll through endless content',
    },
    {
      id: 5,
      color: '#FFC107', // Amber
      title: 'Customizable',
      description: 'Make it your own with custom styling',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* 
        Using InfiniteSwiper with initialIndex set to 2, 
        which means we'll start at the third slide (index 2).
        Since we didn't specify initialIndex, it would start from the middle by default.
      */}
      <InfiniteSwiper initialIndex={2}>
        {slides.map((slide) => (
          <View
            key={slide.id}
            className="w-full flex-1 items-center justify-center p-6"
            style={{ backgroundColor: slide.color }}>
            <Text className="mb-4 text-3xl font-bold text-white">{slide.title}</Text>
            <Text className="text-xl text-white">{slide.description}</Text>
            <View className="mt-8 rounded-lg bg-white/20 p-4">
              <Text className="text-white">Slide ID: {slide.id}</Text>
            </View>
          </View>
        ))}
      </InfiniteSwiper>
    </View>
  );
}
