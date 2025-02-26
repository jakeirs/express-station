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
      <Text className="text-xs text-white">translateX: {translateX}</Text>
      <Text className="text-xs text-white">
        visible Items: {visibleItemsLength}
      </Text>
      <Text className="text-xs text-white">itemsLength: {itemsLength}</Text>
      <Text className="text-xs text-white">Total Items: {itemCount}</Text>
      <Text className="text-xs text-white">Is Updating: {isUpdating ? 'Yes' : 'No'}</Text>
      <Text className="text-xs text-white">Distance to Start: {currentIndex}</Text>
      <Text className="text-xs text-white">Distance to End: {itemCount - currentIndex - 1}</Text>
    </ScrollView>
  );
}

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

  // Use a shared value for current index to ensure UI thread synchronization
  const currentIndexShared = useSharedValue(Math.min(initialIndex, initialItems.length - 1));
  
  // Also maintain React state version for components that need it
  const [currentIndex, setCurrentIndex] = useState(Math.min(initialIndex, initialItems.length - 1));

  // Flag to track if we're updating items - using shared value for UI thread access
  const isUpdating = useSharedValue(false);
  const isPrepending = useSharedValue(false);

  // Animation value for position
  const translateX = useSharedValue(-currentIndexShared.value * SCREEN_WIDTH);

  // Reference to previous props for comparison
  const prevItemsRef = useRef(initialItems);
  const prevItemsFirstIdRef = useRef(initialItems.length > 0 ? initialItems[0].id : null);

  // Sync shared value to React state
  useEffect(() => {
    setCurrentIndex(currentIndexShared.value);
  }, [currentIndexShared.value]);

  // Function to synchronize isUpdating
  const setUpdating = useCallback(
    (value: boolean) => {
      isUpdating.value = value;
    },
    [isUpdating]
  );

  // Handle updates to items - this is crucial for prepended items
  const updateItems = useCallback(() => {
    // Skip if no change in reference
    if (initialItems === prevItemsRef.current) {
      return;
    }

    // Set updating flag to disable gestures
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
        // Update shared value directly - this happens on UI thread
        const newIndex = currentIndexShared.value + prependedCount;
        currentIndexShared.value = newIndex;
        
        // Also update React state
        setCurrentIndex(newIndex);

        // Directly update animation value to prevent visual jump
        translateX.value = -newIndex * SCREEN_WIDTH;
      }
    }

    // Update state and refs
    setItems(initialItems);
    prevItemsRef.current = initialItems;
    prevItemsFirstIdRef.current = initialItems.length > 0 ? initialItems[0].id : null;

    // Clear updating flags after a short delay
    setTimeout(() => {
      isPrepending.value = false;
      setUpdating(false);
    }, 100);
  }, [initialItems, currentIndexShared, translateX, setUpdating]);

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

  // Check if we need to fetch more data
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
    .enabled(!isUpdating.value && !isPrepending.value)
    .onUpdate((event) => {
      // Skip if updating
      if (isUpdating.value || isPrepending.value) return;

      // Simple translation based on drag
      translateX.value = -currentIndexShared.value * SCREEN_WIDTH + event.translationX;
    })
    .onEnd((event) => {
      // Skip if updating
      if (isUpdating.value || isPrepending.value) return;

      // Determine if we should change slides
      const velocityThreshold = Math.abs(event.velocityX) > 500;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      let newIndex = currentIndexShared.value;
      let direction = undefined;

      if (velocityThreshold || distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          // Going backward (right swipe)
          if (currentIndexShared.value > 0) {
            newIndex = currentIndexShared.value - 1;
            direction = 'previous';
          }
        } else {
          // Going forward (left swipe)
          if (currentIndexShared.value < items.length - 1) {
            newIndex = currentIndexShared.value + 1;
            direction = 'next';
          }
        }
      }

      // Animate to the final position
      translateX.value = withSpring(-newIndex * SCREEN_WIDTH, {
        damping: 40,
        stiffness: 50,
        mass: 0.2,
        velocity: event.velocityX,
        overshootClamping: true,
      });

      // Update shared index first (UI thread)
      if (newIndex !== currentIndexShared.value) {
        currentIndexShared.value = newIndex;
        
        // Then notify JS thread for fetch checks and state updates
        if (direction) {
          runOnJS(checkFetchNeeded)(direction, newIndex);
        }
        
        // Update React state
        runOnJS(setCurrentIndex)(newIndex);
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
    </View>
  );
}

export default Swiper;