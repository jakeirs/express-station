import React, { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

import Swiper from '~/components/4.7-SwiperDynamicAdd';

export type SwipeDirection = 'next' | 'previous';

// Generic type for item data
export interface ItemData {
  id: string | number;
  [key: string]: any; // Allow for any additional properties
}

// Example item interface - you can replace this with your actual data structure
interface ExampleItem extends ItemData {
  title: string;
  description: string;
  color: string;
  date: string;
}

// Type for render item function
export type RenderItemFunction<T extends ItemData> = (info: {
  item: T;
  index: number;
}) => React.ReactNode;

// Generate example data for demonstration
const generateItems = (startId: number, count: number): ExampleItem[] => {
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3'];
  return Array.from({ length: count }, (_, i) => ({
    id: `item_${startId + i}`,
    title: `Item ${startId + i}`,
    description: `This is the description for item ${startId + i}`,
    color: colors[Math.floor(Math.random() * colors.length)],
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  }));
};

// Main component implementation
const SwiperImplementation = () => {
  // Initial set of items
  const [items, setItems] = useState<ExampleItem[]>(generateItems(1, 12));
  const [isLoading, setIsLoading] = useState(false);

  // Handle when we're approaching the end of items
  const handleNearEnd = useCallback(() => {
    if (!isLoading) {
      console.log('Near end, fetching more items...');
      setIsLoading(true);

      // Simulate fetching more data with a delay
      setTimeout(() => {
        const nextId = items.length + 1;
        const newItems = generateItems(nextId, 8);
        setItems((prevItems) => [...prevItems, ...newItems]);
        setIsLoading(false);
        console.log(`Added ${newItems.length} new items`);
      }, 1500); // 1.5 second delay to simulate network request
    }
  }, [items, isLoading]);

  // Handle swipe events
  const handleSwipeEnd = useCallback(({ direction }: { direction: SwipeDirection }) => {
    console.log(`Swiped ${direction}`);
  }, []);

  // Custom render function for each item
  const renderItem = useCallback(
    ({ item, index }: { item: ExampleItem; index: number }) => (
      <View className="flex-1 p-6" style={{ backgroundColor: item.color }}>
        <View className="flex-1 justify-between">
          <View>
            <Text className="text-2xl font-bold text-white">{item.title}</Text>
            <Text className="mt-2 text-white/80">{item.description}</Text>
            <Text className="mt-2 text-white/60">Index in list: {index}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="rounded-full bg-black/20 px-3 py-1">
              <Text className="text-xs text-white">Date: {item.date}</Text>
            </View>

            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-xs text-white">ID: {item.id}</Text>
            </View>
          </View>
        </View>
      </View>
    ),
    []
  );

  return (
    <View className="flex-1">
      <Swiper
        initialItems={items}
        renderItem={renderItem}
        initialIndex={1} // Start from the second item
        onSwipeEnd={handleSwipeEnd}
        onNearEnd={handleNearEnd}
        nearEndThreshold={4} // Trigger fetch when 4 items from the end
        showDebugPanel={true}
      />

      {/* Loading indicator when fetching more items */}
      {isLoading && (
        <View className="absolute bottom-36 right-4 rounded-full bg-black/50 p-2">
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      )}
    </View>
  );
};

export default SwiperImplementation;
