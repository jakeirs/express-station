import { Text, View } from 'react-native';
import { useState } from 'react';
import Swiper from '~/components/DataCarousel-3';
import useSwiperData from '~/components/hook-3';

// FETCH => 

export default function HandlerGesture() {
  // Let's create some initial data that matches your current structure
  const [slides, setSlides] = useState([
    { id: 1, color: '#ff4081', text: 'Slide 1' },
    { id: 2, color: '#7c4dff', text: 'Slide 2' },
    { id: 3, color: '#7c9dff', text: 'Slide 3' },
    { id: 4, color: '#111dff', text: 'Slide 4' },
    { id: 5, color: '#7c4de9', text: 'Slide 6' },
  ]);

  // Simulate fetching more data - in a real app, this would be an API call
  const fetchNextSlides = async (page) => {
    // Simulating an API call with a timeout
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate new slides based on the page number
    const newSlides = [
      {
        id: slides.length + 1,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        text: `Slide ${slides.length + 1}`,
      },
      {
        id: slides.length + 2,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        text: `Slide ${slides.length + 2}`,
      },
    ];

    // Update the slides array with new data
    setSlides((prevSlides) => [...prevSlides, ...newSlides]);
  };

  // Similar function for fetching previous slides
  const fetchPreviousSlides = async (page) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newSlides = [
      {
        id: slides[0].id - 2,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        text: `Slide ${slides[0].id - 2}`,
      },
      {
        id: slides[0].id - 1,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        text: `Slide ${slides[0].id - 1}`,
      },
    ];

    setSlides((prevSlides) => [...newSlides, ...prevSlides]);
  };

  // Initialize our custom hook
  const { isLoading, error, handleSwipe, currentPage, lastSwipeDirection } = useSwiperData({
    onFetchNext: fetchNextSlides,
    onFetchPrevious: fetchPreviousSlides,
    initialPage: 1,
    enablePrefetch: true,
  });

  return (
    <View className="flex-1">
      {/* Show loading state if data is being fetched */}
      {isLoading && (
        <View className="absolute right-4 top-4 z-10 rounded-full bg-black/50 px-4 py-2">
          <Text className="text-white">Loading...</Text>
        </View>
      )}

      {/* Show any errors that occur during fetching */}
      {error && (
        <View className="absolute left-4 top-4 z-10 rounded-full bg-red-500/50 px-4 py-2">
          <Text className="text-white">Error loading data</Text>
        </View>
      )}

      <Swiper onSwipeLeft={() => handleSwipe('left')} onSwipeRight={() => handleSwipe('right')}>
        {slides.map((slide) => (
          <View
            key={slide.id}
            style={{ backgroundColor: slide.color }}
            className="w-full flex-1 items-center justify-center">
            <Text className="text-xl text-white">{slide.text}</Text>
            {/* Optional: Show the current page number */}
            <Text className="mt-2 text-white">Page {currentPage}</Text>
          </View>
        ))}
      </Swiper>
    </View>
  );
}
