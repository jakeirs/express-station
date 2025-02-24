import React, { useState, useCallback, useMemo } from 'react';
import { View, Dimensions, ScrollView, Text } from 'react-native';
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

const DebugLog = ({ log, virtualIndex }: { log: any[]; virtualIndex: any }) => {
  const visibleItemsIds = log.map((item) => item.realIndex);
  const visibleItemsIdsVirtual = log.map((item) => item.virtualIndex);

  return (
    <ScrollView
      className="absolute bottom-0 left-0 right-0 h-32 bg-black/80"
      contentContainerClassName="p-2">
      <View className="flex flex-row">
        {visibleItemsIds.map((entry, index) => (
          <Text key={index} className={`text-xs text-green-400`}>
            {entry}{' '}
          </Text>
        ))}
      </View>

      <View className="flex flex-row">
        {visibleItemsIdsVirtual.map((entry, index) => (
          <Text key={index} className={`text-xs text-green-400`}>
            {entry}{' '}
          </Text>
        ))}
      </View>
      <Text className={`text-xs text-red-400`}>{virtualIndex}</Text>
      <Text className={`text-xs text-orange-400`}>item count: {log.length}</Text>
    </ScrollView>
  );
};

const InfiniteSwiper = ({ children }) => {
  const originalItems = React.Children.toArray(children);
  const itemCount = originalItems.length;

  // Calculate the middle position to start from
  // We multiply by 1000 to give plenty of room for negative indices
  const initialVirtualIndex = Math.floor(itemCount * 1000);

  const [virtualIndex, setVirtualIndex] = useState(initialVirtualIndex);
  const [visibleRange, setVisibleRange] = useState({
    start: initialVirtualIndex - VISIBLE_ITEMS_THRESHOLD,
    end: initialVirtualIndex + VISIBLE_ITEMS_THRESHOLD,
  });

  // Initialize translateX with the starting position
  const translateX = useSharedValue(-initialVirtualIndex * SCREEN_WIDTH);
  const isGestureActive = useSharedValue(false);

  // Calculate real index from virtual index
  const getRealIndex = useCallback(
    (virtual) => {
      let real = virtual % itemCount;
      if (real < 0) real += itemCount;
      return real;
    },
    [itemCount]
  );

  // Calculate which items should be visible based on current index
  const updateVisibleRange = useCallback((currentVirtual) => {
    const start = currentVirtual - VISIBLE_ITEMS_THRESHOLD;
    const end = currentVirtual + VISIBLE_ITEMS_THRESHOLD;
    setVisibleRange({ start, end });
  }, []);

  // Generate currently visible items
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

  const updateIndex = useCallback(
    (newVirtualIndex) => {
      setVirtualIndex(newVirtualIndex);
      runOnJS(updateVisibleRange)(newVirtualIndex);
    },
    [updateVisibleRange]
  );

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
      <DebugLog log={visibleItems} virtualIndex={virtualIndex} />
    </View>
  );
};

export default InfiniteSwiper;
