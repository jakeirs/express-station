import React, { useState, useCallback, useMemo, useRef } from 'react';
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
  itemCount: number;
}

// Debug component
function DebugLog({ currentIndex, itemCount }: DebugLogProps) {
  return (
    <View className="absolute bottom-0 left-0 right-0 h-20 bg-black/80 p-2">
      <Text className="text-xs text-white">Current Index: {currentIndex}</Text>
      <Text className="text-xs text-white">Total Items: {itemCount}</Text>
      <Text className="text-xs text-white">Distance to Start: {currentIndex}</Text>
      <Text className="text-xs text-white">Distance to End: {itemCount - currentIndex - 1}</Text>
    </View>
  );
}

// Simple and stable swiper that handles prepended items
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

  // Keep track of the current index
  const [currentIndex, setCurrentIndex] = useState(Math.min(initialIndex, initialItems.length - 1));

  // Animation value for position
  const translateX = useSharedValue(-currentIndex * SCREEN_WIDTH);

  // Reference to previous props for comparison
  const prevItemsRef = useRef(initialItems);
  const prevItemsFirstIdRef = useRef(initialItems.length > 0 ? initialItems[0].id : null);

  // Handle updates to items - this is crucial for prepended items
  const updateItems = useCallback(() => {
    // Skip if no change in reference
    if (initialItems === prevItemsRef.current) {
      return;
    }

    // Handle the case when new items are prepended
    if (prevItemsFirstIdRef.current !== null && initialItems.length > prevItemsRef.current.length) {
      // Find where the first item of the previous array is in the new array
      let prependedCount = 0;
      for (let i = 0; i < initialItems.length; i++) {
        if (initialItems[i].id === prevItemsFirstIdRef.current) {
          prependedCount = i;
          break;
        }
      }

      // If items were prepended, adjust the current index
      if (prependedCount > 0) {
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
  }, [initialItems, currentIndex, translateX]);

  // Apply updates when items change
  useMemo(() => {
    updateItems();
  }, [updateItems]);

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
      });
    }

    return result;
  }, [items, currentIndex]);

  // Handle updating index and checking for fetch
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

  // Basic pan gesture for swiping
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Simple translation based on drag
      translateX.value = -currentIndex * SCREEN_WIDTH + event.translationX;
    })
    .onEnd((event) => {
      // Determine if we should change slides
      const velocityThreshold = Math.abs(event.velocityX) > 500;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      let newIndex = currentIndex;
      let direction = undefined;

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
        damping: 20,
        stiffness: 100,
        mass: 0.5,
        velocity: event.velocityX,
      });

      // Update the index if changed
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
      {showDebugPanel && <DebugLog currentIndex={currentIndex} itemCount={items.length} />}
    </View>
  );
}

export default Swiper;
