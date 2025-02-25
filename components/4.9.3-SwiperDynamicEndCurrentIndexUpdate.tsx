import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Dimensions, ScrollView, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Define our screen dimensions and thresholds
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VISIBLE_ITEMS_THRESHOLD = 2;
const FETCH_THRESHOLD = 4;

export type SwipeDirection = 'next' | 'previous';

// Generic type for item data
export interface ItemData {
  id: string | number;
  [key: string]: any;
}

// Type for render item function
export type RenderItemFunction<T extends ItemData> = (info: {
  item: T;
  index: number;
}) => React.ReactNode;

// Define our component props
interface SwiperProps<T extends ItemData> {
  initialItems: T[];
  renderItem: RenderItemFunction<T>;
  initialIndex?: number;
  onSwipeEnd?: (info: {
    direction: SwipeDirection;
    currentIndex: number;
    distanceFromEdge: number;
    shouldFetch: boolean;
  }) => void;
  fetchThreshold?: number;
  showDebugPanel?: boolean;
}

// Debug component props
interface DebugLogProps {
  currentIndex: number;
  displayIndex: number;
  itemCount: number;
  translateX: number;
  itemsLength: number;
  isUpdating: boolean;
  visibleItemsLength: number;
}

// Debug component
function DebugLog({
  currentIndex,
  displayIndex,
  itemCount,
  isUpdating,
  visibleItemsLength,
  itemsLength,
  translateX,
}: DebugLogProps) {
  return (
    <ScrollView
      className="absolute bottom-0 left-0 right-0 h-32 bg-black/80"
      contentContainerClassName="p-2">
      <Text className="text-xs text-white">Current Index (shared): {currentIndex}</Text>
      <Text className="text-xs text-white">Display Index (state): {displayIndex}</Text>
      <Text className="text-xs text-white">translateX: {translateX}</Text>
      <Text className="text-xs text-white">visible Items: {visibleItemsLength}</Text>
      <Text className="text-xs text-white">itemsLength: {itemsLength}</Text>
      <Text className="text-xs text-white">Total Items: {itemCount}</Text>
      <Text className="text-xs text-white">Is Updating: {isUpdating ? 'Yes' : 'No'}</Text>
      <Text className="text-xs text-white">Distance to Start: {displayIndex}</Text>
      <Text className="text-xs text-white">Distance to End: {itemCount - displayIndex - 1}</Text>
    </ScrollView>
  );
}

// Enhanced swiper with shared currentIndex
function Swiper<T extends ItemData>({
  initialItems,
  renderItem,
  initialIndex = 0,
  onSwipeEnd,
  fetchThreshold = FETCH_THRESHOLD,
  showDebugPanel = false,
}: SwiperProps<T>) {
  // Store current set of items
  const [items, setItems] = useState(initialItems);

  // Use shared value for current index to ensure UI thread synchronization
  const currentIndex = useSharedValue(Math.min(initialIndex, initialItems.length - 1));

  // State version for React rendering (pagination, etc.)
  const [displayIndex, setDisplayIndex] = useState(currentIndex.value);

  // Flag to track if we're currently updating items - using shared value
  const isUpdating = useSharedValue(false);
  const isPrepending = useSharedValue(false);

  // Animation value for position - directly linked to currentIndex
  const translateX = useSharedValue(-currentIndex.value * SCREEN_WIDTH);

  // Reference to previous props for comparison
  const prevItemsRef = useRef(initialItems);
  const prevItemsFirstIdRef = useRef(initialItems.length > 0 ? initialItems[0].id : null);

  // Sync currentIndex to displayIndex for React rendering
  useAnimatedReaction(
    () => currentIndex.value,
    (value) => {
      runOnJS(setDisplayIndex)(value);
    }
  );

  // Function to synchronize isUpdating between threads
  const setUpdating = useCallback(
    (value: boolean) => {
      isUpdating.value = value;
    },
    [isUpdating.value]
  );

  // Handle updates to items - this is crucial for prepended items
  const updateItems = useCallback(() => {
    // Skip if no change in reference
    if (initialItems === prevItemsRef.current) {
      return;
    }

    // Set updating and prepending flags to disable gestures
    setUpdating(true);
    isPrepending.value = true;

    // Handle the case when new items are prepended
    if (prevItemsFirstIdRef.current !== null && initialItems.length > prevItemsRef.current.length) {
      // Find where the first item of the previous array is in the new array
      let prependedCount = 0;
      let foundFirstItem = false;

      for (let i = 0; i < initialItems.length; i++) {
        if (initialItems[i].id === prevItemsFirstIdRef.current) {
          prependedCount = i;
          foundFirstItem = true;
          break;
        }
      }

      // If items were prepended, adjust the current index
      if (foundFirstItem && prependedCount > 0) {
        // Use shared value directly for the UI thread
        const newIndex = currentIndex.value + prependedCount;
        currentIndex.value = newIndex;

        // Directly update animation value to prevent visual jump
        translateX.value = -newIndex * SCREEN_WIDTH;
      }
    }

    // Update state and refs
    setItems(initialItems);
    prevItemsRef.current = initialItems;
    prevItemsFirstIdRef.current = initialItems.length > 0 ? initialItems[0].id : null;

    // Clear updating flags after a short delay to let rendering complete
    setTimeout(() => {
      isPrepending.value = false;
      setUpdating(false);
    }, 100);
  }, [initialItems, currentIndex, translateX, setUpdating]);

  // Apply updates when items change
  useMemo(() => {
    updateItems();
  }, [updateItems]);

  // Get visible items for efficient rendering
  const visibleItems = useMemo(() => {
    if (items.length === 0) return [];

    // Use display index for React-based calculations
    const startIdx = Math.max(0, displayIndex - VISIBLE_ITEMS_THRESHOLD);
    const endIdx = Math.min(items.length - 1, displayIndex + VISIBLE_ITEMS_THRESHOLD);

    const result = [];
    for (let i = startIdx; i <= endIdx; i++) {
      result.push({
        index: i,
        item: items[i],
      });
    }

    return result;
  }, [items, displayIndex]);

  // Handle checking for fetch need
  const checkFetchNeeded = useCallback(
    (direction: SwipeDirection, index: number) => {
      if (!onSwipeEnd) return;

      const distanceFromEdge = direction === 'next' ? items.length - index - 1 : index;
      const shouldFetch = distanceFromEdge <= fetchThreshold;

      onSwipeEnd({
        direction,
        currentIndex: index,
        distanceFromEdge,
        shouldFetch,
      });
    },
    [items.length, onSwipeEnd, fetchThreshold]
  );

  // Pan gesture for swiping - disabled during updates
  const panGesture = Gesture.Pan()
    .enabled(!isUpdating.value && !isPrepending.value) // Using shared value for immediate checking on UI thread
    .onUpdate((event) => {
      // Skip if updating - this check happens directly on the UI thread
      if (isUpdating.value || isPrepending.value) return;

      // Simple translation based on drag
      translateX.value = -currentIndex.value * SCREEN_WIDTH + event.translationX;
    })
    .onEnd((event) => {
      // Skip if updating - this check happens directly on the UI thread
      if (isUpdating.value || isPrepending.value) return;

      // Determine if we should change slides
      const velocityThreshold = Math.abs(event.velocityX) > 500;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      let newIndex = currentIndex.value;
      let direction = undefined;

      if (velocityThreshold || distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          // Going backward (right swipe)
          if (currentIndex.value > 0) {
            newIndex = currentIndex.value - 1;
            direction = 'previous';
          }
        } else {
          // Going forward (left swipe)
          if (currentIndex.value < items.length - 1) {
            newIndex = currentIndex.value + 1;
            direction = 'next';
          }
        }
      }

      // Animate to the final position
      translateX.value = withSpring(-newIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 100,
        mass: 0.5,
        velocity: event.velocityX,
      });

      // Update the index if changed - directly on UI thread first
      if (newIndex !== currentIndex.value) {
        // Update shared value immediately
        currentIndex.value = newIndex;

        // Then notify JS thread about fetch needs
        if (direction) {
          runOnJS(checkFetchNeeded)(direction, newIndex);
        }
      }
    });

  // Animation style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View className="flex-1 flex-row" style={animatedStyle}>
          {visibleItems.map(({ index, item }) => (
            <View
              key={item.id ?? index}
              className="w-screen items-center justify-center"
              style={{
                width: SCREEN_WIDTH,
                position: 'absolute',
                left: index * SCREEN_WIDTH,
              }}>
              <View className="h-full w-full">{renderItem({ item, index })}</View>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {/* Pagination dots */}
      <View className="absolute top-10 w-full flex-row items-center justify-center">
        {items.map((_, index) => (
          <View
            key={index}
            className={`mx-1 h-2 w-2 rounded-full ${
              displayIndex === index ? 'scale-110 bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </View>

      {/* Debug panel */}
      {showDebugPanel && (
        <DebugLog
          currentIndex={currentIndex.value}
          displayIndex={displayIndex}
          itemCount={items.length}
          isUpdating={isUpdating.value}
          visibleItemsLength={visibleItems.length}
          itemsLength={items.length}
          translateX={translateX.value}
        />
      )}
    </View>
  );
}

export default Swiper;
