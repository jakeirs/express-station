import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  absoluteIndex: number;
  relativeIndex: number;
  item: T;
}

// Debug component props
interface DebugLogProps<T extends ItemData> {
  log: VisibleItem<T>[];
  absoluteIndex: number;
  relativeIndex: number;
  totalItems: number;
  offset: number;
  gestureActive: boolean;
}

// Debug component to visualize what's happening
function DebugLog<T extends ItemData>({
  log,
  absoluteIndex,
  relativeIndex,
  totalItems,
  offset,
  gestureActive,
}: DebugLogProps<T>) {
  const visibleAbsoluteIndices = log.map((item) => item.absoluteIndex);
  const visibleRelativeIndices = log.map((item) => item.relativeIndex);

  return (
    <ScrollView
      className="absolute bottom-0 left-0 right-0 h-32 bg-black/80"
      contentContainerClassName="p-2">
      <Text className="mb-1 text-xs text-white">Absolute Indices:</Text>
      <View className="mb-2 flex flex-row">
        {visibleAbsoluteIndices.map((entry, index) => (
          <Text key={index} className="mr-1 text-xs text-green-400">
            {entry}{' '}
          </Text>
        ))}
      </View>

      <Text className="mb-1 text-xs text-white">Relative Indices:</Text>
      <View className="mb-2 flex flex-row">
        {visibleRelativeIndices.map((entry, index) => (
          <Text key={index} className="mr-1 text-xs text-blue-400">
            {entry}{' '}
          </Text>
        ))}
      </View>

      <Text className="text-xs text-red-400">Current Absolute Index: {absoluteIndex}</Text>
      <Text className="text-xs text-purple-400">Current Relative Index: {relativeIndex}</Text>
      <Text className="text-xs text-orange-400">Offset: {offset}</Text>
      <Text className="text-xs text-blue-400">Total Items: {totalItems}</Text>
      <Text className="text-xs text-yellow-400">
        Gesture Active: {gestureActive ? 'Yes' : 'No'}
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
  // Initialize state with the provided items
  const [items, setItems] = useState<T[]>(initialItems);

  // The offset is the difference between absolute and relative indices
  // It increases when items are prepended to the array
  const [offset, setOffset] = useState(0);

  // Track whether gesture is active (for UI purposes)
  const [isGestureActiveState, setIsGestureActiveState] = useState(false);

  // Keep track of the previous items array for comparison
  const prevItemsRef = useRef<T[]>(initialItems);
  const firstItemIdRef = useRef<string | number | null>(
    initialItems.length > 0 ? initialItems[0].id : null
  );

  // This is the stable "absolute" index that doesn't change when items are prepended
  const absoluteIndex = useSharedValue(initialIndex);

  // This is the array-based "relative" index that changes when items are prepended
  const [relativeIndex, setRelativeIndex] = useState(initialIndex);

  // Animation values
  const translateX = useSharedValue(-absoluteIndex.value * SCREEN_WIDTH);
  const isGestureActive = useSharedValue(false);

  // This function updates the relative index based on the absolute index and offset
  const updateRelativeIndex = useCallback(() => {
    const newRelativeIndex = Math.min(Math.max(0, absoluteIndex.value - offset), items.length - 1);
    setRelativeIndex(newRelativeIndex);
  }, [absoluteIndex.value, offset, items.length]);

  // Monitor changes to the absolute index
  useAnimatedReaction(
    () => absoluteIndex.value,
    (current, previous) => {
      if (current !== previous && previous !== null) {
        runOnJS(updateRelativeIndex)();
      }
    }
  );

  // This effect handles changes to the initialItems prop
  useEffect(() => {
    // Skip if the array reference hasn't changed
    if (initialItems === prevItemsRef.current) {
      return;
    }

    // If there are no current items, just update
    if (prevItemsRef.current.length === 0) {
      setItems(initialItems);
      prevItemsRef.current = initialItems;
      firstItemIdRef.current = initialItems.length > 0 ? initialItems[0].id : null;
      return;
    }

    const newItems = initialItems;
    const prevItems = prevItemsRef.current;

    // If new items are fewer than old (shouldn't happen normally), just update
    if (newItems.length <= prevItems.length) {
      setItems(newItems);
      prevItemsRef.current = newItems;
      firstItemIdRef.current = newItems.length > 0 ? newItems[0].id : null;
      return;
    }

    // Check if items were prepended by finding the first old item in the new array
    const firstPrevItemId = firstItemIdRef.current;

    if (firstPrevItemId !== null) {
      let firstPrevItemNewIndex = -1;

      for (let i = 0; i < newItems.length; i++) {
        if (newItems[i].id === firstPrevItemId) {
          firstPrevItemNewIndex = i;
          break;
        }
      }

      // If the first item was found at a positive index, items were prepended
      if (firstPrevItemNewIndex > 0) {
        const additionalOffset = firstPrevItemNewIndex;
        const newOffset = offset + additionalOffset;

        // Update the offset
        setOffset(newOffset);

        // No need to adjust translateX or absoluteIndex - they stay stable
        // This is the key to preventing visual jumps
      }
    }

    // Update items and references
    setItems(newItems);
    prevItemsRef.current = newItems;
    firstItemIdRef.current = newItems.length > 0 ? newItems[0].id : null;

    // After updating, make sure the relative index is correctly set
    updateRelativeIndex();
  }, [initialItems, offset, updateRelativeIndex]);

  // Calculate which items should be visible
  const getVisibleItems = useCallback((): VisibleItem<T>[] => {
    const visibleItems: VisibleItem<T>[] = [];

    // Calculate the relative index based on absolute index and offset
    const currentRelativeIndex = Math.min(
      Math.max(0, absoluteIndex.value - offset),
      items.length - 1
    );

    // Calculate the visible range in relative indices
    const startRelativeIdx = Math.max(0, currentRelativeIndex - VISIBLE_ITEMS_THRESHOLD);
    const endRelativeIdx = Math.min(
      items.length - 1,
      currentRelativeIndex + VISIBLE_ITEMS_THRESHOLD
    );

    // Create visible items array with both indices
    for (let relIdx = startRelativeIdx; relIdx <= endRelativeIdx; relIdx++) {
      const absIdx = relIdx + offset;

      visibleItems.push({
        absoluteIndex: absIdx,
        relativeIndex: relIdx,
        item: items[relIdx],
      });
    }

    return visibleItems;
  }, [items, offset, absoluteIndex.value]);

  // Get currently visible items
  const visibleItems = useMemo(() => getVisibleItems(), [getVisibleItems]);

  // Check if we need to fetch more items
  const checkFetchNeeded = useCallback(
    (direction: SwipeDirection) => {
      if (!onSwipeEnd) return;

      // Calculate relative index from absolute index
      const relIdx = Math.min(Math.max(0, absoluteIndex.value - offset), items.length - 1);

      // Calculate distance from the relevant edge based on direction
      const distanceFromEdge =
        direction === 'next'
          ? items.length - relIdx - 1 // Distance to end
          : relIdx; // Distance to start

      // Determine if we should fetch
      const shouldFetch = distanceFromEdge <= fetchThreshold;

      // Call the callback
      onSwipeEnd({
        direction,
        currentIndex: relIdx,
        distanceFromEdge,
        shouldFetch,
      });
    },
    [items.length, offset, absoluteIndex.value, fetchThreshold, onSwipeEnd]
  );

  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isGestureActive.value = true;
      runOnJS(setIsGestureActiveState)(true);
    })
    .onUpdate((event) => {
      // Calculate new position based on the absolute index
      const newPosition = -absoluteIndex.value * SCREEN_WIDTH + event.translationX;

      // Calculate relative index bounds
      const minRelativeIndex = 0;
      const maxRelativeIndex = items.length - 1;

      // Convert to absolute bounds for positioning
      const minTranslate = -(offset + minRelativeIndex) * SCREEN_WIDTH;
      const maxTranslate = -(offset + maxRelativeIndex) * SCREEN_WIDTH;

      // Apply constraints to prevent scrolling beyond boundaries
      translateX.value = Math.min(minTranslate, Math.max(maxTranslate, newPosition));
    })
    .onEnd((event) => {
      // Determine if we should move to a new index
      const velocityThreshold = Math.abs(event.velocityX) > 500;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      let newAbsoluteIndex = absoluteIndex.value;
      let direction: SwipeDirection | undefined;

      if (velocityThreshold || distanceThreshold) {
        // Calculate the current relative index
        const currentRelativeIndex = Math.min(
          Math.max(0, absoluteIndex.value - offset),
          items.length - 1
        );

        if (event.velocityX > 0 || event.translationX > 0) {
          // Moving backward (right swipe)
          if (currentRelativeIndex > 0) {
            const newRelativeIndex = currentRelativeIndex - 1;
            newAbsoluteIndex = offset + newRelativeIndex;
            direction = 'previous';
          }
        } else {
          // Moving forward (left swipe)
          if (currentRelativeIndex < items.length - 1) {
            const newRelativeIndex = currentRelativeIndex + 1;
            newAbsoluteIndex = offset + newRelativeIndex;
            direction = 'next';
          }
        }
      }

      // Animate to the new position
      translateX.value = withSpring(-newAbsoluteIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 100,
        mass: 0.5,
        velocity: event.velocityX,
      });

      // Update absolute index if it changed
      if (newAbsoluteIndex !== absoluteIndex.value) {
        absoluteIndex.value = newAbsoluteIndex;

        // Check if we need to fetch more data
        if (direction) {
          runOnJS(checkFetchNeeded)(direction);
        }
      }

      // Mark gesture as inactive
      isGestureActive.value = false;
      runOnJS(setIsGestureActiveState)(false);
    })
    .onFinalize(() => {
      // Ensure gesture state is properly cleaned up
      isGestureActive.value = false;
      runOnJS(setIsGestureActiveState)(false);
    });

  // Animated style for transitions
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View className="flex-1 flex-row" style={animatedStyle}>
          {visibleItems.map(({ absoluteIndex: absIdx, relativeIndex: relIdx, item }) => (
            <View
              key={item.id ?? absIdx}
              className="w-screen items-center justify-center"
              style={{
                width: SCREEN_WIDTH,
                position: 'absolute',
                left: absIdx * SCREEN_WIDTH,
              }}>
              <View className="h-full w-full">{renderItem({ item, index: relIdx })}</View>
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
                relativeIndex === index ? 'scale-110 bg-white' : 'bg-white/50'
              }`}
            />
          ))}
      </View>

      {/* Debug panel */}
      {showDebugPanel && (
        <DebugLog
          log={visibleItems}
          absoluteIndex={absoluteIndex.value}
          relativeIndex={relativeIndex}
          totalItems={items.length}
          offset={offset}
          gestureActive={isGestureActiveState}
        />
      )}
    </View>
  );
}

export default Swiper;
