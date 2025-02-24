import React, { useState, useRef } from 'react';
import { View, Text } from 'react-native';
import InfiniteSwiperWithFetch from '~/components/8-InfinitiveSwiperFetchLoggingBothDirections';

// Content generators to make our items interesting and varied
const TOPICS = ['React Native', 'State Management', 'UI Design', 'Performance', 'Animations'];
const AUTHORS = ['Emma Chen', 'James Wilson', 'Sarah Park', 'Michael Brown', 'Lisa Rodriguez'];
const BADGES = ['New', 'Popular', 'Featured', 'Trending', 'Must Read'];

// Generate a unique item with consistent ID format
const generateItem = (index, direction = 'initial') => {
  const topic = TOPICS[Math.abs(index) % TOPICS.length];
  const author = AUTHORS[Math.abs(index) % AUTHORS.length];
  const badge = BADGES[Math.abs(index) % BADGES.length];

  // Ensure unique IDs by combining direction, timestamp, and index
  const id = `${direction}_${Date.now()}_${index}`;

  return {
    id,
    index,
    title: `${topic} Insights #${Math.abs(index)}`,
    description: `Exploring ${topic} concepts and best practices. Article ${Math.abs(index)}.`,
    author,
    badge,
    readTime: `${Math.floor(Math.random() * 8) + 3} min read`,
    timestamp: new Date().toISOString(),
    likes: Math.floor(Math.random() * 1000) + 100,
    backgroundColor: [
      'bg-pink-500',
      'bg-purple-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
    ][Math.abs(index) % 5],
  };
};

const SwiperImplementation = () => {
  // Create a sequence of 9 initial items (-4 to 4)
  const [initialItems] = useState(() => {
    const items = [];
    for (let i = -4; i <= 4; i++) {
      items.push(generateItem(i, 'initial'));
    }
    return items;
  });

  // Track the range of indices we've generated
  const indexTracker = useRef({
    lowest: -4,
    highest: 4,
  });

  // Function to fetch next items (positive direction)
  const fetchNextItems = async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate three new items after our highest index
    const newItems = Array.from({ length: 3 }, (_, i) => {
      const newIndex = indexTracker.current.highest + 1 + i;
      return generateItem(newIndex, 'next');
    });

    // Update our tracker
    indexTracker.current.highest += 3;
    console.log(
      'Generated next items:',
      newItems.map((item) => item.id)
    );

    return newItems;
  };

  // Function to fetch previous items (negative direction)
  const fetchPreviousItems = async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate three new items before our lowest index
    const newItems = Array.from({ length: 3 }, (_, i) => {
      const newIndex = indexTracker.current.lowest - 3 + i;
      return generateItem(newIndex, 'prev');
    });

    // Update our tracker
    indexTracker.current.lowest -= 3;
    console.log(
      'Generated previous items:',
      newItems.map((item) => item.id)
    );

    return newItems;
  };

  // Render each item with consistent styling and information
  const renderItem = ({ item }) => (
    <View className={`flex-1 ${item.backgroundColor} w-full p-6`}>
      {/* Header with metadata */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="rounded-full bg-black/20 px-3 py-1">
          <Text className="text-xs text-white">Index: {item.index}</Text>
        </View>
        <View className="rounded-full bg-white/20 px-3 py-1">
          <Text className="text-xs text-white">{item.badge}</Text>
        </View>
      </View>

      {/* Main content */}
      <View className="flex-1 justify-between">
        <View>
          <Text className="mb-2 text-2xl font-bold text-white">{item.title}</Text>
          <Text className="mb-4 text-white/80">{item.description}</Text>
        </View>

        {/* Footer information */}
        <View>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white">{item.author}</Text>
              <Text className="text-white/70">{item.readTime}</Text>
            </View>
            <Text className="text-white/70">{item.likes} likes</Text>
          </View>

          <Text className="mt-4 text-xs text-white/50">ID: {item.id}</Text>
          <Text className="text-xs text-white/50">
            Created: {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      <InfiniteSwiperWithFetch
        initialItems={initialItems}
        initialIndex={4} // Start at index 4 (middle of 9 items)
        onFetchNext={fetchNextItems}
        onFetchPrevious={fetchPreviousItems}
        renderItem={renderItem}
      />
    </View>
  );
};

export default SwiperImplementation;
