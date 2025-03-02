import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedRef,
  scrollTo,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

// Get screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Spring animation config
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 90,
  mass: 1,
  overshootClamping: false,
};

// Define item data structure
interface CalendarItem {
  id: string;
  date: string;
  day: number;
  month: string;
  year: number;
  events: string[];
  color: string;
}

// Constants
const FETCH_BATCH_SIZE = 5;
const INITIAL_DAYS = 15;
const INITIAL_OFFSET = 7;
const API_SIMULATION_DELAY = 1500;
const SWIPE_THRESHOLD = 0.2; // Percentage of screen width needed to trigger a swipe

// Helper functions
const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

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

// Animated FlatList
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const ControlledSwiper: React.FC = () => {
  // Refs
  const flatListRef = useAnimatedRef<FlatList<CalendarItem>>();
  const scrollX = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const gestureActive = useSharedValue(false);
  const pendingLayoutChange = useRef(false);

  // Current date as reference point
  const today = new Date();

  // State for calendar items
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>(() => {
    const initialStartDate = new Date(today);
    initialStartDate.setDate(today.getDate() - INITIAL_OFFSET);
    return generateCalendarItems(initialStartDate, INITIAL_DAYS);
  });

  // Tracking current visible index
  const [currentIndex, setCurrentIndex] = useState<number>(INITIAL_OFFSET);

  // Loading states
  const [isLoadingPrevious, setIsLoadingPrevious] = useState<boolean>(false);
  const [isLoadingNext, setIsLoadingNext] = useState<boolean>(false);

  // Boundary states
  const [reachedEarliestDate, setReachedEarliestDate] = useState(false);
  const [reachedLatestDate, setReachedLatestDate] = useState(false);

  // Track swipe direction for smart loading
  const [lastSwipeDirection, setLastSwipeDirection] = useState<'next' | 'prev' | null>(null);

  // Initial index (today's date)
  const findTodayIndex = useCallback(() => {
    const todayString = formatDateString(today);
    return calendarItems.findIndex((item) => item.date === todayString);
  }, [calendarItems]);

  // Boundary detection
  useEffect(() => {
    // This is just for demonstration - in a real app you'd set these based on your data source limits
    const earliestAllowedDate = new Date('2020-01-01');
    const latestAllowedDate = new Date();
    latestAllowedDate.setFullYear(today.getFullYear() + 2); // 2 years into future

    // Check if our current data set includes dates near these boundaries
    if (calendarItems.length > 0) {
      const firstItemDate = new Date(calendarItems[0].date);
      const lastItemDate = new Date(calendarItems[calendarItems.length - 1].date);

      // Within 10 days of the boundary
      const nearestPast =
        Math.abs(firstItemDate.getTime() - earliestAllowedDate.getTime()) <
        10 * 24 * 60 * 60 * 1000;
      const nearestFuture =
        Math.abs(lastItemDate.getTime() - latestAllowedDate.getTime()) < 10 * 24 * 60 * 60 * 1000;

      setReachedEarliestDate(nearestPast);
      setReachedLatestDate(nearestFuture);
    }
  }, [calendarItems, today]);

  // Handle loading more data when nearing the end
  const handleLoadMoreData = useCallback(() => {
    if (
      currentIndex >= calendarItems.length - 3 &&
      !isLoadingNext &&
      !reachedLatestDate &&
      lastSwipeDirection === 'next'
    ) {
      // Load more future dates
      setIsLoadingNext(true);

      const lastItem = calendarItems[calendarItems.length - 1];
      const lastDate = new Date(lastItem.date);
      const newStartDate = new Date(lastDate);
      newStartDate.setDate(newStartDate.getDate() + 1);

      console.log(`Fetching next days starting from ${formatDateString(newStartDate)}`);

      // Simulate API call
      setTimeout(() => {
        const newItems = generateCalendarItems(newStartDate, FETCH_BATCH_SIZE);
        // Filter out duplicates
        const uniqueNewItems = newItems.filter(
          (newItem) => !calendarItems.some((existingItem) => existingItem.date === newItem.date)
        );
        setCalendarItems((prev) => [...prev, ...uniqueNewItems]);
        setIsLoadingNext(false);
        console.log(`Added ${uniqueNewItems.length} new unique future days`);
      }, API_SIMULATION_DELAY);
    }
  }, [calendarItems, currentIndex, isLoadingNext, reachedLatestDate, lastSwipeDirection]);

  // Load more data when approaching the beginning
  const handleLoadPreviousData = useCallback(() => {
    if (
      currentIndex <= 2 &&
      !isLoadingPrevious &&
      !reachedEarliestDate &&
      lastSwipeDirection === 'prev'
    ) {
      // Load more past dates
      setIsLoadingPrevious(true);
      pendingLayoutChange.current = true;

      const firstItem = calendarItems[0];
      const firstDate = new Date(firstItem.date);
      const newStartDate = new Date(firstDate);
      newStartDate.setDate(newStartDate.getDate() - FETCH_BATCH_SIZE);

      console.log(`Fetching previous days starting from ${formatDateString(newStartDate)}`);

      // Simulate API call
      setTimeout(() => {
        const newItems = generateCalendarItems(newStartDate, FETCH_BATCH_SIZE);
        // Filter out duplicates
        const uniqueNewItems = newItems.filter(
          (newItem) => !calendarItems.some((existingItem) => existingItem.date === newItem.date)
        );

        if (uniqueNewItems.length === 0) {
          setIsLoadingPrevious(false);
          pendingLayoutChange.current = false;
          return;
        }

        // Temporarily disable gestures during this update
        gestureActive.value = true;

        // Store the current item's date so we can find it after update
        const currentItemDate = calendarItems[currentIndex].date;

        // Update items
        setCalendarItems((prev) => {
          const updatedItems = [...uniqueNewItems, ...prev];

          // After state update is processed
          setTimeout(() => {
            // Find the index of our current item in the new array
            const newCurrentIndex = updatedItems.findIndex((item) => item.date === currentItemDate);

            if (newCurrentIndex !== -1) {
              // Update current index
              setCurrentIndex(newCurrentIndex);

              // Update the scroll position to keep the same visual item
              scrollX.value = newCurrentIndex * SCREEN_WIDTH;
              scrollTo(flatListRef, newCurrentIndex * SCREEN_WIDTH, 0, false);
            }

            // Re-enable gestures and clear loading state
            gestureActive.value = false;
            setIsLoadingPrevious(false);
            pendingLayoutChange.current = false;
          }, 100);

          return updatedItems;
        });

        console.log(`Added ${uniqueNewItems.length} new unique past days`);
      }, API_SIMULATION_DELAY);
    }
  }, [
    calendarItems,
    currentIndex,
    isLoadingPrevious,
    reachedEarliestDate,
    lastSwipeDirection,
    scrollX,
    flatListRef,
    gestureActive,
  ]);

  // Monitor visible items to trigger loading more data
  useEffect(() => {
    if (!pendingLayoutChange.current) {
      handleLoadMoreData();
      handleLoadPreviousData();
    }
  }, [currentIndex, handleLoadMoreData, handleLoadPreviousData]);

  // Strictly move one item at a time, regardless of gesture velocity
  const moveOneItem = useCallback(
    (direction: 'prev' | 'next') => {
      if (gestureActive.value || pendingLayoutChange.current) return; // Prevent during active gesture

      // Calculate target index
      const targetIndex =
        direction === 'prev'
          ? Math.max(0, currentIndex - 1)
          : Math.min(calendarItems.length - 1, currentIndex + 1);

      // If no change needed, return
      if (targetIndex === currentIndex) return;

      // Update gesture active flag
      gestureActive.value = true;

      // Spring animation to the target position
      scrollX.value = withSpring(targetIndex * SCREEN_WIDTH, SPRING_CONFIG, () => {
        // Update current index after animation completes
        runOnJS(setCurrentIndex)(targetIndex);

        // Update last swipe direction for smart loading
        runOnJS(setLastSwipeDirection)(direction);

        // Release the gesture lock
        gestureActive.value = false;
      });

      // Update the FlatList scroll position
      scrollTo(flatListRef, targetIndex * SCREEN_WIDTH, 0, false);
    },
    [currentIndex, calendarItems.length, scrollX, flatListRef, gestureActive]
  );

  // Create a pan gesture handler
  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (gestureActive.value || pendingLayoutChange.current) return;
      isDragging.value = true;
      gestureActive.value = true;
    })
    .onUpdate((event) => {
      if (pendingLayoutChange.current) return;

      // Limit translation to just enough to see the next/previous item slightly
      // This gives visual feedback without allowing multi-item scrolling
      const maxTranslation = SCREEN_WIDTH * 0.8;

      // Clamp translation to avoid overshooting
      let translationX = Math.max(Math.min(event.translationX, maxTranslation), -maxTranslation);

      // Apply resistance at boundaries
      if (
        (currentIndex === 0 && translationX > 0) ||
        (currentIndex === calendarItems.length - 1 && translationX < 0)
      ) {
        // Square root creates resistance effect
        translationX = Math.sign(translationX) * Math.sqrt(Math.abs(translationX)) * 5;
      }

      // Calculate new scroll position
      const newPosition = currentIndex * SCREEN_WIDTH - translationX;
      scrollX.value = newPosition;

      // Update the FlatList scroll position
      scrollTo(flatListRef, newPosition, 0, false);
    })
    .onEnd((event) => {
      if (pendingLayoutChange.current) return;

      isDragging.value = false;

      // Determine if swipe was significant enough to change item
      const swipeThreshold = SCREEN_WIDTH * SWIPE_THRESHOLD;
      let targetIndex = currentIndex;
      let direction: 'prev' | 'next' | null = null;

      if (Math.abs(event.translationX) > swipeThreshold) {
        // Only allow moving one item at a time based on swipe direction
        if (event.translationX > 0 && currentIndex > 0) {
          targetIndex = currentIndex - 1;
          direction = 'prev';
        } else if (event.translationX < 0 && currentIndex < calendarItems.length - 1) {
          targetIndex = currentIndex + 1;
          direction = 'next';
        }
      }

      // Spring animation to the target index
      scrollX.value = withSpring(targetIndex * SCREEN_WIDTH, SPRING_CONFIG, () => {
        // Update the current index and swipe direction
        if (targetIndex !== currentIndex) {
          runOnJS(setCurrentIndex)(targetIndex);
          if (direction) runOnJS(setLastSwipeDirection)(direction);
        }

        // Reset gesture active flag
        gestureActive.value = false;
      });

      // Update the FlatList scroll position
      scrollTo(flatListRef, targetIndex * SCREEN_WIDTH, 0, false);
    });

  // Scroll to index
  const scrollToIndex = useCallback(
    (index: number, animated: boolean = true, direction: 'prev' | 'next' | null = null) => {
      if (gestureActive.value || pendingLayoutChange.current) return; // Prevent during active gesture

      const validIndex = Math.max(0, Math.min(index, calendarItems.length - 1));
      gestureActive.value = true;

      if (animated) {
        scrollX.value = withSpring(validIndex * SCREEN_WIDTH, SPRING_CONFIG, () => {
          runOnJS(setCurrentIndex)(validIndex);
          if (direction) runOnJS(setLastSwipeDirection)(direction);
          gestureActive.value = false;
        });
      } else {
        scrollX.value = validIndex * SCREEN_WIDTH;
        setCurrentIndex(validIndex);
        if (direction) setLastSwipeDirection(direction);
        gestureActive.value = false;
      }

      // Update the FlatList scroll position
      scrollTo(flatListRef, validIndex * SCREEN_WIDTH, 0, !animated);
    },
    [calendarItems.length, scrollX, flatListRef, gestureActive]
  );

  // Jump to today
  const scrollToToday = useCallback(() => {
    const todayIndex = findTodayIndex();
    if (todayIndex !== -1) {
      scrollToIndex(todayIndex, true);
    }
  }, [findTodayIndex, scrollToIndex]);

  // Scroll to initial position on first render
  useEffect(() => {
    const initialIndex = findTodayIndex();
    if (initialIndex !== -1) {
      // Small delay to ensure the FlatList is rendered
      setTimeout(() => {
        scrollToIndex(initialIndex, false);
      }, 100);
    }
  }, [findTodayIndex, scrollToIndex]);

  // Render item
  const renderItem = useCallback(
    ({ item, index }: { item: CalendarItem; index: number }) => (
      <View className="h-full w-screen justify-center p-5" style={{ backgroundColor: item.color }}>
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

        {/* Boundary indicators */}
        {index === 0 && (
          <View className="absolute left-2.5 top-1/2 h-8 w-8 -translate-y-4 items-center justify-center rounded-full bg-black/40">
            {isLoadingPrevious ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : reachedEarliestDate ? (
              <Text className="text-xs text-white">Earliest</Text>
            ) : (
              <Text className="text-xl font-bold text-white">←</Text>
            )}
          </View>
        )}

        {index === calendarItems.length - 1 && (
          <View className="absolute right-2.5 top-1/2 h-8 w-8 -translate-y-4 items-center justify-center rounded-full bg-black/40">
            {isLoadingNext ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : reachedLatestDate ? (
              <Text className="text-xs text-white">Latest</Text>
            ) : (
              <Text className="text-xl font-bold text-white">→</Text>
            )}
          </View>
        )}
      </View>
    ),
    [calendarItems.length, isLoadingNext, isLoadingPrevious, reachedEarliestDate, reachedLatestDate]
  );

  return (
    <View className="flex-1 bg-gray-100">
      <View className="items-center border-b border-gray-200 bg-white px-5 py-4">
        <Text className="text-lg font-bold">Calendar Swiper</Text>
        {currentIndex < calendarItems.length && (
          <Text className="mt-1 text-sm text-gray-500">
            {calendarItems[currentIndex]?.month} {calendarItems[currentIndex]?.year}
          </Text>
        )}
      </View>

      <View className="h-96">
        <GestureDetector gesture={panGesture}>
          <View className="h-full w-full">
            <AnimatedFlatList
              ref={flatListRef}
              data={calendarItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              initialNumToRender={3}
              maxToRenderPerBatch={5}
              windowSize={5}
              scrollEnabled={false} // Disable built-in scrolling
              className="flex-1"
              contentContainerStyle={{ flexGrow: 0 }}
              getItemLayout={(data, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
            />
          </View>
        </GestureDetector>
      </View>

      {/* Navigation buttons */}
      <View className="mt-2.5 flex-row items-center justify-between px-5">
        <TouchableOpacity
          className={`h-11 w-11 items-center justify-center rounded-full bg-white shadow ${
            currentIndex === 0 || isLoadingPrevious ? 'bg-gray-200 opacity-50' : ''
          }`}
          onPress={() => moveOneItem('prev')}
          disabled={currentIndex === 0 || isLoadingPrevious || pendingLayoutChange.current}>
          <Text className="text-xl font-bold">←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="rounded-full bg-white px-5 py-2.5 shadow"
          onPress={scrollToToday}
          disabled={pendingLayoutChange.current}>
          <Text className="font-semibold">Today</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`h-11 w-11 items-center justify-center rounded-full bg-white shadow ${
            currentIndex === calendarItems.length - 1 || isLoadingNext
              ? 'bg-gray-200 opacity-50'
              : ''
          }`}
          onPress={() => moveOneItem('next')}
          disabled={
            currentIndex === calendarItems.length - 1 ||
            isLoadingNext ||
            pendingLayoutChange.current
          }>
          <Text className="text-xl font-bold">→</Text>
        </TouchableOpacity>
      </View>

      {/* Pagination dots */}
      <View className="flex-row items-center justify-center py-2.5">
        {calendarItems.length <= 20 ? (
          // Show all dots if there are fewer than 20 items
          calendarItems.map((_, index) => (
            <View
              key={index}
              className={`mx-1 h-2 w-2 rounded-full ${
                currentIndex === index ? 'scale-110 bg-black' : 'bg-black/20'
              }`}
            />
          ))
        ) : (
          // Show limited dots for large datasets
          <>
            {/* First dot */}
            <View
              className={`mx-1 h-2 w-2 rounded-full ${
                currentIndex === 0 ? 'scale-110 bg-black' : 'bg-black/20'
              }`}
            />

            {/* Show ellipsis if we're not near the beginning */}
            {currentIndex > 2 && <Text className="mx-1 text-black/50">...</Text>}

            {/* Previous dot if not at beginning */}
            {currentIndex > 1 && <View className="mx-1 h-2 w-2 rounded-full bg-black/20" />}

            {/* Current dot */}
            {currentIndex > 0 && currentIndex < calendarItems.length - 1 && (
              <View className="mx-1 h-2 w-2 scale-110 rounded-full bg-black" />
            )}

            {/* Next dot if not at end */}
            {currentIndex < calendarItems.length - 2 && (
              <View className="mx-1 h-2 w-2 rounded-full bg-black/20" />
            )}

            {/* Show ellipsis if we're not near the end */}
            {currentIndex < calendarItems.length - 3 && (
              <Text className="mx-1 text-black/50">...</Text>
            )}

            {/* Last dot */}
            <View
              className={`mx-1 h-2 w-2 rounded-full ${
                currentIndex === calendarItems.length - 1 ? 'scale-110 bg-black' : 'bg-black/20'
              }`}
            />
          </>
        )}
      </View>

      {/* Debug info */}
      <View className="absolute bottom-2.5 left-0 right-0 bg-black/70 p-2.5">
        <Text className="text-xs text-white">Current Index: {currentIndex}</Text>
        <Text className="text-xs text-white">Total Items: {calendarItems.length}</Text>
        <Text className="text-xs text-white">
          Loading: {isLoadingPrevious ? 'Prev ' : ''}
          {isLoadingNext ? 'Next' : ''}
          {!isLoadingPrevious && !isLoadingNext && 'None'}
        </Text>
        <Text className="text-xs text-white">
          Last Swipe Direction: {lastSwipeDirection || 'None'}
        </Text>
        <Text className="text-xs text-white">
          Layout Change Pending: {pendingLayoutChange.current ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );
};

export default ControlledSwiper;
