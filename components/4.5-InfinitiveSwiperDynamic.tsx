import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
const VISIBLE_ITEMS_THRESHOLD = 5;

const InfiniteSwiper = ({
  children,
  onEndSwipe,
  initialIndex = null, // Custom starting index (optional)
}) => {
  // Convert children to array for manipulation
  const [items, setItems] = useState(React.Children.toArray(children));
  const itemCount = items.length;

  // Calculate initial position - use provided index or middle item
  const getInitialIndex = () => {
    if (initialIndex !== null && initialIndex >= 0 && initialIndex < itemCount) {
      // If valid initialIndex is provided, use it with a large offset
      return initialIndex + itemCount * 1000;
    }
    // Otherwise start in the middle (default)
    const middleIndex = Math.floor(itemCount / 2);
    return middleIndex + itemCount * 1000;
  };

  const initialVirtualIndex = getInitialIndex();

  // State for managing virtual index and visible range
  const [virtualIndex, setVirtualIndex] = useState(initialVirtualIndex);
  const [visibleRange, setVisibleRange] = useState({
    start: initialVirtualIndex - VISIBLE_ITEMS_THRESHOLD,
    end: initialVirtualIndex + VISIBLE_ITEMS_THRESHOLD,
  });

  // Animation values
  const translateX = useSharedValue(-initialVirtualIndex * SCREEN_WIDTH);
  const isGestureActive = useSharedValue(false);

  // Handle adding new items to either end of the array
  const addItems = useCallback(
    (newItems, direction) => {
      if (!newItems || !newItems.length) return;

      setItems((currentItems) => {
        if (direction === 'next') {
          // Add items to the end
          return [...currentItems, ...newItems];
        } else {
          // Add items to the beginning and adjust virtualIndex to maintain position
          // We need to adjust all index-related values to account for the shift
          const adjustAmount = newItems.length;

          // Schedule the virtualIndex update for the next render cycle
          // This ensures we don't get a visual jump
          setTimeout(() => {
            setVirtualIndex((prevIndex) => prevIndex + adjustAmount);
            setVisibleRange((prev) => ({
              start: prev.start + adjustAmount,
              end: prev.end + adjustAmount,
            }));
            translateX.value = -(virtualIndex + adjustAmount) * SCREEN_WIDTH;
          }, 0);

          return [...newItems, ...currentItems];
        }
      });
    },
    [virtualIndex, translateX]
  );

  // Calculate real index from virtual index
  const getRealIndex = useCallback(
    (virtual) => {
      let real = virtual % itemCount;
      if (real < 0) real += itemCount;
      return real;
    },
    [itemCount]
  );

  // Update visible range based on current index
  const updateVisibleRange = useCallback((currentVirtual) => {
    const start = currentVirtual - VISIBLE_ITEMS_THRESHOLD;
    const end = currentVirtual + VISIBLE_ITEMS_THRESHOLD;
    setVisibleRange({ start, end });
  }, []);

  // Generate currently visible items
  const visibleItems = useMemo(() => {
    const visItems = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const realIndex = getRealIndex(i);
      visItems.push({
        virtualIndex: i,
        realIndex,
        content: items[realIndex],
      });
    }
    return visItems;
  }, [visibleRange, getRealIndex, items]);

  // Handle index updates
  const updateIndex = useCallback(
    (newVirtualIndex) => {
      setVirtualIndex(newVirtualIndex);
      updateVisibleRange(newVirtualIndex);
    },
    [updateVisibleRange]
  );

  // Handle swipe end and call the callback
  const handleSwipeEnd = useCallback(
    async (direction, newVirtualIndex) => {
      if (!onEndSwipe) return;

      // Call the callback with direction and virtual index
      try {
        const newItems = await onEndSwipe(direction, newVirtualIndex);
        if (newItems && newItems.length > 0) {
          addItems(newItems, direction);
        }
      } catch (error) {
        console.error('Error in onEndSwipe callback:', error);
      }
    },
    [onEndSwipe, addItems]
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
      let direction = null;

      if (velocityThreshold || distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          newVirtualIndex--;
          direction = 'previous';
        } else {
          newVirtualIndex++;
          direction = 'next';
        }
      }

      // Animate to the final position
      translateX.value = withSpring(-newVirtualIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 100,
        mass: 0.5,
        velocity: event.velocityX,
      });

      // Update the index
      runOnJS(updateIndex)(newVirtualIndex);

      // Call the onEndSwipe callback if direction changed
      if (direction) {
        runOnJS(handleSwipeEnd)(direction, newVirtualIndex);
      }
    });

  // Create animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Update component when children change externally
  useEffect(() => {
    const newChildren = React.Children.toArray(children);
    if (newChildren.length !== items.length) {
      setItems(newChildren);
    }
  }, [children]);

  return (
    <View className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View className="flex-1 flex-row" style={animatedStyle}>
          {visibleItems.map(({ virtualIndex, content }) => (
            <View
              key={virtualIndex}
              className="w-screen items-center justify-center"
              style={{
                width: SCREEN_WIDTH,
                position: 'absolute',
                left: virtualIndex * SCREEN_WIDTH,
              }}>
              <View className="h-full w-full">{content}</View>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {/* Pagination indicators */}
      <View className="absolute bottom-5 w-full flex-row items-center justify-center">
        {items.map((_, index) => (
          <View
            key={index}
            className={`mx-1 h-2 w-2 rounded-full ${
              getRealIndex(virtualIndex) === index ? 'scale-110 bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </View>
    </View>
  );
};

export default InfiniteSwiper;
