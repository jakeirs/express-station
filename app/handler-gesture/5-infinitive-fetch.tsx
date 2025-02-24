import React, { useState } from 'react';
import { View, Text } from 'react-native';
import InfiniteSwiperWithFetch from '~/components/5-InfinitiveSwiperFetch';

// Simulated database of items
const generateItems = (start, end) => {
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const id = start + index;
    const randomImage = Math.floor(Math.random() * 5) + 1; // 1-5 for variety
    return {
      id,
      title: `Item ${id}`,
      description: `This is item number ${id} in our infinite collection`,
      image: randomImage,
      // Add a timestamp to prove it's newly generated
      timestamp: new Date().toISOString(),
    };
  });
};

// Mock API functions with artificial delay
const mockFetchNext = async (lastId) => {
  // Simulate network delay between 500ms and 1500ms
  const delay = Math.random() * 1000 + 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Generate 3 new items after the last ID
  return generateItems(lastId + 1, lastId + 3);
};

const mockFetchPrevious = async (firstId) => {
  // Simulate network delay between 500ms and 1500ms
  const delay = Math.random() * 1000 + 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Generate 3 new items before the first ID
  return generateItems(firstId - 3, firstId - 1);
};

// Different background colors for visual variety
const COLORS = ['bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

const SwiperDemo = () => {
  // Start with items 1-5 as initial data
  const [initialItems] = useState(generateItems(1, 5));

  const fetchNextItems = async () => {
    const lastItem = initialItems[initialItems.length - 1];
    console.log('Fetching next items after ID:', lastItem.id);
    const newItems = await mockFetchNext(lastItem.id);
    console.log('Received new items:', newItems.length);
    return newItems;
  };

  const fetchPreviousItems = async () => {
    const firstItem = initialItems[0];
    console.log('Fetching previous items before ID:', firstItem.id);
    const newItems = await mockFetchPrevious(firstItem.id);
    console.log('Received new items:', newItems.length);
    return newItems;
  };

  const renderItem = ({ item, index }) => {
    const colorIndex = item.id % COLORS.length;
    return (
      <View className={`flex-1 ${COLORS[colorIndex]} w-full p-6`}>
        <View className="flex-1 justify-between">
          <View>
            <Text className="mb-2 text-2xl font-bold text-white">{item.title}</Text>
            <Text className="mb-4 text-white/80">{item.description}</Text>
          </View>

          <View className="rounded-lg bg-white/10 p-4">
            <Text className="text-sm text-white/70">
              Generated at: {new Date(item.timestamp).toLocaleTimeString()}
            </Text>
            <Text className="text-sm text-white/70">Item ID: {item.id}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1">
      <InfiniteSwiperWithFetch
        initialItems={initialItems}
        onFetchNext={fetchNextItems}
        onFetchPrevious={fetchPreviousItems}
        renderItem={renderItem}
      />
    </View>
  );
};

export default SwiperDemo;
