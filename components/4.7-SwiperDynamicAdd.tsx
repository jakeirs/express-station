import React, { useState, useCallback, useMemo } from 'react';
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
  onSwipeEnd?: (info: { direction: SwipeDirection }) => void;
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
}

// Debug component to visualize what's happening
function DebugLog<T extends ItemData>({ log, currentIndex }: DebugLogProps<T>) {
  const visibleItemsIds = log.map((item) => item.index);

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
      <Text className="text-xs text-orange-400">Visible Items Count: {log.length}</Text>
    </ScrollView>
  );
}

// Main component with generic type support
function Swiper<T extends ItemData>({
  initialItems,
  renderItem,
  initialIndex = 0,
  onSwipeEnd,
  showDebugPanel = false,
}: SwiperProps<T>) {
  const itemCount = initialItems.length;

  // State management - use actual indices || initial = 0
  const [currentIndex, setCurrentIndex] = useState<number>(
    initialIndex >= 0 && initialIndex < itemCount ? initialIndex : 0
  );

  // Animation values
  const translateX = useSharedValue<number>(-currentIndex * SCREEN_WIDTH);
  const isGestureActive = useSharedValue<boolean>(false);

  // Update the current index - this function will be called through runOnJS
  const updateIndex = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
  }, []);

  // Calculate which items should be visible for optimization
  const getVisibleItems = useCallback((): VisibleItem<T>[] => {
    const visibleItems: VisibleItem<T>[] = [];

    // We optimize by only rendering items that could be visible
    const startIdx = Math.max(0, currentIndex - VISIBLE_ITEMS_THRESHOLD);
    const endIdx = Math.min(itemCount - 1, currentIndex + VISIBLE_ITEMS_THRESHOLD);

    for (let i = startIdx; i <= endIdx; i++) {
      visibleItems.push({
        index: i,
        item: initialItems[i],
      });
    }

    return visibleItems;
  }, [currentIndex, initialItems, itemCount]);

  // Get currently visible items
  const visibleItems = useMemo(() => getVisibleItems(), [getVisibleItems]);

  console.log('visibleItems', visibleItems.length);

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

      if (velocityThreshold || distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          // Move backward but with boundary check
          newIndex = Math.max(0, currentIndex - 1);

          if (onSwipeEnd && currentIndex !== newIndex) {
            runOnJS(onSwipeEnd)({ direction: 'previous' });
          }
        } else {
          // Move forward but with boundary check
          newIndex = Math.min(itemCount - 1, currentIndex + 1);

          if (onSwipeEnd && currentIndex !== newIndex) {
            runOnJS(onSwipeEnd)({ direction: 'next' });
          }
        }
      }

      // Animate to the new position
      translateX.value = withSpring(-newIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 100,
        mass: 0.5,
        velocity: event.velocityX,
      });

      // We must use runOnJS to update React state from the worklet
      runOnJS(updateIndex)(newIndex);
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
        {initialItems.map((_, index) => (
          <View
            key={index}
            className={`mx-1 h-2 w-2 rounded-full ${
              currentIndex === index ? 'scale-110 bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </View>

      {/* Debug panel - only shown if requested */}
      {showDebugPanel && <DebugLog log={visibleItems} currentIndex={currentIndex} />}
    </View>
  );
}

export default Swiper;
