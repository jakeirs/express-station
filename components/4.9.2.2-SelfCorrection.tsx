import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Dimensions, ScrollView, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useAnimatedReaction,
  configureReanimatedLogger,
  withTiming,
  Easing,
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
  selfCorrections: number;
  fadeOpacity: number;
}

// Debug component
function DebugLog({
  currentIndex,
  itemCount,
  isUpdating,
  visibleItemsLength,
  itemsLength,
  translateX,
  selfCorrections,
  fadeOpacity,
}: DebugLogProps) {
  return (
    <ScrollView
      className="absolute bottom-0 left-0 right-0 h-32 bg-black/80"
      contentContainerClassName="p-2">
      <Text className="text-xs text-white">Current Index: {currentIndex}</Text>
      <Text className="text-xs text-white">translateX: {translateX}</Text>
      <Text className="text-xs text-white">visible Items: {visibleItemsLength}</Text>
      <Text className="text-xs text-white">itemsLength: {itemsLength}</Text>
      <Text className="text-xs text-white">Total Items: {itemCount}</Text>
      <Text className="text-xs text-white">Is Updating: {isUpdating ? 'Yes' : 'No'}</Text>
      <Text className="text-xs text-white">Self Corrections: {selfCorrections}</Text>
      <Text className="text-xs text-white">Fade Opacity: {fadeOpacity}</Text>
      <Text className="text-xs text-white">Distance to Start: {currentIndex}</Text>
      <Text className="text-xs text-white">Distance to End: {itemCount - currentIndex - 1}</Text>
    </ScrollView>
  );
}

// Enhanced swiper with self-correction capabilities
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

  // Keep track of the current index - using both shared value and state for safety
  const currentIndexShared = useSharedValue(Math.min(initialIndex, initialItems.length - 1));
  const [currentIndex, setCurrentIndex] = useState(currentIndexShared.value);

  // Track number of self-corrections for debugging
  const [selfCorrections, setSelfCorrections] = useState(0);

  // Flag to track if we're currently updating items
  const isUpdating = useSharedValue(false);
  const isPrepending = useSharedValue(false);

  // Animation value for position
  const translateX = useSharedValue(-currentIndexShared.value * SCREEN_WIDTH);

  // Animation values for fade-in effect
  const fadeOpacity = useSharedValue(1);

  // Reference to previous props for comparison
  const prevItemsRef = useRef(initialItems);
  const prevItemsFirstIdRef = useRef(initialItems.length > 0 ? initialItems[0].id : null);

  // Timer refs for safety checks
  const safetyCheckTimerRef = useRef<any>(null);
  const prependOperationRef = useRef(false);

  // Keep React state in sync with shared value
  useAnimatedReaction(
    () => currentIndexShared.value,
    (value) => {
      runOnJS(setCurrentIndex)(value);
    }
  );

  // Function to synchronize isUpdating
  const setUpdating = useCallback(
    (value: boolean) => {
      isUpdating.value = value;
    },
    [isUpdating]
  );

  // Emergency self-correction function to recover from blank screen
  const performSelfCorrection = useCallback(() => {
    // Only perform if we have items
    if (items.length === 0) return;

    // Check if current position might be out of bounds
    const expectedPosition = -currentIndex * SCREEN_WIDTH;
    const currentPosition = translateX.value;
    const threshold = SCREEN_WIDTH * 0.2; // Half a screen tolerance

    // If position is significantly off or if visibleItems is empty
    if (Math.abs(currentPosition - expectedPosition) > threshold) {
      console.log('Performing self-correction - position mismatch');

      // Force alignment to nearest valid index
      const nearestIndex = Math.round(-currentPosition / SCREEN_WIDTH);
      const validIndex = Math.max(0, Math.min(items.length - 1, nearestIndex));

      // Update both state and shared values
      currentIndexShared.value = validIndex;
      setCurrentIndex(validIndex);

      // Snap to correct position with minimal animation
      translateX.value = withSpring(-validIndex * SCREEN_WIDTH, {
        damping: 50,
        stiffness: 200,
        mass: 0.5,
        overshootClamping: true,
      });

      isUpdating.value = false;
      // Track corrections
      setSelfCorrections((prev) => prev + 1);
      return true;
    }

    return false;
  }, [items.length, currentIndex, translateX, currentIndexShared]);

  // Handle updates to items - this is crucial for prepended items
  const updateItems = useCallback(() => {
    // Skip if no change in reference
    if (initialItems === prevItemsRef.current) {
      return;
    }

    // Reset fade animation state
    fadeOpacity.value = 1;

    // Set updating flag to disable gestures
    setUpdating(true);
    isPrepending.value = true;
    prependOperationRef.current = true;

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

      // If items were prepended, adjust the current index and set up animation
      if (foundFirstItem && prependedCount > 0) {
        // Start with opacity at 0 for fade-in effect
        fadeOpacity.value = 0;

        // Update both shared value and state for maximum reliability
        const newIndex = currentIndex + prependedCount;
        currentIndexShared.value = newIndex;
        setCurrentIndex(newIndex);

        // Directly update animation value to prevent visual jump
        translateX.value = -newIndex * SCREEN_WIDTH;

        // Animate the fade-in effect
        fadeOpacity.value = withTiming(1, {
          duration: 500,
          easing: Easing.out(Easing.ease),
        });
      }
    }

    // Update state and refs
    setItems(initialItems);
    prevItemsRef.current = initialItems;
    prevItemsFirstIdRef.current = initialItems.length > 0 ? initialItems[0].id : null;

    // Clear updating flags after a delay to let rendering complete
    setTimeout(() => {
      isPrepending.value = false;
      setUpdating(false);
      prependOperationRef.current = false;

      // Perform a safety check after items update
      performSelfCorrection();

      // Schedule additional checks to catch edge cases
      if (safetyCheckTimerRef.current) {
        clearTimeout(safetyCheckTimerRef.current);
      }

      safetyCheckTimerRef.current = setTimeout(() => {
        performSelfCorrection();
        safetyCheckTimerRef.current = null;
      }, 200);
    }, 100);
  }, [
    initialItems,
    currentIndex,
    translateX,
    setUpdating,
    performSelfCorrection,
    currentIndexShared,
    fadeOpacity,
  ]);

  // Apply updates when items change
  useMemo(() => {
    updateItems();
  }, [updateItems]);

  // Safety check effect - periodically check for blank screens
  useEffect(() => {
    // Initial safety check
    const timer = setTimeout(() => {
      performSelfCorrection();
    }, 1000);

    return () => clearTimeout(timer);
  }, [performSelfCorrection]);

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
      // Don't update if currently updating items
      if (isUpdating.value) return;

      // Update both for maximum reliability
      currentIndexShared.value = newIndex;
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
    [items.length, onSwipeEnd, fetchThreshold, isUpdating.value, currentIndexShared]
  );

  // Basic pan gesture for swiping - disabled during updates
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

      // Update the index if changed
      if (newIndex !== currentIndexShared.value) {
        // Update shared value immediately for animation consistency
        currentIndexShared.value = newIndex;

        // Use runOnJS to update React state and trigger callbacks
        runOnJS(handleIndexChange)(newIndex, direction);
      }
    });

  // Animation style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Fade animation style
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  return (
    <View className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View className="flex-1 flex-row" style={[animatedStyle, fadeStyle]}>
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
          selfCorrections={selfCorrections}
          fadeOpacity={fadeOpacity.value}
        />
      )}
    </View>
  );
}

export default Swiper;

configureReanimatedLogger({
  strict: false, // Reanimated runs in strict mode by default
});
