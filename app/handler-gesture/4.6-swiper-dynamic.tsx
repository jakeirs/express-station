import { View, Text } from 'react-native';
import type { SwipeDirection } from '~/components/4.6-SwiperDynamic2';
import Swiper from '~/components/4.6-SwiperDynamic2';

export default function SwiperExample() {
  // Define your item structure
  interface SwiperItem {
    id: string;
    title: string;
    description: string;
    date: string;
    badge: string;
    color: string;
  }

  // Generate 12 initial items with different colors and data
  const colors = [
    'bg-pink-500',
    'bg-purple-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-lime-500',
    'bg-amber-500',
  ];

  const badges = ['New', 'Popular', 'Featured', 'Limited', 'Sale', 'Premium'];

  // Generate our 12 items
  const initialItems: SwiperItem[] = Array.from({ length: 12 }, (_, i) => ({
    id: `item-${i + 1}`,
    title: `Item ${i + 1}`,
    description: `This is a detailed description for item number ${i + 1}. It contains information about this specific item.`,
    date: new Date(2023, 0, i + 1).toISOString().split('T')[0], // YYYY-MM-DD format
    badge: badges[i % badges.length],
    color: colors[i % colors.length],
  }));

  // Define how each item should be rendered
  const renderItem = ({ item, index }: { item: SwiperItem; index: number }) => (
    <View className={`flex-1 ${item.color} p-6`}>
      <Text className="text-2xl font-bold text-white">{item.title}</Text>
      <Text className="mt-2 text-white/80">{item.description}</Text>

      <View className="mt-auto">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="rounded-full bg-black/20 px-3 py-1">
            <Text className="text-xs text-white">Date: {item.date}</Text>
          </View>

          <View className="rounded-full bg-white/20 px-3 py-1">
            <Text className="text-xs text-white">{item.badge}</Text>
          </View>
        </View>

        <View className="rounded-lg bg-black/20 p-2">
          <Text className="text-center text-xs text-white">Item Index: {index}</Text>
        </View>
      </View>
    </View>
  );

  // Handle swipe events
  const handleSwipeEnd = ({ direction }: { direction: SwipeDirection }) => {
    console.log(`Swiped ${direction}`);
    // Additional logic can go here, like loading more items, etc.
  };

  return (
    <Swiper
      initialItems={initialItems}
      renderItem={renderItem}
      initialIndex={4}
      onSwipeEnd={handleSwipeEnd}
      showDebugPanel={true} // Set to false to hide the debug panel in production
    />
  );
}
