import React, { useState, useCallback, useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VISIBLE_ITEMS_THRESHOLD = 5; // Number of items to keep mounted on each side

const InfiniteSwiper = ({ children }) => {
  // Convert children to array for easier manipulation
  const originalItems = React.Children.toArray(children);
  const itemCount = originalItems.length;

  // State for managing the current centered index and visible range
  const [virtualIndex, setVirtualIndex] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: itemCount - 1 });

  // Shared values for animations
  const translateX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  // Calculate the real index from virtual index
  const getRealIndex = useCallback((virtual) => {
    // Ensure the index is always positive and wraps around
    let real = virtual % itemCount;
    if (real < 0) real += itemCount;
    return real;
  }, [itemCount]);

  // Calculate which items should be visible based on the current index
  const updateVisibleRange = useCallback((currentVirtual) => {
    const start = currentVirtual - VISIBLE_ITEMS_THRESHOLD;
    const end = currentVirtual + VISIBLE_ITEMS_THRESHOLD;
    setVisibleRange({ start, end });
  }, []);

  // Generate the items that should be currently visible
  const visibleItems = useMemo(() => {
    const items = [];
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

  // Handle index updates and transitions
  const updateIndex = useCallback((newVirtualIndex) => {
    setVirtualIndex(newVirtualIndex);
    runOnJS(updateVisibleRange)(newVirtualIndex);
  }, [updateVisibleRange]);

  // Pan gesture handler with infinite scrolling logic
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
          newVirtualIndex--; // Move backwards
        } else {
          newVirtualIndex++; // Move forwards
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

  // Animated style for the container
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View 
          className="flex-1 flex-row" 
          style={animatedStyle}
        >
          {visibleItems.map(({ virtualIndex, content }) => (
            <View
              key={virtualIndex}
              className="w-screen items-center justify-center"
              style={{ 
                width: SCREEN_WIDTH,
                position: 'absolute',
                left: virtualIndex * SCREEN_WIDTH,
              }}
            >
              <View className="w-full h-full">
                {content}
              </View>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {/* Pagination indicators showing real index */}
      <View className="flex-row justify-center items-center absolute bottom-5 w-full">
        {originalItems.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              getRealIndex(virtualIndex) === index 
                ? 'bg-white scale-110' 
                : 'bg-white/50'
            }`}
          />
        ))}
      </View>
    </View>
  );
};

export default InfiniteSwiper;

