import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Dimensions, ActivityIndicator } from 'react-native';
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
const FETCH_THRESHOLD = 3; // Start fetching when we're this many items from the edge

const InfiniteSwiperWithFetch = ({
  initialItems,
  onFetchNext,
  onFetchPrevious,
  renderItem,
}: {
  initialItems: any;
  onFetchNext: any;
  onFetchPrevious: any;
  renderItem: any;
}) => {
  // State for managing items and loading states
  const [items, setItems] = useState(initialItems);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [virtualIndex, setVirtualIndex] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: items.length - 1 });

  // Shared values for animations
  const translateX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  // Function to fetch more items in either direction
  const fetchMoreItems = useCallback(
    async (direction) => {
      try {
        if (direction === 'next' && !isLoadingNext) {
          setIsLoadingNext(true);
          const newItems = await onFetchNext();
          setItems((prevItems) => [...prevItems, ...newItems]);
          setIsLoadingNext(false);
        } else if (direction === 'previous' && !isLoadingPrevious) {
          setIsLoadingPrevious(true);
          const newItems = await onFetchPrevious();
          setItems((prevItems) => [...newItems, ...prevItems]);
          // Adjust virtual index to maintain position after prepending items
          setVirtualIndex((prevIndex) => prevIndex + newItems.length);
          setIsLoadingPrevious(false);
        }
      } catch (error) {
        console.error(`Error fetching ${direction} items:`, error);
        setIsLoadingNext(false);
        setIsLoadingPrevious(false);
      }
    },
    [onFetchNext, onFetchPrevious, isLoadingNext, isLoadingPrevious]
  );

  // Check if we need to fetch more items based on current position
  useEffect(() => {
    const realIndex = getRealIndex(virtualIndex);

    if (realIndex > items.length - FETCH_THRESHOLD) {
      fetchMoreItems('next');
    } else if (realIndex < FETCH_THRESHOLD) {
      fetchMoreItems('previous');
    }
  }, [virtualIndex, items.length, fetchMoreItems]);

  // Calculate real index from virtual index
  const getRealIndex = useCallback(
    (virtual) => {
      let real = virtual % items.length;
      if (real < 0) real += items.length;
      return real;
    },
    [items.length]
  );

  // Update visible range based on current index
  const updateVisibleRange = useCallback((currentVirtual) => {
    const start = currentVirtual - VISIBLE_ITEMS_THRESHOLD;
    const end = currentVirtual + VISIBLE_ITEMS_THRESHOLD;
    setVisibleRange({ start, end });
  }, []);

  // Generate currently visible items
  const visibleItems = useMemo(() => {
    const visible = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const realIndex = getRealIndex(i);
      visible.push({
        virtualIndex: i,
        realIndex,
        item: items[realIndex],
      });
    }
    return visible;
  }, [visibleRange, getRealIndex, items]);

  // Handle index updates
  const updateIndex = useCallback(
    (newVirtualIndex) => {
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
          newVirtualIndex--;
        } else {
          newVirtualIndex++;
        }
      }

      translateX.value = withSpring(-newVirtualIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 100,
        mass: 0.5,
        velocity: event.velocityX,
      });

      runOnJS(updateIndex)(newVirtualIndex);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View className="flex-1 flex-row" style={animatedStyle}>
          {/* Loading indicator for previous items */}
          {isLoadingPrevious && (
            <View
              className="w-screen items-center justify-center"
              style={{
                width: SCREEN_WIDTH,
                position: 'absolute',
                left: (visibleRange.start - 1) * SCREEN_WIDTH,
              }}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          )}

          {/* Render visible items */}
          {visibleItems.map(({ virtualIndex, item }) => (
            <View
              key={virtualIndex}
              className="w-screen items-center justify-center"
              style={{
                width: SCREEN_WIDTH,
                position: 'absolute',
                left: virtualIndex * SCREEN_WIDTH,
              }}>
              <View className="h-full w-full">{renderItem({ item, index: virtualIndex })}</View>
            </View>
          ))}

          {/* Loading indicator for next items */}
          {isLoadingNext && (
            <View
              className="w-screen items-center justify-center"
              style={{
                width: SCREEN_WIDTH,
                position: 'absolute',
                left: (visibleRange.end + 1) * SCREEN_WIDTH,
              }}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          )}
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

export default InfiniteSwiperWithFetch;
