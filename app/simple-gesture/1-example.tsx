import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ActivityIndicator, SafeAreaView } from 'react-native';
import Swiper, { SwipeDirection, ItemData } from '~/components/4.9.2-SwiperDynamicPreviousVirtual'; // Import the Swiper component you've already created

// Define our item structure with TypeScript
interface CalendarItem extends ItemData {
  id: string;
  date: string;
  day: number;
  month: string;
  year: number;
  events: string[];
  color: string;
}

// Generate a date string in YYYY-MM-DD format
const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Generate a random color
const getRandomColor = (): string => {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFBE0B',
    '#FB5607',
    '#8338EC',
    '#3A86FF',
    '#606C38',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Generate calendar items for a date range
const generateCalendarItems = (startDate: Date, days: number): CalendarItem[] => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);

    // Generate 0-3 random events for this day
    const eventCount = Math.floor(Math.random() * 4);
    const events = Array.from(
      { length: eventCount },
      (_, i) => `Event ${i + 1} on ${date.getDate()} ${months[date.getMonth()]}`
    );

    return {
      id: formatDateString(date),
      date: formatDateString(date),
      day: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear(),
      events,
      color: getRandomColor(),
    };
  });
};

const SwiperImplementation: React.FC = () => {
  // Current date as the reference point
  const today = new Date();

  // State for our calendar items
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>(() => {
    // Initially generate 15 days centered around today
    const initialStartDate = new Date(today);
    initialStartDate.setDate(today.getDate() - 7); // Start 7 days before today
    return generateCalendarItems(initialStartDate, 15);
  });

  // Track loading states separately for previous and next
  const [isLoadingPrevious, setIsLoadingPrevious] = useState<boolean>(false);
  const [isLoadingNext, setIsLoadingNext] = useState<boolean>(false);

  // Find the index of today in our items array to set as initial
  const findTodayIndex = useCallback(() => {
    const todayString = formatDateString(today);
    return calendarItems.findIndex((item) => item.date === todayString);
  }, [calendarItems]);

  // Initial index calculation
  const [initialIndex] = useState<number>(() => {
    const index = findTodayIndex();
    return index !== -1 ? index : Math.floor(calendarItems.length / 2);
  });

  // Handler for fetching more data based on swipe direction
  const handleSwipeEnd = useCallback(
    ({
      direction,
      currentIndex,
      distanceFromEdge,
      shouldFetch,
    }: {
      direction: SwipeDirection;
      currentIndex: number;
      distanceFromEdge: number;
      shouldFetch: boolean;
    }) => {
      // Only fetch if we're close to the edge and not already loading
      if (!shouldFetch) return;

      if (direction === 'next' && !isLoadingNext) {
        // Fetch future dates
        setIsLoadingNext(true);

        // Get the last date in our current array
        const lastItem = calendarItems[calendarItems.length - 1];
        const lastDate = new Date(lastItem.date);
        const newStartDate = new Date(lastDate);
        newStartDate.setDate(newStartDate.getDate() + 1); // Start from the day after our last item

        console.log(`Fetching next days starting from ${formatDateString(newStartDate)}`);

        // Simulate API call delay
        setTimeout(() => {
          const newItems = generateCalendarItems(newStartDate, 10);
          setCalendarItems((prev) => [...prev, ...newItems]);
          setIsLoadingNext(false);
          console.log(`Added ${newItems.length} new future days`);
        }, 1500);
      } else if (direction === 'previous' && !isLoadingPrevious) {
        // Fetch past dates
        setIsLoadingPrevious(true);

        // Get the first date in our current array
        const firstItem = calendarItems[0];
        const firstDate = new Date(firstItem.date);
        const newEndDate = new Date(firstDate);
        newEndDate.setDate(newEndDate.getDate() - 1); // End with the day before our first item

        // Calculate start date for the new batch (10 days before)
        const newStartDate = new Date(newEndDate);
        newStartDate.setDate(newEndDate.getDate() - 9); // 10 days total

        console.log(
          `Fetching previous days starting from ${formatDateString(newStartDate)} to ${formatDateString(newEndDate)}`
        );

        // Simulate API call delay
        setTimeout(() => {
          const newItems = generateCalendarItems(newStartDate, 10);
          console.log(
            'newItems Prev',
            newItems.map((i) => i.date)
          );

          // When adding items to the beginning, we need to update currentIndex
          // to keep the same day visible
          setCalendarItems((prev) => [...newItems, ...prev]);
          setIsLoadingPrevious(false);
          console.log(`Added ${newItems.length} new past days`);
        }, 1500);
      }
    },
    [calendarItems, isLoadingNext, isLoadingPrevious]
  );

  // Render each calendar item
  const renderCalendarItem = useCallback(
    ({ item, index }: { item: CalendarItem; index: number }) => (
      <View className="flex-1 p-6" style={{ backgroundColor: item.color }}>
        <View className="flex-1 justify-between">
          <View>
            <Text className="text-3xl font-bold text-white">{item.day}</Text>
            <Text className="text-xl text-white/90">
              {item.month} {item.year}
            </Text>

            <View className="mt-6 rounded-lg bg-black/10 p-3">
              <Text className="mb-2 text-white">Index in list: {index}</Text>
              <Text className="text-white/80">Date: {item.date}</Text>
            </View>

            {item.events.length > 0 && (
              <View className="mt-6">
                <Text className="mb-2 font-semibold text-white">Events:</Text>
                {item.events.map((event, i) => (
                  <View key={i} className="mb-2 rounded-md bg-white/20 p-2">
                    <Text className="text-white">{event}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <View className="rounded-full bg-black/20 px-3 py-1">
              <Text className="text-xs text-white">
                {item.events.length} {item.events.length === 1 ? 'event' : 'events'}
              </Text>
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
    <SafeAreaView className="flex-1">
      <View className="flex-1">
        <Swiper
          initialItems={calendarItems}
          renderItem={renderCalendarItem}
          initialIndex={initialIndex}
          onSwipeEnd={handleSwipeEnd}
          // fetchThreshold={6} // Start fetching when 3 items from either edge
          showDebugPanel={true}
        />

        {/* Loading indicators */}
        <View className="absolute top-16 w-full flex-row justify-between px-4">
          {isLoadingPrevious && (
            <View className="rounded-full bg-black/50 p-2">
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          )}

          {isLoadingNext && (
            <View className="ml-auto rounded-full bg-black/50 p-2">
              <ActivityIndicator size="small" color="#ffffff" />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SwiperImplementation;
