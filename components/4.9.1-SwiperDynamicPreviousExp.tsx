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
const VISIBLE_ITEMS_THRESHOLD = 1;
const FETCH_THRESHOLD = 6; // How many items from the edge to trigger fetch

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
  gestureActive: boolean;
}

// Debug component to visualize what's happening
function DebugLog<T extends ItemData>({
  log,
  currentIndex,
  totalItems,
  prependedItems,
  gestureActive,
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
        Gesture Active: {gestureActive ? 'Yes' : 'No'}
      </Text>
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
  // Track how many items have been prepended
  const [prependedItems, setPrependedItems] = useState(0);

  // Use state for items to properly handle updates
  const [items, setItems] = useState<T[]>(initialItems);

  // Track the previous items for comparison
  const prevItemsRef = useRef<T[]>(initialItems);

  // We'll use this to track if the gesture is active for UI
  const [isGestureActiveState, setIsGestureActiveState] = useState(false);

  const itemCount = items.length;

  // State management for the current index
  const [currentIndex, setCurrentIndex] = useState<number>(
    initialIndex >= 0 && initialIndex < itemCount ? initialIndex : 0
  );

  // Animation and gesture state using shared values for performance
  const translateX = useSharedValue<number>(-currentIndex * SCREEN_WIDTH);
  const isGestureActive = useSharedValue<boolean>(false);
  const isUpdatingItems = useSharedValue<boolean>(false);
  const targetIndex = useSharedValue<number>(currentIndex);

  // This will update the React state from the worklet environment
  const syncCurrentIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Use animated reaction to handle changes to targetIndex
  useAnimatedReaction(
    () => targetIndex.value,
    (current, previous) => {
      if (current !== previous && previous !== null) {
        runOnJS(syncCurrentIndex)(current);
      }
    }
  );

  // Update items when initialItems changes, with special handling for prepended items
  React.useEffect(() => {
    // Skip if identical or during active gesture
    if (initialItems === prevItemsRef.current || isGestureActive.value) {
      return;
    }

    // Mark that we're updating items
    isUpdatingItems.value = true;

    const prevItems = prevItemsRef.current;
    const newItems = initialItems;

    // Check if items were prepended by comparing first item of previous array
    if (prevItems.length > 0 && newItems.length > prevItems.length) {
      // Find the first item from the old array in the new array
      const firstPrevItem = prevItems[0];
      let foundIndex = -1;

      for (let i = 0; i < newItems.length; i++) {
        if (newItems[i].id === firstPrevItem.id) {
          foundIndex = i;
          break;
        }
      }

      // If found at a position other than 0, items were prepended
      if (foundIndex > 0) {
        const newPrependCount = foundIndex;
        setPrependedItems((prev) => prev + newPrependCount);

        // Update the current index and directly set translateX
        const newIndex = currentIndex + newPrependCount;
        setCurrentIndex(newIndex);
        targetIndex.value = newIndex;
        translateX.value = -newIndex * SCREEN_WIDTH;
      }
    }

    // Update items and reference
    setItems(newItems);
    prevItemsRef.current = newItems;

    // Clear the updating flag after a short delay to allow rendering
    setTimeout(() => {
      isUpdatingItems.value = false;
    }, 50);
  }, [initialItems, currentIndex]);

  // Handle swipe end and check if we should fetch more data
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

  // Update the current index and check if we need to fetch more data
  const updateIndex = useCallback(
    (newIndex: number, direction?: SwipeDirection) => {
      targetIndex.value = newIndex;

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

    // Only render items that could be visible
    const startIdx = Math.max(0, currentIndex - VISIBLE_ITEMS_THRESHOLD);
    const endIdx = Math.min(itemCount - 1, currentIndex + VISIBLE_ITEMS_THRESHOLD);

    for (let i = startIdx; i <= endIdx; i++) {
      if (items[i]) {
        // Safety check for index bounds
        visibleItems.push({
          index: i,
          item: items[i],
        });
      }
    }

    return visibleItems;
  }, [currentIndex, items, itemCount]);

  // Get currently visible items
  const visibleItems = useMemo(() => getVisibleItems(), [getVisibleItems]);

  // Pan gesture handler with improved handling of active gestures
  const panGesture = Gesture.Pan()
    .enabled(!isUpdatingItems.value) // Disable during item updates
    .onStart(() => {
      isGestureActive.value = true;
      runOnJS(setIsGestureActiveState)(true);
    })
    .onUpdate((event) => {
      if (isUpdatingItems.value) {
        return; // Skip updates if items are being updated
      }

      // Calculate tentative new position
      const newPosition = -targetIndex.value * SCREEN_WIDTH + event.translationX;

      // Boundary constraints
      const minTranslate = -(itemCount - 1) * SCREEN_WIDTH;
      translateX.value = Math.max(minTranslate, Math.min(0, newPosition));
    })
    .onEnd((event) => {
      if (isUpdatingItems.value) {
        isGestureActive.value = false;
        runOnJS(setIsGestureActiveState)(false);
        return; // Skip if items are being updated
      }

      const velocityThreshold = Math.abs(event.velocityX) > 500;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      let newIndex = targetIndex.value;
      let direction: SwipeDirection | undefined;

      if (velocityThreshold || distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          // Move backward with boundary check
          newIndex = Math.max(0, targetIndex.value - 1);

          if (targetIndex.value !== newIndex) {
            direction = 'previous';
          }
        } else {
          // Move forward with boundary check
          newIndex = Math.min(itemCount - 1, targetIndex.value + 1);

          if (targetIndex.value !== newIndex) {
            direction = 'next';
          }
        }
      }

      // Animate to new position with natural spring physics
      translateX.value = withSpring(-newIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 100,
        mass: 0.5,
        velocity: event.velocityX,
        restSpeedThreshold: 0.5,
      });

      // Mark gesture as inactive
      isGestureActive.value = false;
      runOnJS(setIsGestureActiveState)(false);

      // Only update the index if it changed
      if (newIndex !== targetIndex.value) {
        runOnJS(updateIndex)(newIndex, direction);
      }
    })
    .onFinalize(() => {
      // Ensure gesture is marked as inactive even if something interrupts it
      isGestureActive.value = false;
      runOnJS(setIsGestureActiveState)(false);
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
        {items.length > 0 &&
          items.map((_, index) => (
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
          gestureActive={isGestureActiveState}
        />
      )}
    </View>
  );
}

export default Swiper;
