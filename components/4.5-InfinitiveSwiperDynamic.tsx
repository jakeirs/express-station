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
const VISIBLE_ITEMS_THRESHOLD = 5;

// Define TypeScript interfaces for our data structures
interface VisibleItem {
  virtualIndex: number;
  realIndex: number;
  content: React.ReactNode;
}

interface VisibleRange {
  start: number;
  end: number;
}

interface DebugLogProps {
  log: VisibleItem[];
  virtualIndex: number;
}

interface InfiniteSwiperProps {
  children: React.ReactNode[];
  initialIndex?: number; // Optional prop to specify which item to start with
}

// Debug component to visualize what's happening
const DebugLog: React.FC<DebugLogProps> = ({ log, virtualIndex }) => {
  const visibleItemsIds = log.map((item) => item.realIndex);
  const visibleItemsIdsVirtual = log.map((item) => item.virtualIndex);

  return (
    <ScrollView
      className="absolute bottom-0 left-0 right-0 h-32 bg-black/80"
      contentContainerClassName="p-2">
      <Text className="mb-1 text-xs text-white">Real Indices:</Text>
      <View className="mb-2 flex flex-row">
        {visibleItemsIds.map((entry, index) => (
          <Text key={index} className="mr-1 text-xs text-green-400">
            {entry}
          </Text>
        ))}
      </View>

      <Text className="mb-1 text-xs text-white">Virtual Indices:</Text>
      <View className="mb-2 flex flex-row">
        {visibleItemsIdsVirtual.map((entry, index) => (
          <Text key={index} className="mr-1 text-xs text-blue-400">
            {entry}
          </Text>
        ))}
      </View>
      <Text className="text-xs text-red-400">Current Virtual Index: {virtualIndex}</Text>
      <Text className="text-xs text-orange-400">Visible Items Count: {log.length}</Text>
    </ScrollView>
  );
};

const InfiniteSwiper: React.FC<InfiniteSwiperProps> = ({ children, initialIndex }) => {
  // Convert children to array for easier manipulation
  const originalItems = React.Children.toArray(children);
  const itemCount = originalItems.length;

  // Find the starting index - either use the provided initialIndex or default to the middle
  const getStartingIndex = () => {
    if (initialIndex !== undefined && initialIndex >= 0 && initialIndex < itemCount) {
      // If a valid initialIndex is provided, use it
      return Math.floor(itemCount * 1000) + initialIndex;
    } else if (itemCount > 0) {
      // Start from the middle of the array if no initialIndex is provided
      const middleIndex = Math.floor(itemCount / 2);
      return Math.floor(itemCount * 1000) + middleIndex;
    }
    return Math.floor(itemCount * 1000); // Fallback to first item
  };

  const initialVirtualIndex = getStartingIndex();

  // State management
  const [virtualIndex, setVirtualIndex] = useState<number>(initialVirtualIndex);
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({
    start: initialVirtualIndex - VISIBLE_ITEMS_THRESHOLD,
    end: initialVirtualIndex + VISIBLE_ITEMS_THRESHOLD,
  });

  // Animation values
  const translateX = useSharedValue<number>(-initialVirtualIndex * SCREEN_WIDTH);
  const isGestureActive = useSharedValue<boolean>(false);

  // Calculate real index from virtual index
  const getRealIndex = useCallback(
    (virtual: number): number => {
      let real = virtual % itemCount;
      if (real < 0) real += itemCount;
      return real;
    },
    [itemCount]
  );

  // Calculate which items should be visible based on current index
  const updateVisibleRange = useCallback((currentVirtual: number) => {
    const start = currentVirtual - VISIBLE_ITEMS_THRESHOLD;
    const end = currentVirtual + VISIBLE_ITEMS_THRESHOLD;
    setVisibleRange({ start, end });
  }, []);

  // Generate currently visible items
  const visibleItems = useMemo((): VisibleItem[] => {
    const items: VisibleItem[] = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const realIndex = getRealIndex(i);
      items.push({
        virtualIndex: i,
        realIndex,
        content: originalItems[realIndex],
      });
    }
    return items;
  }, [visibleRange, getRealIndex, originalItems]);

  // Handle index updates
  const updateIndex = useCallback(
    (newVirtualIndex: number) => {
      setVirtualIndex(newVirtualIndex);
      runOnJS(updateVisibleRange)(newVirtualIndex);
    },
    [updateVisibleRange]
  );

  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      translateX.value = -virtualIndex * SCREEN_WIDTH + event.translationX;
    })
    .onEnd((event) => {
      isGestureActive.value = false;

      const velocityThreshold = Math.abs(event.velocityX) > 500;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      let newVirtualIndex = virtualIndex;

      if (velocityThreshold || distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          newVirtualIndex--; // Move backward
        } else {
          newVirtualIndex++; // Move forward
        }
      }

      // Animate to the new position
      translateX.value = withSpring(-newVirtualIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 100,
        mass: 0.5,
        velocity: event.velocityX,
      });

      // Update the virtual index and visible range
      runOnJS(updateIndex)(newVirtualIndex);
    });

  // Animated style for smooth transitions
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View className="flex-1 flex-row" style={animatedStyle}>
          {visibleItems.map(({ virtualIndex: vIndex, content }) => (
            <View
              key={vIndex}
              className="w-screen items-center justify-center"
              style={{
                width: SCREEN_WIDTH,
                position: 'absolute',
                left: vIndex * SCREEN_WIDTH,
              }}>
              <View className="h-full w-full">{content}</View>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {/* Pagination indicators */}
      <View className="absolute top-10 w-full flex-row items-center justify-center">
        {originalItems.map((_, index) => (
          <View
            key={index}
            className={`mx-1 h-2 w-2 rounded-full ${
              getRealIndex(virtualIndex) === index ? 'scale-110 bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </View>

      {/* Debug panel */}
      <DebugLog log={visibleItems} virtualIndex={virtualIndex} />
    </View>
  );
};

export default InfiniteSwiper;
