import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ActivityIndicator, SafeAreaView } from 'react-native';
import Swiper, { SwipeDirection, ItemData } from '~/components/4.9.2.2-SelfCorrection'; // Import the Swiper component you've already created

// Constants for calendar configuration
const FETCH_BATCH_SIZE = 30; // Number of days to fetch in each batch
const INITIAL_DAYS = 15; // Initial number of days to generate
const INITIAL_OFFSET = 7; // Number of days before today to start
const API_SIMULATION_DELAY = 1500; // Milliseconds to simulate API delay

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
    // Initially generate days centered around today
    const initialStartDate = new Date(today);
    initialStartDate.setDate(today.getDate() - INITIAL_OFFSET);
    return generateCalendarItems(initialStartDate, INITIAL_DAYS);
  });

  const calendarDates = calendarItems.map((i) => i.date);
  console.log('calendarDates!!!!!!!!11', calendarDates);

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
          const newItems = generateCalendarItems(newStartDate, FETCH_BATCH_SIZE);
          // Filter out items that already exist in the current array
          const uniqueNewItems = newItems.filter(
            (newItem) => !calendarItems.some((existingItem) => existingItem.date === newItem.date)
          );
          setCalendarItems((prev) => [...prev, ...uniqueNewItems]);
          setIsLoadingNext(false);
          console.log(`Added ${uniqueNewItems.length} new unique future days`);
        }, API_SIMULATION_DELAY);
      } else if (direction === 'previous' && !isLoadingPrevious) {
        // Fetch past dates
        setIsLoadingPrevious(true);

        // Get the first date in our current array
        const firstItem = calendarItems[0];
        const firstDate = new Date(firstItem.date);
        const newStartDate = new Date(firstDate);
        newStartDate.setDate(newStartDate.getDate() - FETCH_BATCH_SIZE); // Start FETCH_BATCH_SIZE days before our first item

        console.log(`Fetching previous days starting from ${formatDateString(newStartDate)}`);

        // Simulate API call delay
        setTimeout(() => {
          const newItems = generateCalendarItems(newStartDate, FETCH_BATCH_SIZE);
          console.log(
            'newItems Prev',
            newItems.map((i) => i.date)
          );

          // Filter out items that already exist in the current array
          const uniqueNewItems = newItems.filter(
            (newItem) => !calendarItems.some((existingItem) => existingItem.date === newItem.date)
          );

          console.log('uniqueNewItems. LENDGTH', uniqueNewItems.length, newItems.length);

          // When adding items to the beginning, we need to update currentIndex
          // to keep the same day visible
          setCalendarItems((prev) => [...uniqueNewItems, ...prev]);
          setIsLoadingPrevious(false);
          console.log(`Added ${uniqueNewItems.length} new unique past days`);
        }, API_SIMULATION_DELAY);
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

  // check if there is some duplicates in dates and consolog it --> there are still dupliates in dates

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
