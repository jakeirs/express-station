import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  runOnJS,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Screen dimensions and thresholds
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VISIBLE_ITEMS_THRESHOLD = 2;
const DEFAULT_FETCH_THRESHOLD = 4;

// Animation configuration with proper easing
const TIMING_CONFIG = {
  duration: 300, // Animation duration in milliseconds - shorter for better UX
  easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Standard easing curve
};

// Cooldown configuration
const SWIPE_COOLDOWN = 300; // Cooldown period in milliseconds after a swipe

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
  virtualIndex: number;
}) => React.ReactNode;

// Component props
interface VirtualSwiperProps<T extends ItemData> {
  items: T[];
  renderItem: RenderItemFunction<T>;
  initialIndex?: number;
  onLoadMore?: (direction: SwipeDirection, currentIndex: number) => Promise<void>;
  fetchThreshold?: number;
  showPagination?: boolean;
  loop?: boolean;
  debug?: boolean;
}

function VirtualSwiper<T extends ItemData>({
  items,
  renderItem,
  initialIndex = 0,
  onLoadMore,
  fetchThreshold = DEFAULT_FETCH_THRESHOLD,
  showPagination = true,
  loop = false,
  debug = false,
}: VirtualSwiperProps<T>) {
  // Refs to store previous values for comparison
  const prevItemsLengthRef = useRef(items.length);
  const prevItemsRef = useRef(items);
  const loadingRef = useRef(false);
  const isAnimatingRef = useRef(false);

  // Virtual index tracks the user's logical position in a potentially infinite list
  const [virtualIndex, setVirtualIndex] = useState(initialIndex);

  // Current index in the actual array
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(Math.max(0, initialIndex), Math.max(0, items.length - 1))
  );

  // Track loading state to prevent multiple loads
  const [isLoading, setIsLoading] = useState(false);

  // Translation value for animation
  const translateX = useSharedValue(-currentIndex * SCREEN_WIDTH);

  // Flag to prevent interactions during animations/cooldowns
  const isBlocked = useSharedValue(false);

  // Last time a swipe occurred (for cooldown calculation)
  const lastSwipeTime = useSharedValue(0);

  // Derived value for UI updates
  const activeIndex = useDerivedValue(() => -Math.round(translateX.value / SCREEN_WIDTH));

  // Handle load more items
  const handleLoadMore = useCallback(
    async (direction: SwipeDirection) => {
      if (!onLoadMore || loadingRef.current) return;

      // Set loading flag
      loadingRef.current = true;
      setIsLoading(true);

      try {
        await onLoadMore(direction, virtualIndex);
      } catch (error) {
        console.error('Error loading more items:', error);
      } finally {
        // Reset loading flag with a small delay to prevent rapid firing
        setTimeout(() => {
          loadingRef.current = false;
          setIsLoading(false);
        }, 300);
      }
    },
    [onLoadMore, virtualIndex]
  );

  // Check if we need to load more items
  const checkLoadMore = useCallback(
    (newVirtualIndex: number) => {
      if (!onLoadMore || loadingRef.current) return;

      const distanceFromEnd = items.length - 1 - currentIndex;
      const distanceFromStart = currentIndex;

      // Load more if approaching the end
      if (distanceFromEnd <= fetchThreshold) {
        handleLoadMore('next');
      }

      // Load more if approaching the beginning
      if (distanceFromStart <= fetchThreshold) {
        handleLoadMore('previous');
      }
    },
    [currentIndex, items.length, fetchThreshold, onLoadMore, handleLoadMore]
  );

  // Get visible items for efficient rendering
  const visibleItems = useMemo(() => {
    if (items.length === 0) return [];

    const startIdx = Math.max(0, currentIndex - VISIBLE_ITEMS_THRESHOLD);
    const endIdx = Math.min(items.length - 1, currentIndex + VISIBLE_ITEMS_THRESHOLD);

    const result = [];
    for (let i = startIdx; i <= endIdx; i++) {
      result.push({
        index: i,
        item: items[i],
        virtualIndex: virtualIndex + (i - currentIndex), // Calculate virtual index
      });
    }

    return result;
  }, [items, currentIndex, virtualIndex]);

  // Handle updates to items array
  useEffect(() => {
    if (items.length === 0) return;

    // Compare previous and current items
    const prevLength = prevItemsLengthRef.current;
    const newLength = items.length;
    const diff = newLength - prevLength;

    // Skip if no change or if animating
    if (diff === 0 || isAnimatingRef.current) {
      prevItemsRef.current = items;
      prevItemsLengthRef.current = newLength;
      return;
    }

    // Block gestures during update
    isBlocked.value = true;

    // Items added at the beginning
    if (diff > 0 && items[0].id !== prevItemsRef.current[0]?.id) {
      // Adjust current index to maintain the same visual position
      const newCurrentIndex = currentIndex + diff;
      setCurrentIndex(newCurrentIndex);

      // Immediately update translateX to prevent visual jump
      translateX.value = -newCurrentIndex * SCREEN_WIDTH;
    }
    // Items added at the end or elsewhere
    else if (diff !== 0) {
      // Ensure current index is within bounds
      const newCurrentIndex = Math.min(Math.max(0, currentIndex), newLength - 1);
      if (newCurrentIndex !== currentIndex) {
        setCurrentIndex(newCurrentIndex);
        translateX.value = -newCurrentIndex * SCREEN_WIDTH;
      }
    }

    // Update refs with new values
    prevItemsRef.current = items;
    prevItemsLengthRef.current = newLength;

    // Unblock gestures after a short delay to allow rendering
    setTimeout(() => {
      isBlocked.value = false;
    }, 50);
  }, [items, currentIndex, translateX]);

  // Helper function to set isBlocked safely from animation callback
  const setIsBlocked = useCallback(
    (value: boolean) => {
      isBlocked.value = value;
    },
    [isBlocked]
  );

  // Navigate to a specific index
  const navigateTo = useCallback(
    (index: number, animated = true) => {
      if (index < 0 || index >= items.length || isBlocked.value) return;

      isBlocked.value = true;
      isAnimatingRef.current = true;

      const newPosition = -index * SCREEN_WIDTH;

      if (animated) {
        translateX.value = withTiming(newPosition, TIMING_CONFIG, (finished) => {
          if (finished) {
            runOnJS(setCurrentIndex)(index);
            runOnJS(setVirtualIndex)(virtualIndex + (index - currentIndex));
            runOnJS(setIsBlocked)(false);
            runOnJS(checkLoadMore)(virtualIndex + (index - currentIndex));
          }
          runOnJS(() => {
            isAnimatingRef.current = false;
          })();
        });
      } else {
        translateX.value = newPosition;
        setCurrentIndex(index);
        setVirtualIndex(virtualIndex + (index - currentIndex));
        isBlocked.value = false;
        isAnimatingRef.current = false;
        checkLoadMore(virtualIndex + (index - currentIndex));
      }
    },
    [
      items.length,
      isBlocked,
      translateX,
      TIMING_CONFIG,
      currentIndex,
      virtualIndex,
      checkLoadMore,
      setIsBlocked,
    ]
  );

  // Handle swipe completion
  const handleSwipeComplete = useCallback(
    (newIndex: number, direction?: SwipeDirection) => {
      // Skip if out of bounds
      if (newIndex < 0 || newIndex >= items.length) return;

      // Record the time of this swipe for cooldown
      lastSwipeTime.value = Date.now();

      // Calculate new virtual index
      const newVirtualIndex = virtualIndex + (newIndex - currentIndex);

      // Update the indices
      setCurrentIndex(newIndex);
      setVirtualIndex(newVirtualIndex);

      // Check if we need to load more items
      checkLoadMore(newVirtualIndex);

      // Reset the blocking state after cooldown
      setTimeout(() => {
        runOnJS(setIsBlocked)(false);
        isAnimatingRef.current = false;
      }, SWIPE_COOLDOWN);
    },
    [virtualIndex, currentIndex, items.length, checkLoadMore, lastSwipeTime, setIsBlocked]
  );

  // Pan gesture handler with improved cooldown and index management
  const panGesture = Gesture.Pan()
    .enabled(!isBlocked.value && !isLoading) // Disable during animations, cooldowns, or loading
    .onStart(() => {
      // Check if we're still in cooldown period
      const now = Date.now();
      if (now - lastSwipeTime.value < SWIPE_COOLDOWN) {
        return false; // Cancel gesture if in cooldown
      }

      // Cancel any ongoing animations
      cancelAnimation(translateX);
    })
    .onUpdate((event) => {
      // Simple translation based on drag
      const newPosition = -currentIndex * SCREEN_WIDTH + event.translationX;

      // Apply boundaries - prevent excessive dragging
      const minTranslate = -(items.length - 1) * SCREEN_WIDTH;

      // Allow looping if enabled
      if (loop) {
        translateX.value = newPosition;
      } else {
        translateX.value = Math.max(minTranslate, Math.min(0, newPosition));
      }
    })
    .onEnd((event) => {
      // Block further gestures and mark as animating
      isBlocked.value = true;
      isAnimatingRef.current = true;

      // Determine if we should change slides based on velocity or distance
      const velocityThreshold = Math.abs(event.velocityX) > 500;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      let newIndex = currentIndex;

      if (velocityThreshold || distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          // Going backward (right swipe)
          if (currentIndex > 0) {
            newIndex = currentIndex - 1;
          } else if (loop && items.length > 1) {
            newIndex = items.length - 1;
          }
        } else {
          // Going forward (left swipe)
          if (currentIndex < items.length - 1) {
            newIndex = currentIndex + 1;
          } else if (loop && items.length > 1) {
            newIndex = 0;
          }
        }
      }

      // Target position for the new index
      const position = -newIndex * SCREEN_WIDTH;

      // Start animation with proper timing and easing
      translateX.value = withTiming(position, TIMING_CONFIG, (finished) => {
        if (finished) {
          // Only update state if animation completed
          const direction: SwipeDirection = newIndex > currentIndex ? 'next' : 'previous';
          runOnJS(handleSwipeComplete)(newIndex, direction);
        } else {
          // If animation was interrupted, still unblock gestures after delay
          setTimeout(() => {
            runOnJS(setIsBlocked)(false);
            runOnJS(() => {
              isAnimatingRef.current = false;
            })();
          }, SWIPE_COOLDOWN);
        }
      });
    });

  // Animation style for the container
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Public methods exposed via refs (could be expanded)
  // Using imperative handle would be better here in a full implementation

  // Debugging information
  const debugInfo = useMemo(() => {
    if (!debug) return null;

    return (
      <View className="absolute bottom-4 left-4 right-4 rounded bg-black/70 p-2">
        <View className="flex-row justify-between">
          <Text className="text-white">Virtual Index: {virtualIndex}</Text>
          <Text className="text-white">Current Index: {currentIndex}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-white">Items: {items.length}</Text>
          <Text className="text-white">Loading: {isLoading ? 'Yes' : 'No'}</Text>
        </View>
      </View>
    );
  }, [debug, virtualIndex, currentIndex, items.length, isLoading]);

  return (
    <View className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View className="flex-1 flex-row" style={animatedStyle}>
          {visibleItems.map(({ index, item, virtualIndex: itemVirtualIndex }) => (
            <View
              key={`${item.id || index}`}
              className="items-center justify-center"
              style={{
                width: SCREEN_WIDTH,
                position: 'absolute',
                left: index * SCREEN_WIDTH,
              }}>
              <View className="h-full w-full">
                {renderItem({ item, index, virtualIndex: itemVirtualIndex })}
              </View>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {/* Pagination dots */}
      {showPagination && (
        <View className="absolute bottom-10 w-full flex-row items-center justify-center">
          {items.map((_, index) => (
            <View
              key={index}
              className={`mx-1 h-2 w-2 rounded-full ${
                currentIndex === index ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </View>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <View className="absolute right-10 top-10">
          <View className="h-6 w-6 animate-pulse rounded-full bg-white/30" />
        </View>
      )}

      {debugInfo}
    </View>
  );
}

export default VirtualSwiper;
