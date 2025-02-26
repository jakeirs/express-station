import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Dimensions, ScrollView, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Define our screen dimensions and thresholds
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VISIBLE_ITEMS_THRESHOLD = 2;
const FETCH_THRESHOLD = 4;

// Animation configuration with controlled timing
const TIMING_CONFIG = {
  duration: 400,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

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
  itemCount: number;
  translateX: number;
  isLocked: boolean;
  visibleItemsLength: number;
}

// Debug component
function DebugLog({
  currentIndex,
  itemCount,
  translateX,
  isLocked,
  visibleItemsLength,
}: DebugLogProps) {
  return (
    <ScrollView
      className="absolute bottom-0 left-0 right-0 h-32 bg-black/80"
      contentContainerClassName="p-2">
      <Text className="text-xs text-white">Current Index: {currentIndex}</Text>
      <Text className="text-xs text-white">translateX: {Math.round(translateX)}</Text>
      <Text className="text-xs text-white">visible Items: {visibleItemsLength}</Text>
      <Text className="text-xs text-white">Total Items: {itemCount}</Text>
      <Text className="text-xs text-white">Is Locked: {isLocked ? 'Yes' : 'No'}</Text>
      <Text className="text-xs text-white">Distance to Start: {currentIndex}</Text>
      <Text className="text-xs text-white">Distance to End: {itemCount - currentIndex - 1}</Text>
    </ScrollView>
  );
}

// Simple swiper with controlled animation speed
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

  // Single current index state
  const [currentIndex, setCurrentIndex] = useState(Math.min(initialIndex, initialItems.length - 1));

  // Single lock flag to control interactions
  const [isLocked, setIsLocked] = useState(false);

  // Animation value for position
  const translateX = useSharedValue(-currentIndex * SCREEN_WIDTH);

  // Tracking references for past state
  const prevItemsRef = useRef(initialItems);
  const firstItemIdRef = useRef(initialItems.length > 0 ? initialItems[0].id : null);
  const animatingRef = useRef(false);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle updates to items - this is crucial for prepended items
  useEffect(() => {
    if (initialItems === prevItemsRef.current) {
      return;
    }

    // Lock interactions while updating
    setIsLocked(true);

    // Process item changes, particularly prepends
    if (firstItemIdRef.current !== null && initialItems.length > prevItemsRef.current.length) {
      let prependedCount = 0;
      let foundFirstItem = false;

      // Find where the previous first item is in the new array
      for (let i = 0; i < initialItems.length; i++) {
        if (initialItems[i].id === firstItemIdRef.current) {
          prependedCount = i;
          foundFirstItem = true;
          break;
        }
      }

      // If items were prepended, adjust index
      if (foundFirstItem && prependedCount > 0) {
        const newIndex = currentIndex + prependedCount;
        setCurrentIndex(newIndex);
        translateX.value = -newIndex * SCREEN_WIDTH;
      }
    }

    // Update state
    setItems(initialItems);
    prevItemsRef.current = initialItems;
    firstItemIdRef.current = initialItems.length > 0 ? initialItems[0].id : null;

    // Unlock after a short delay
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
    }
    lockTimerRef.current = setTimeout(() => {
      setIsLocked(false);
      lockTimerRef.current = null;
    }, 200);
  }, [initialItems, currentIndex]);

  // Calculate visible items for efficient rendering
  const visibleItems = useMemo(() => {
    if (items.length === 0) return [];

    const startIdx = Math.max(0, currentIndex - VISIBLE_ITEMS_THRESHOLD);
    const endIdx = Math.min(items.length - 1, currentIndex + VISIBLE_ITEMS_THRESHOLD);

    const result = [];
    for (let i = startIdx; i <= endIdx; i++) {
      if (items[i]) {
        result.push({
          index: i,
          item: items[i],
        });
      }
    }

    return result;
  }, [items, currentIndex]);

  // Animate to a new position with timing
  const animateTo = useCallback(
    (position: number, callback?: () => void) => {
      // Set animating flag
      animatingRef.current = true;
      setIsLocked(true);

      // Cancel any existing animations
      cancelAnimation(translateX);

      // Start new animation
      translateX.value = withTiming(position, TIMING_CONFIG, (finished) => {
        if (finished) {
          runOnJS(() => {
            animatingRef.current = false;
            setIsLocked(false);
            if (callback) callback();
          })();
        }
      });
    },
    [translateX]
  );

  // Handle index changes and potential fetch
  const handleIndexChange = useCallback(
    (newIndex: number, direction?: SwipeDirection) => {
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
    [items.length, onSwipeEnd, fetchThreshold]
  );

  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .enabled(!isLocked)
    .onUpdate((event) => {
      // Only allow dragging when not locked
      if (isLocked || animatingRef.current) return;

      // Apply translation with resistance at edges
      let translationX = event.translationX;

      if (
        (currentIndex === 0 && translationX > 0) ||
        (currentIndex === items.length - 1 && translationX < 0)
      ) {
        translationX = translationX / 3;
      }

      translateX.value = -currentIndex * SCREEN_WIDTH + translationX;
    })
    .onEnd((event) => {
      // Skip if locked
      if (isLocked || animatingRef.current) return;

      const velocityThreshold = Math.abs(event.velocityX) > 300;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      let newIndex = currentIndex;
      let direction = undefined;

      if (velocityThreshold || distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          // Going backward
          if (currentIndex > 0) {
            newIndex = currentIndex - 1;
            direction = 'previous';
          }
        } else {
          // Going forward
          if (currentIndex < items.length - 1) {
            newIndex = currentIndex + 1;
            direction = 'next';
          }
        }
      }

      // Animate to new position with fixed duration
      const targetPosition = -newIndex * SCREEN_WIDTH;

      animateTo(targetPosition, () => {
        // Only update state if index changed
        if (newIndex !== currentIndex) {
          handleIndexChange(newIndex, direction);
        }
      });
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
              currentIndex === index ? 'scale-110 bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </View>

      {/* Debug panel */}
      {showDebugPanel && (
        <DebugLog
          currentIndex={currentIndex}
          itemCount={items.length}
          isLocked={isLocked}
          visibleItemsLength={visibleItems.length}
          translateX={translateX.value}
        />
      )}
    </View>
  );
}

export default Swiper;
