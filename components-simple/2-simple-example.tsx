import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Dimensions, ScrollView, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Define our screen dimensions and thresholds
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VISIBLE_ITEMS_THRESHOLD = 2; // Number of items to render on each side of current item
const FETCH_THRESHOLD = 4; // Default threshold for when to fetch more items

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
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
  disableGestures?: boolean;
  resetTimeoutMs?: number; // Timeout for automatic reset
}

// Debug component props
interface DebugLogProps {
  currentIndex: number;
  itemCount: number;
  translateX: number;
  itemsLength: number;
  isUpdating: boolean;
  visibleItemsLength: number;
}

// Debug component
function DebugLog({
  currentIndex,
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
      <Text className="text-xs text-white">Current Index: {currentIndex}</Text>
      <Text className="text-xs text-white">translateX: {Math.round(translateX)}</Text>
      <Text className="text-xs text-white">Visible Items: {visibleItemsLength}</Text>
      <Text className="text-xs text-white">Total Items: {itemsLength}</Text>
      <Text className="text-xs text-white">Is Updating: {isUpdating ? 'Yes' : 'No'}</Text>
      <Text className="text-xs text-white">Distance to Start: {currentIndex}</Text>
      <Text className="text-xs text-white">Distance to End: {itemCount - currentIndex - 1}</Text>
    </ScrollView>
  );
}

/**
 * A high-performance swiper component that efficiently handles prepended items.
 * Designed for large datasets with dynamic loading, where items can be added to both
 * ends of the array without visual jumps or performance issues.
 */
function SwiperMan<T extends ItemData>({
  initialItems,
  renderItem,
  initialIndex = 0,
  onSwipeEnd,
  fetchThreshold = FETCH_THRESHOLD,
  showDebugPanel = false,
  springConfig = {
    damping: 20,
    stiffness: 200,
    mass: 0.5,
  },
  disableGestures = false,
  resetTimeoutMs = 2000, // Default 2 second timeout
}: SwiperProps<T>) {
  // Store current set of items
  const [items, setItems] = useState(initialItems);

  // Keep track of the current index
  const [currentIndex, setCurrentIndex] = useState(Math.min(initialIndex, initialItems.length - 1));

  // Flag to track if we're currently updating items - using shared value
  // This ensures it's immediately available on both JS and UI threads
  const isUpdating = useSharedValue(false);

  // Animation value for position
  const translateX = useSharedValue(-currentIndex * SCREEN_WIDTH);

  // Reference to previous props for comparison
  const prevItemsRef = useRef(initialItems);
  const prevItemsFirstIdRef = useRef(initialItems.length > 0 ? initialItems[0].id : null);

  // Track if gesture is active
  const isGestureActive = useSharedValue(false);

  // Function to synchronize isUpdating between threads
  const setUpdating = useCallback(
    (value: boolean) => {
      isUpdating.value = value;
    },
    [isUpdating]
  );

  // Update items when initialItems change
  useEffect(() => {
    // Skip if no change in reference
    if (initialItems === prevItemsRef.current) {
      return;
    }

    console.log(
      `SwiperMan: Items changed from ${prevItemsRef.current.length} to ${initialItems.length}`
    );
    updateItems();

    // Safety timeout - force reset isUpdating after a maximum duration
    // This prevents the swiper from getting permanently locked if something goes wrong
    const safetyTimer = setTimeout(() => {
      if (isUpdating.value) {
        console.warn('SwiperMan: Force-resetting isUpdating after timeout');
        // Call the full reset instead of just setting isUpdating
        resetSwiper();
      }
    }, resetTimeoutMs);

    return () => clearTimeout(safetyTimer);
  }, [initialItems, resetTimeoutMs]);

  // Handle updates to items - this is crucial for prepended items
  const updateItems = useCallback(() => {
    try {
      // Set updating flag to disable gestures - immediately available on UI thread
      setUpdating(true);

      // Log the update operation for debugging
      console.log(
        `SwiperMan: Updating items array from ${prevItemsRef.current.length} to ${initialItems.length} items`
      );

      // Handle the case when new items are prepended
      if (
        prevItemsFirstIdRef.current !== null &&
        initialItems.length > prevItemsRef.current.length
      ) {
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
          console.log(
            `SwiperMan: Detected ${prependedCount} prepended items, adjusting index from ${currentIndex} to ${currentIndex + prependedCount}`
          );
          const newIndex = currentIndex + prependedCount;
          setCurrentIndex(newIndex);

          // Directly update animation value to prevent visual jump
          translateX.value = -newIndex * SCREEN_WIDTH;
        }
      }

      // Update state and refs
      setItems(initialItems);
      prevItemsRef.current = initialItems;
      prevItemsFirstIdRef.current = initialItems.length > 0 ? initialItems[0].id : null;

      // Use a more reliable approach to reset the updating state
      // First, schedule a microtask to run after the current execution completes
      Promise.resolve().then(() => {
        // Then use requestAnimationFrame to wait until after the next frame renders
        requestAnimationFrame(() => {
          // Double-check we're still updating before resetting
          if (isUpdating.value) {
            setUpdating(false);
            console.log('SwiperMan: Update complete, gestures re-enabled');
          }
        });
      });

      // Also set a firm timeout as a fallback
      setTimeout(() => {
        if (isUpdating.value) {
          setUpdating(false);
          console.log('SwiperMan: Update complete via timeout fallback');
        }
      }, 500);
    } catch (error) {
      // Error handling to prevent swiper from getting permanently locked
      console.error('SwiperMan: Error during update:', error);
      setUpdating(false);
    }
  }, [initialItems, currentIndex, translateX, setUpdating, isUpdating]);

  // Get visible items for efficient rendering - only render what's needed
  const visibleItems = useMemo(() => {
    if (items.length === 0) return [];

    const startIdx = Math.max(0, currentIndex - VISIBLE_ITEMS_THRESHOLD);
    const endIdx = Math.min(items.length - 1, currentIndex + VISIBLE_ITEMS_THRESHOLD);

    const result = [];
    for (let i = startIdx; i <= endIdx; i++) {
      result.push({
        index: i,
        item: items[i],
      });
    }

    return result;
  }, [items, currentIndex]);

  // Handle updating index and checking for fetch
  const handleIndexChange = useCallback(
    (newIndex: number, direction?: SwipeDirection) => {
      // Don't update if currently updating items
      if (isUpdating.value) return;

      setCurrentIndex(newIndex);

      if (direction && onSwipeEnd) {
        const distanceFromEdge = direction === 'next' ? items.length - newIndex - 1 : newIndex;

        const shouldFetch = distanceFromEdge <= fetchThreshold;

        onSwipeEnd({
          direction,
          currentIndex: newIndex,
          distanceFromEdge,
          shouldFetch,
        });
      }
    },
    [items.length, onSwipeEnd, fetchThreshold, isUpdating]
  );

  // Go to a specific index programmatically
  const goToIndex = useCallback(
    (index: number, animated = true) => {
      if (index < 0 || index >= items.length) return;

      // If updating, attempt to unlock first
      if (isUpdating.value) {
        resetSwiper();
      }

      const targetPosition = -index * SCREEN_WIDTH;

      if (animated) {
        translateX.value = withSpring(targetPosition, {
          damping: springConfig.damping || 20,
          stiffness: springConfig.stiffness || 100,
          mass: springConfig.mass || 0.5,
        });
      } else {
        translateX.value = targetPosition;
      }

      setCurrentIndex(index);
    },
    [items.length, translateX, springConfig, isUpdating, resetSwiper]
  );

  // Expose methods to parent via imperative handle if needed
  React.useImperativeHandle(
    React.forwardRef((props, ref) => ref),
    () => ({
      goToIndex,
      resetSwiper,
      getCurrentIndex: () => currentIndex,
    }),
    [goToIndex, resetSwiper, currentIndex]
  );

  // Reset function to recover from a stuck state - more aggressive version
  const resetSwiper = useCallback(() => {
    console.log('SwiperMan: Manual reset triggered');

    // Force reset all state variables
    setUpdating(false);
    isUpdating.value = false;
    isGestureActive.value = false;

    // Force animation to correct position
    translateX.value = -currentIndex * SCREEN_WIDTH;

    // Re-render with updated items
    setItems([...items]);

    console.log('SwiperMan: Reset complete');
  }, [currentIndex, items, setUpdating, isUpdating, translateX]);

  // We'll use a regular button instead of gesture detection, as it's more reliable

  // Pan gesture for swiping - disabled during updates
  const panGesture = Gesture.Pan()
    .enabled(!disableGestures && !isUpdating.value) // Disable during updates or when explicitly disabled
    .onBegin(() => {
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      // Skip if updating - this check happens directly on the UI thread
      if (isUpdating.value) return;

      // Calculate new position with bounds to prevent overscrolling too much
      const minBound = -items.length * SCREEN_WIDTH + SCREEN_WIDTH;
      const maxBound = 0;

      let newX = -currentIndex * SCREEN_WIDTH + event.translationX;

      // Add resistance when dragging beyond edges
      if (newX > maxBound) {
        // Dragging past the first item
        newX = maxBound + (newX - maxBound) * 0.2; // Add resistance
      } else if (newX < minBound) {
        // Dragging past the last item
        newX = minBound + (newX - minBound) * 0.2; // Add resistance
      }

      translateX.value = newX;
    })
    .onEnd((event) => {
      // Skip if updating - this check happens directly on the UI thread
      if (isUpdating.value) return;

      isGestureActive.value = false;

      // Determine if we should change slides based on velocity and distance
      const velocityThreshold = Math.abs(event.velocityX) > 500;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      let newIndex = currentIndex;
      let direction: SwipeDirection | undefined = undefined;

      if (velocityThreshold || distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          // Going backward (right swipe)
          if (currentIndex > 0) {
            newIndex = currentIndex - 1;
            direction = 'previous';
          }
        } else {
          // Going forward (left swipe)
          if (currentIndex < items.length - 1) {
            newIndex = currentIndex + 1;
            direction = 'next';
          }
        }
      }

      // Animate to the final position
      translateX.value = withSpring(-newIndex * SCREEN_WIDTH, {
        damping: springConfig.damping || 20,
        stiffness: springConfig.stiffness || 100,
        mass: springConfig.mass || 0.5,
        velocity: event.velocityX,
      });

      // Update the index if changed - must use runOnJS to call back to JS thread
      if (newIndex !== currentIndex) {
        runOnJS(handleIndexChange)(newIndex, direction);
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
              key={`${item.id ?? index}`}
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
        {items.length <= 20 ? ( // Only show dots if there are a reasonable number
          items.map((_, index) => (
            <View
              key={index}
              className={`mx-1 h-2 w-2 rounded-full ${
                currentIndex === index ? 'scale-110 bg-white' : 'bg-white/50'
              }`}
            />
          ))
        ) : (
          // Simple indicator for large datasets
          <View className="rounded-full bg-black/40 px-3 py-1">
            <Text className="text-xs text-white">
              {currentIndex + 1} / {items.length}
            </Text>
          </View>
        )}
      </View>

      {/* Debug panel */}
      {showDebugPanel && (
        <DebugLog
          currentIndex={currentIndex}
          itemCount={items.length}
          isUpdating={isUpdating.value}
          visibleItemsLength={visibleItems.length}
          itemsLength={items.length}
          translateX={translateX.value}
        />
      )}

      {/* Unlock button - always visible when updating is true */}
      {isUpdating.value && (
        <TouchableOpacity
          className="absolute bottom-8 left-1/2 z-50 -translate-x-1/2 transform rounded-lg bg-black/70 p-3"
          style={{ elevation: 5 }}
          onPress={resetSwiper}
          activeOpacity={0.7}>
          <Text className="text-base font-medium text-white">Tap here to unlock</Text>
        </TouchableOpacity>
      )}

      {/* Status indicator */}
      {isUpdating.value && (
        <View className="absolute right-4 top-16 h-3 w-3 rounded-full bg-red-500" />
      )}
    </View>
  );
}

export default SwiperMan;
