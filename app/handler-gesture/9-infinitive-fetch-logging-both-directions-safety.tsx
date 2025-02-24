import React, { useState, useRef } from 'react';
import { View, Text } from 'react-native';
import InfiniteSwiperWithFetch from '~/components/9-InfinitiveSwiperFetchLoggingBothDirectionsWeirdSafety';

// We define content variations to make our generated items more interesting and realistic
const CATEGORIES = [
  { name: 'Technology', icon: '💻' },
  { name: 'Design', icon: '🎨' },
  { name: 'Business', icon: '💼' },
  { name: 'Science', icon: '🔬' },
  { name: 'Health', icon: '🏥' },
];

const TOPICS = [
  'Mobile Development',
  'User Experience',
  'Data Analysis',
  'Cloud Computing',
  'Machine Learning',
  'Blockchain',
  'DevOps',
  'Security',
];

const AUTHORS = [
  { name: 'Emma Chen', role: 'Senior Developer' },
  { name: 'James Wilson', role: 'UX Designer' },
  { name: 'Sarah Park', role: 'Tech Lead' },
  { name: 'Michael Brown', role: 'Product Manager' },
  { name: 'Lisa Rodriguez', role: 'Solutions Architect' },
];

// This function generates a unique item with consistent formatting and rich content
const generateItem = (index, direction = 'initial') => {
  // Create a deterministic but varied selection of content based on the index
  const categoryIndex = Math.abs(index) % CATEGORIES.length;
  const topicIndex = Math.abs(index) % TOPICS.length;
  const authorIndex = Math.abs(index) % AUTHORS.length;

  // Generate a unique ID that helps us track item creation and direction
  const id = `${direction}_${Date.now()}_${index}`;

  // Calculate reading time based on index to maintain consistency
  const readTime = 3 + (Math.abs(index) % 7);

  return {
    id,
    index,
    category: CATEGORIES[categoryIndex],
    topic: TOPICS[topicIndex],
    author: AUTHORS[authorIndex],
    title: `${CATEGORIES[categoryIndex].name} Insights #${Math.abs(index)}`,
    description: `Exploring ${TOPICS[topicIndex]} and its impact on modern ${CATEGORIES[categoryIndex].name.toLowerCase()}.`,
    readTime: `${readTime} min read`,
    timestamp: new Date().toISOString(),
    likes: 100 + Math.abs(index) * 11, // Consistent like count based on index
    comments: 5 + Math.abs(index) * 3, // Consistent comment count based on index
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
  // Generate 9 initial items centered around index 0 (-4 to 4)
  const [initialItems] = useState(() => {
    const items = [];
    for (let i = -4; i <= 4; i++) {
      items.push(generateItem(i, 'initial'));
    }
    return items;
  });

  // Track the range of indices we've generated to maintain consistency
  const indexTracker = useRef({
    lowest: -4,
    highest: 4,
  });

  // Simulate fetching next items with a realistic delay
  const fetchNextItems = async () => {
    // Simulate network latency (800-1500ms)
    const delay = Math.floor(Math.random() * 700) + 800;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Generate three new items after our highest index
    const newItems = Array.from({ length: 3 }, (_, i) => {
      const newIndex = indexTracker.current.highest + 1 + i;
      return generateItem(newIndex, 'next');
    });

    // Update our index tracking
    indexTracker.current.highest += 3;
    console.log(
      'Generated next items:',
      newItems.map((item) => item.index)
    );

    return newItems;
  };

  // Simulate fetching previous items with a realistic delay
  const fetchPreviousItems = async () => {
    // Simulate network latency (800-1500ms)
    const delay = Math.floor(Math.random() * 700) + 800;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Only generate previous items if we haven't reached our limit
    if (indexTracker.current.lowest <= -20) {
      console.log('Reached the minimum index limit');
      return [];
    }

    // Generate three new items before our lowest index
    const newItems = Array.from({ length: 3 }, (_, i) => {
      const newIndex = indexTracker.current.lowest - (3 - i);
      return generateItem(newIndex, 'prev');
    });

    // Update our index tracking
    indexTracker.current.lowest -= 3;
    console.log(
      'Generated previous items:',
      newItems.map((item) => item.index)
    );

    return newItems;
  };

  // Render an individual item with a consistent and attractive layout
  const renderItem = ({ item }) => (
    <View className={`flex-1 ${item.backgroundColor} w-full p-6`}>
      {/* Header with category and metadata */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="mr-2 text-xl text-white">{item.category.icon}</Text>
          <Text className="font-medium text-white">{item.category.name}</Text>
        </View>
        <View className="rounded-full bg-white/20 px-3 py-1">
          <Text className="text-xs text-white">Index: {item.index}</Text>
        </View>
      </View>

      {/* Main content */}
      <View className="flex-1 justify-between">
        <View>
          <Text className="mb-2 text-2xl font-bold text-white">{item.title}</Text>
          <Text className="mb-4 text-base text-white/80">{item.description}</Text>
        </View>

        {/* Author and engagement metrics */}
        <View className="mt-4">
          <View className="mb-2 flex-row items-center justify-between">
            <View>
              <Text className="font-medium text-white">{item.author.name}</Text>
              <Text className="text-sm text-white/70">{item.author.role}</Text>
            </View>
            <Text className="text-white/70">{item.readTime}</Text>
          </View>

          {/* Engagement stats */}
          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-white/70">❤️ {item.likes}</Text>
              <Text className="ml-4 text-white/70">💬 {item.comments}</Text>
            </View>
            <Text className="text-xs text-white/50">ID: {item.id}</Text>
          </View>
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
