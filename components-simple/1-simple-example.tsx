import React, { useState, useCallback, useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Screen dimensions and thresholds
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VISIBLE_ITEMS_THRESHOLD = 2;
const FETCH_THRESHOLD = 4;

// Animation configuration
const TIMING_CONFIG = {
  duration: 2000, // Animation duration in milliseconds
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

// Component props
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

// Debug component props and implementation are omitted for brevity

// Simple and stable swiper component
function Swiper<T extends ItemData>({
  initialItems,
  renderItem,
  initialIndex = 0,
  onSwipeEnd,
  fetchThreshold = FETCH_THRESHOLD,
  showDebugPanel = false,
}: SwiperProps<T>) {
  // Store items state
  const [items, setItems] = useState(initialItems);

  // Current index
  const [currentIndex, setCurrentIndex] = useState(Math.min(initialIndex, initialItems.length - 1));

  // Translation value for animation
  const translateX = useSharedValue(-currentIndex * SCREEN_WIDTH);

  // Flag to prevent interactions during animations
  const isAnimating = useSharedValue(false);

  // Update items when props change
  React.useEffect(() => {
    // Skip if no items
    if (initialItems.length === 0) return;

    // Adjust current index if it's out of bounds
    let newIndex = currentIndex;
    if (currentIndex >= initialItems.length) {
      newIndex = Math.max(0, initialItems.length - 1);
      setCurrentIndex(newIndex);
      translateX.value = -newIndex * SCREEN_WIDTH;
    }

    // Update items
    setItems(initialItems);
  }, [initialItems]);

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

  // Handle index change and notify parent
  const handleIndexChange = useCallback(
    (newIndex: number, direction?: SwipeDirection) => {
      setCurrentIndex(newIndex);

      // Notify parent if direction is provided
      if (direction && onSwipeEnd) {
        // Calculate distance from edge based on direction
        const distanceFromEdge =
          direction === 'next'
            ? items.length - newIndex - 1 // Distance to end
            : newIndex; // Distance from start

        // Determine if we're close enough to the edge to fetch more
        const shouldFetch = distanceFromEdge <= fetchThreshold;

        // Notify parent
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

  // Animate to a specific index
  const animateToIndex = useCallback(
    (index: number, direction?: SwipeDirection) => {
      // Skip if already animating
      if (isAnimating.value) return;

      // Set flag to prevent new gestures
      isAnimating.value = true;

      // Calculate target position
      const position = -index * SCREEN_WIDTH;

      // Cancel any ongoing animations
      cancelAnimation(translateX);

      // Start new animation
      translateX.value = withTiming(position, TIMING_CONFIG, (finished) => {
        if (finished) {
          // Only update state if animation completed (not interrupted)
          runOnJS(handleIndexChange)(index, direction);

          // Clear animating flag
          runOnJS(() => {
            isAnimating.value = false;
          })();
        }
      });
    },
    [handleIndexChange]
  );

  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .enabled(!isAnimating.value) // Disable during animations
    .onStart(() => {
      // Capture the current translation
      cancelAnimation(translateX);
    })
    .onUpdate((event) => {
      // Simple translation based on drag
      const newPosition = -currentIndex * SCREEN_WIDTH + event.translationX;

      // Apply boundaries - prevent excessive dragging
      const minTranslate = -(items.length - 1) * SCREEN_WIDTH;
      translateX.value = Math.max(minTranslate, Math.min(0, newPosition));
    })
    .onEnd((event) => {
      // Determine if we should change slides
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

      // Animate to target position
      if (newIndex !== currentIndex) {
        runOnJS(animateToIndex)(newIndex, direction);
      } else {
        // If no change, just snap back
        translateX.value = withTiming(-currentIndex * SCREEN_WIDTH, TIMING_CONFIG, () => {
          isAnimating.value = false;
        });
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
    </View>
  );
}

export default Swiper;
