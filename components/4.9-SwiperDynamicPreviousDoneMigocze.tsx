import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Dimensions, ScrollView, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Define our screen dimensions and thresholds
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VISIBLE_ITEMS_THRESHOLD = 2;
const FETCH_THRESHOLD = 4; // How many items from the edge to trigger fetch

export type SwipeDirection = 'next' | 'previous';

// Generic type for item data
export interface ItemData {
  id: string | number;
  [key: string]: any; // Allow for any additional properties
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
  fetchThreshold?: number; // Override the default threshold
  showDebugPanel?: boolean;
}

// Define visible item structure
interface VisibleItem<T extends ItemData> {
  index: number;
  item: T;
}

// Debug component props
interface DebugLogProps<T extends ItemData> {
  log: VisibleItem<T>[];
  currentIndex: number;
  totalItems: number;
  prependedItems: number;
}

// Debug component to visualize what's happening
function DebugLog<T extends ItemData>({
  log,
  currentIndex,
  totalItems,
  prependedItems,
}: DebugLogProps<T>) {
  const visibleItemsIds = log.map((item) => item.index);
  const distanceToStart = currentIndex;
  const distanceToEnd = totalItems - currentIndex - 1;

  return (
    <ScrollView
      className="absolute bottom-0 left-0 right-0 h-32 bg-black/80"
      contentContainerClassName="p-2">
      <Text className="mb-1 text-xs text-white">Visible Indices:</Text>
      <View className="mb-2 flex flex-row">
        {visibleItemsIds.map((entry, index) => (
          <Text key={index} className="mr-1 text-xs text-green-400">
            {entry}{' '}
          </Text>
        ))}
      </View>

      <Text className="text-xs text-red-400">Current Index: {currentIndex}</Text>
      <Text className="text-xs text-purple-400">Items Prepended: {prependedItems}</Text>
      <Text className="text-xs text-orange-400">Visible Items Count: {log.length}</Text>
      <Text className="text-xs text-blue-400">Total Items: {totalItems}</Text>
      <Text className="text-xs text-yellow-400">
        Distance to Start: {distanceToStart} | Distance to End: {distanceToEnd}
      </Text>
    </ScrollView>
  );
}

// Main Swiper component with generic type support
function Swiper<T extends ItemData>({
  initialItems,
  renderItem,
  initialIndex = 0,
  onSwipeEnd,
  fetchThreshold = FETCH_THRESHOLD,
  showDebugPanel = false,
}: SwiperProps<T>) {
  // Track how many items have been prepended to handle index adjustments
  const prependedItemsRef = useRef<number>(0);
  const [prependedItems, setPrependedItems] = useState(0);

  // Use state for items to properly handle updates
  const [items, setItems] = useState<T[]>(initialItems);

  // Track the previous items length to detect prepended items
  const prevItemsLengthRef = useRef<number>(initialItems.length);

  // Update items when initialItems changes, with special handling for prepended items
  useEffect(() => {
    // If new items array is longer than the previous one
    if (initialItems.length > prevItemsLengthRef.current) {
      // Calculate how many items were added
      const addedItems = initialItems.length - prevItemsLengthRef.current;

      // Check if items were prepended by comparing first few IDs
      // This is a heuristic - you may need a more robust method depending on your data
      const itemsWerePrepended = addedItems > 0 && initialItems[addedItems].id === items[0]?.id;

      if (itemsWerePrepended) {
        // Update our prepended items counter
        const newPrependedCount = prependedItemsRef.current + addedItems;
        prependedItemsRef.current = newPrependedCount;
        setPrependedItems(newPrependedCount);

        // Adjust current index by the number of prepended items
        setCurrentIndex((prevIndex) => prevIndex + addedItems);
      }
    }

    // Update our items and record the new length
    setItems(initialItems);
    prevItemsLengthRef.current = initialItems.length;
  }, [initialItems, items]);

  const itemCount = items.length;

  // State management for the current index
  const [currentIndex, setCurrentIndex] = useState<number>(
    initialIndex >= 0 && initialIndex < itemCount ? initialIndex : 0
  );

  // Animation values
  const translateX = useSharedValue<number>(-currentIndex * SCREEN_WIDTH);
  const isGestureActive = useSharedValue<boolean>(false);

  // Handle translateX adjustment when new items are added or current index changes
  useEffect(() => {
    // Ensure our animation value matches the current position
    translateX.value = -currentIndex * SCREEN_WIDTH;
  }, [currentIndex, translateX]);

  // Check fetch conditions and enhance onSwipeEnd with additional information
  const handleSwipeEnd = useCallback(
    (direction: SwipeDirection, index: number) => {
      if (!onSwipeEnd) return;

      const distanceFromEdge =
        direction === 'next'
          ? itemCount - index - 1 // Distance to end
          : index; // Distance to start

      // Determine if we should fetch based on distance from edge
      const shouldFetch = distanceFromEdge <= fetchThreshold;

      onSwipeEnd({
        direction,
        currentIndex: index,
        distanceFromEdge,
        shouldFetch,
      });
    },
    [itemCount, fetchThreshold, onSwipeEnd]
  );

  // Update the current index - this function will be called through runOnJS
  const updateIndex = useCallback(
    (newIndex: number, direction?: SwipeDirection) => {
      setCurrentIndex(newIndex);

      // If direction is provided, check if we need to fetch more data
      if (direction) {
        handleSwipeEnd(direction, newIndex);
      }
    },
    [handleSwipeEnd]
  );

  // Calculate which items should be visible for optimization
  const getVisibleItems = useCallback((): VisibleItem<T>[] => {
    const visibleItems: VisibleItem<T>[] = [];

    // We optimize by only rendering items that could be visible
    const startIdx = Math.max(0, currentIndex - VISIBLE_ITEMS_THRESHOLD);
    const endIdx = Math.min(itemCount - 1, currentIndex + VISIBLE_ITEMS_THRESHOLD);

    for (let i = startIdx; i <= endIdx; i++) {
      visibleItems.push({
        index: i,
        item: items[i],
      });
    }

    return visibleItems;
  }, [currentIndex, items, itemCount]);

  // Get currently visible items
  const visibleItems = useMemo(() => getVisibleItems(), [getVisibleItems]);

  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      // Calculate tentative new position
      const newPosition = -currentIndex * SCREEN_WIDTH + event.translationX;

      // Boundary constraints to prevent scrolling beyond the first or last item
      const minTranslate = -(itemCount - 1) * SCREEN_WIDTH;
      translateX.value = Math.max(minTranslate, Math.min(0, newPosition));
    })
    .onEnd((event) => {
      isGestureActive.value = false;

      const velocityThreshold = Math.abs(event.velocityX) > 500;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      let newIndex = currentIndex;
      let direction: SwipeDirection | undefined;

      if (velocityThreshold || distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          // Move backward but with boundary check
          newIndex = Math.max(0, currentIndex - 1);

          if (currentIndex !== newIndex) {
            direction = 'previous';
          }
        } else {
          // Move forward but with boundary check
          newIndex = Math.min(itemCount - 1, currentIndex + 1);

          if (currentIndex !== newIndex) {
            direction = 'next';
          }
        }
      }

      // Animate to the new position
      translateX.value = withSpring(-newIndex * SCREEN_WIDTH, {
        damping: 100,
        stiffness: 50,
        // mass: 0.5,
        velocity: event.velocityX,
      });

      // We must use runOnJS to update React state from the worklet
      // Pass the direction if we actually moved
      runOnJS(updateIndex)(newIndex, direction);
    });

  // Animated style for smooth transitions
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

      {/* Pagination indicators */}
      <View className="absolute top-10 w-full flex-row items-center justify-center">
        {items.map((_, index) => (
          <View
            key={index}
            className={`mx-1 h-2 w-2 rounded-full ${
              currentIndex === index ? 'scale-110 bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </View>

      {/* Debug panel - only shown if requested */}
      {showDebugPanel && (
        <DebugLog
          log={visibleItems}
          currentIndex={currentIndex}
          totalItems={itemCount}
          prependedItems={prependedItems}
        />
      )}
    </View>
  );
}

export default Swiper;
