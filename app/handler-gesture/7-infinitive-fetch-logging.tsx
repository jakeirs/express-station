import React, { useState, useRef } from 'react';
import { View, Text } from 'react-native';
import InfiniteSwiperWithFetch from '~/components/7-InfinitiveSwiperFetchLogging';

// Define our content types and their specific properties
type ContentType = 'article' | 'image' | 'quote' | 'statistic' | 'profile';

interface BaseItem {
  id: string;
  timestamp: string;
  type: ContentType;
  backgroundColor: string;
}

interface ArticleItem extends BaseItem {
  type: 'article';
  title: string;
  subtitle: string;
  content: string;
  author: string;
  readTime: string;
}

interface ImageItem extends BaseItem {
  type: 'image';
  title: string;
  imageNumber: number;
  caption: string;
  photographer: string;
  likes: number;
}

interface QuoteItem extends BaseItem {
  type: 'quote';
  quote: string;
  author: string;
  category: string;
}

interface StatisticItem extends BaseItem {
  type: 'statistic';
  title: string;
  value: number;
  change: string;
  trend: 'up' | 'down';
  period: string;
  source: string;
}

interface ProfileItem extends BaseItem {
  type: 'profile';
  name: string;
  role: string;
  company: string;
  location: string;
  experience: string;
  skills: string[];
}

type ContentItem = ArticleItem | ImageItem | QuoteItem | StatisticItem | ProfileItem;

// Content arrays for variety
const AUTHORS = [
  'Emma Thompson',
  'James Wilson',
  'Sarah Parker',
  'Michael Chen',
  'Lisa Rodriguez',
] as const;
const COMPANIES = ['TechCorp', 'InnovateLabs', 'FutureWorks', 'DesignHub', 'DataFlow'] as const;
const TOPICS = [
  'AI & ML',
  'UX Design',
  'Web Development',
  'Mobile Apps',
  'Cloud Computing',
] as const;
const LOCATIONS = ['San Francisco', 'New York', 'London', 'Tokyo', 'Berlin'] as const;
const SKILLS = [
  'JavaScript',
  'Python',
  'React',
  'Node.js',
  'UI/UX',
  'AWS',
  'Docker',
  'TypeScript',
] as const;

const BACKGROUND_COLORS = [
  'bg-pink-500',
  'bg-purple-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
] as const;

// Helper function to get random array element
const getRandomElement = <T,>(array: readonly T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Generate unique content items
const generateUniqueItem = (id: number, direction: string): ContentItem => {
  const types: ContentType[] = ['article', 'image', 'quote', 'statistic', 'profile'];
  const type = types[id % types.length];
  const timestamp = new Date().toISOString();

  const baseItem: BaseItem = {
    id: `${direction}_${id}`,
    timestamp,
    type,
    backgroundColor: getRandomElement(BACKGROUND_COLORS),
  };

  switch (type) {
    case 'article':
      return {
        ...baseItem,
        type,
        title: `${getRandomElement(TOPICS)} Insights #${id}`,
        subtitle: `Latest Updates from ${getRandomElement(LOCATIONS)}`,
        content: `Fresh perspective on ${getRandomElement(TOPICS)} with unique insights for item ${id}.`,
        author: getRandomElement(AUTHORS),
        readTime: `${Math.floor(Math.random() * 10) + 2} min read`,
      };

    case 'image':
      return {
        ...baseItem,
        type,
        title: `Moment ${id}`,
        imageNumber: Math.floor(Math.random() * 5) + 1,
        caption: `A unique moment captured in ${getRandomElement(LOCATIONS)}`,
        photographer: getRandomElement(AUTHORS),
        likes: Math.floor(Math.random() * 1000) + 100,
      };

    case 'quote':
      return {
        ...baseItem,
        type,
        quote: `Unique perspective #${id}: "${getRandomElement(TOPICS)} is transforming the way we think about technology"`,
        author: getRandomElement(AUTHORS),
        category: getRandomElement(TOPICS),
      };

    case 'statistic':
      return {
        ...baseItem,
        type,
        title: `${getRandomElement(TOPICS)} Growth`,
        value: Math.floor(Math.random() * 100),
        change: `${(Math.random() * 20 - 10).toFixed(1)}%`,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        period: 'Last 30 days',
        source: getRandomElement(COMPANIES),
      };

    case 'profile':
      return {
        ...baseItem,
        type,
        name: getRandomElement(AUTHORS),
        role: `${getRandomElement(TOPICS)} Specialist`,
        company: getRandomElement(COMPANIES),
        location: getRandomElement(LOCATIONS),
        experience: `${Math.floor(Math.random() * 15) + 1} years`,
        skills: Array.from(new Set(SKILLS))
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 3) + 2),
      };
  }
};

interface RenderItemProps {
  item: ContentItem;
  virtualIndex: number;
}

export default function SwiperImplementation() {
  const nextIdCounter = useRef(5);
  const prevIdCounter = useRef(-1);

  const [initialItems] = useState<ContentItem[]>(() =>
    Array.from({ length: 5 }, (_, i) => generateUniqueItem(i, 'initial'))
  );

  const fetchNextItems = async (): Promise<ContentItem[]> => {
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 800));

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

  const fetchPreviousItems = async (): Promise<ContentItem[]> => {
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 800));

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

  const renderItem = ({ item }: RenderItemProps) => {
    switch (item.type) {
      case 'article':
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

      case 'image':
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

      case 'quote':
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

      case 'statistic':
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

      case 'profile':
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
