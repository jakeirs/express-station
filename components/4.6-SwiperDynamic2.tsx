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
// We still keep this for optimized rendering
const VISIBLE_ITEMS_THRESHOLD = 5;

// Define TypeScript interfaces for our data structures
interface VisibleItem {
  index: number;
  content: React.ReactNode;
}

interface DebugLogProps {
  log: VisibleItem[];
  currentIndex: number;
}

interface SwiperProps {
  children: React.ReactNode[];
  initialIndex?: number;
}

// Debug component to visualize what's happening
const DebugLog: React.FC<DebugLogProps> = ({ log, currentIndex }) => {
  const visibleItemsIds = log.map((item) => item.index);

  return (
    <ScrollView
      className="absolute bottom-0 left-0 right-0 h-32 bg-black/80"
      contentContainerClassName="p-2">
      <Text className="text-xs text-white mb-1">Visible Indices:</Text>
      <View className="flex flex-row mb-2">
        {visibleItemsIds.map((entry, index) => (
          <Text key={index} className="text-xs text-green-400 mr-1">
            {entry}
          </Text>
        ))}
      </View>
      
      <Text className="text-xs text-red-400">Current Index: {currentIndex}</Text>
      <Text className="text-xs text-orange-400">Visible Items Count: {log.length}</Text>
    </ScrollView>
  );
};

const Swiper: React.FC<SwiperProps> = ({ children, initialIndex = 0 }) => {
  // Convert children to array for easier manipulation
  const items = React.Children.toArray(children);
  const itemCount = items.length;

  // State management - use actual indices
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
  const getVisibleItems = useCallback((): VisibleItem[] => {
    const visibleItems: VisibleItem[] = [];
    
    // We still optimize by only rendering items that could be visible
    const startIdx = Math.max(0, currentIndex - VISIBLE_ITEMS_THRESHOLD);
    const endIdx = Math.min(itemCount - 1, currentIndex + VISIBLE_ITEMS_THRESHOLD);
    
    for (let i = startIdx; i <= endIdx; i++) {
      visibleItems.push({
        index: i,
        content: items[i],
      });
    }
    
    return visibleItems;
  }, [currentIndex, items, itemCount]);

  // Get currently visible items
  const visibleItems = useMemo(() => getVisibleItems(), [getVisibleItems]);

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
        } else {
          // Move forward but with boundary check
          newIndex = Math.min(itemCount - 1, currentIndex + 1);
        }
      }

      // Animate to the new position
      translateX.value = withSpring(-newIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 100,
        mass: 0.5,
        velocity: event.velocityX,
      });

      // FIXED: We must use runOnJS to update React state from the worklet
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
          {visibleItems.map(({ index, content }) => (
            <View
              key={index}
              className="w-screen items-center justify-center"
              style={{
                width: SCREEN_WIDTH,
                position: 'absolute',
                left: index * SCREEN_WIDTH,
              }}>
              <View className="h-full w-full">{content}</View>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {/* Pagination indicators */}
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
      <DebugLog log={visibleItems} currentIndex={currentIndex} />
    </View>
  );
};

export default Swiper;