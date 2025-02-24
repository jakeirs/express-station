import React, { useState, useRef } from 'react';
import { View, Text } from 'react-native';
import InfiniteSwiperWithFetch from '~/components/5-InfinitiveSwiperFetch';

const contentTypes = {
  ARTICLE: 'article',
  IMAGE: 'image',
  QUOTE: 'quote',
  STATISTIC: 'statistic',
  PROFILE: 'profile',
};

// Arrays of content variations to make generated content more interesting
const AUTHORS = ['Emma Thompson', 'James Wilson', 'Sarah Parker', 'Michael Chen', 'Lisa Rodriguez'];
const COMPANIES = ['TechCorp', 'InnovateLabs', 'FutureWorks', 'DesignHub', 'DataFlow'];
const TOPICS = ['AI & ML', 'UX Design', 'Web Development', 'Mobile Apps', 'Cloud Computing'];
const LOCATIONS = ['San Francisco', 'New York', 'London', 'Tokyo', 'Berlin'];
const SKILLS = ['JavaScript', 'Python', 'React', 'Node.js', 'UI/UX', 'AWS', 'Docker', 'TypeScript'];

// Generate a single unique item with dynamic content
const generateUniqueItem = (id, direction) => {
  const type = Object.values(contentTypes)[Math.floor(Math.random() * 5)];
  const timestamp = new Date().toISOString();

  const baseItem = {
    id: `${direction}_${id}`,
    timestamp,
    type,
    backgroundColor: [
      'bg-pink-500',
      'bg-purple-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
    ][Math.floor(Math.random() * 5)],
  };

  switch (type) {
    case contentTypes.ARTICLE:
      return {
        ...baseItem,
        title: `${TOPICS[Math.floor(Math.random() * TOPICS.length)]} Insights #${id}`,
        subtitle: `Latest Updates from ${LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]}`,
        content: `Fresh perspective on ${TOPICS[Math.floor(Math.random() * TOPICS.length)]} 
                 with unique insights for item ${id}. Each article brings new value to readers.`,
        author: AUTHORS[Math.floor(Math.random() * AUTHORS.length)],
        readTime: `${Math.floor(Math.random() * 10) + 2} min read`,
      };

    case contentTypes.IMAGE:
      return {
        ...baseItem,
        title: `Moment ${id}`,
        imageNumber: Math.floor(Math.random() * 5) + 1,
        caption: `A unique moment captured in ${LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]}`,
        photographer: AUTHORS[Math.floor(Math.random() * AUTHORS.length)],
        likes: Math.floor(Math.random() * 1000) + 100,
      };

    case contentTypes.QUOTE:
      return {
        ...baseItem,
        quote: `Unique perspective #${id}: "${TOPICS[Math.floor(Math.random() * TOPICS.length)]} 
                is transforming the way we think about technology"`,
        author: AUTHORS[Math.floor(Math.random() * AUTHORS.length)],
        category: TOPICS[Math.floor(Math.random() * TOPICS.length)],
      };

    case contentTypes.STATISTIC:
      return {
        ...baseItem,
        title: `${TOPICS[Math.floor(Math.random() * TOPICS.length)]} Growth`,
        value: Math.floor(Math.random() * 100),
        change: `${(Math.random() * 20 - 10).toFixed(1)}%`,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        period: 'Last 30 days',
        source: COMPANIES[Math.floor(Math.random() * COMPANIES.length)],
      };

    case contentTypes.PROFILE:
      const selectedSkills = SKILLS.sort(() => Math.random() - 0.5).slice(
        0,
        Math.floor(Math.random() * 3) + 2
      );

      return {
        ...baseItem,
        name: AUTHORS[Math.floor(Math.random() * AUTHORS.length)],
        role: TOPICS[Math.floor(Math.random() * TOPICS.length)] + ' Specialist',
        company: COMPANIES[Math.floor(Math.random() * COMPANIES.length)],
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        experience: `${Math.floor(Math.random() * 15) + 1} years`,
        skills: selectedSkills,
      };
  }
};

export default function SwiperImplementation() {
  // Keep track of the latest IDs in both directions
  const nextIdCounter = useRef(5); // Start from 5 for next items
  const prevIdCounter = useRef(-1); // Start from -1 for previous items

  // Generate initial items with IDs 0-4
  const [initialItems] = useState(
    Array.from({ length: 5 }, (_, i) => generateUniqueItem(i, 'initial'))
  );

  const fetchNextItems = async () => {
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 800));

    // Generate 3 new unique items with incrementing IDs
    const newItems = Array.from({ length: 3 }, () => {
      nextIdCounter.current += 1;
      return generateUniqueItem(nextIdCounter.current, 'next');
    });

    console.log(
      'Generated new next items:',
      newItems.map((item) => item.id)
    );
    return newItems;
  };

  const fetchPreviousItems = async () => {
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 800));

    // Generate 3 new unique items with decrementing IDs
    const newItems = Array.from({ length: 3 }, () => {
      prevIdCounter.current -= 1;
      return generateUniqueItem(prevIdCounter.current, 'prev');
    });

    console.log(
      'Generated new previous items:',
      newItems.map((item) => item.id)
    );
    return newItems;
  };

  const renderItem = ({ item }) => {
    switch (item.type) {
      case contentTypes.ARTICLE:
        return (
          <View className={`flex-1 ${item.backgroundColor} w-full p-6`}>
            <Text className="mb-2 text-xs text-white">ID: {item.id}</Text>
            <Text className="text-2xl font-bold text-white">{item.title}</Text>
            <Text className="mt-2 text-white/80">{item.subtitle}</Text>
            <Text className="mt-4 text-white/70">{item.content}</Text>
            <View className="mt-auto flex-row items-center justify-between">
              <Text className="text-white/60">{item.author}</Text>
              <Text className="text-white/60">{item.readTime}</Text>
            </View>
          </View>
        );

      case contentTypes.IMAGE:
        return (
          <View className={`flex-1 ${item.backgroundColor} w-full p-6`}>
            <Text className="mb-2 text-xs text-white">ID: {item.id}</Text>
            <View className="flex-1 items-center justify-center">
              <View className="mb-4 h-48 w-full rounded-lg bg-white/20" />
              <Text className="text-lg text-white">{item.caption}</Text>
              <View className="mt-auto w-full flex-row justify-between">
                <Text className="text-white/60">{item.photographer}</Text>
                <Text className="text-white/60">{item.likes} likes</Text>
              </View>
            </View>
          </View>
        );

      case contentTypes.QUOTE:
        return (
          <View className={`flex-1 ${item.backgroundColor} w-full p-6`}>
            <Text className="mb-2 text-xs text-white">ID: {item.id}</Text>
            <View className="flex-1 justify-center">
              <Text className="text-xl italic text-white">{item.quote}</Text>
              <Text className="mt-4 text-white/80">- {item.author}</Text>
              <Text className="mt-2 text-white/60">{item.category}</Text>
            </View>
          </View>
        );

      case contentTypes.STATISTIC:
        return (
          <View className={`flex-1 ${item.backgroundColor} w-full p-6`}>
            <Text className="mb-2 text-xs text-white">ID: {item.id}</Text>
            <View className="flex-1 items-center justify-center">
              <Text className="text-2xl font-bold text-white">{item.title}</Text>
              <Text className="mt-4 text-4xl text-white">{item.value}</Text>
              <Text className="mt-2 text-white/80">{item.change}</Text>
              <Text className="mt-4 text-white/60">{item.period}</Text>
              <Text className="text-white/60">Source: {item.source}</Text>
            </View>
          </View>
        );

      case contentTypes.PROFILE:
        return (
          <View className={`flex-1 ${item.backgroundColor} w-full p-6`}>
            <Text className="mb-2 text-xs text-white">ID: {item.id}</Text>
            <View className="mb-4 h-20 w-20 rounded-full bg-white/20" />
            <Text className="text-2xl text-white">{item.name}</Text>
            <Text className="mt-1 text-white/80">{item.role}</Text>
            <Text className="text-white/80">{item.company}</Text>
            <Text className="mt-2 text-white/60">{item.location}</Text>
            <Text className="text-white/60">{item.experience}</Text>
            <View className="mt-2 flex-row flex-wrap">
              {item.skills.map((skill, index) => (
                <View key={index} className="mr-2 mt-2 rounded-full bg-white/20 px-3 py-1">
                  <Text className="text-white">{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        );
    }
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
}
