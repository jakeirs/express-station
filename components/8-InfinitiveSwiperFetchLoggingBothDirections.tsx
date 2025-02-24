import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
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

// Debug log component shows mount/unmount events and other information
const DebugLog = ({ log }) => (
  <ScrollView
    className="absolute bottom-0 left-0 right-0 h-32 bg-black/80"
    contentContainerClassName="p-2">
    {log.map((entry, index) => (
      <Text
        key={index}
        className={`text-xs ${
          entry.type === 'mount'
            ? 'text-green-400'
            : entry.type === 'unmount'
              ? 'text-red-400'
              : 'text-blue-400'
        }`}>
        {entry.timestamp.toLocaleTimeString()} - {entry.message}
      </Text>
    ))}
  </ScrollView>
);

// Wrapper component to track component lifecycle
const ItemWrapper = ({ children, itemId, onMount, onUnmount }) => {
  useEffect(() => {
    onMount(itemId);
    return () => onUnmount(itemId);
  }, [itemId]);

  return children;
};

const InfiniteSwiperWithFetch = ({
  initialItems,
  initialIndex = Math.floor(initialItems.length / 2), // Default to middle index
  onFetchNext,
  onFetchPrevious,
  renderItem,
}: {
  onFetchNext: any;
  onFetchPrevious: any;
  renderItem: any;
  initialIndex: number;
  initialItems: any;
}) => {
  // Initialize state with the provided starting index
  const [items, setItems] = useState(initialItems);
  const [virtualIndex, setVirtualIndex] = useState(initialIndex);
  const [visibleRange, setVisibleRange] = useState({
    start: initialIndex - VISIBLE_ITEMS_THRESHOLD,
    end: initialIndex + VISIBLE_ITEMS_THRESHOLD,
  });

  // Debug state
  const [debugLog, setDebugLog] = useState([]);
  const [mountedItems, setMountedItems] = useState(new Set());
  const [lastDirection, setLastDirection] = useState('initial');

  // Initialize animation value at the correct starting position
  const translateX = useSharedValue(-initialIndex * SCREEN_WIDTH);
  const isGestureActive = useSharedValue(false);

  // Logging functions
  const addToLog = useCallback((message, type = 'info') => {
    setDebugLog((prev) => [
      {
        message,
        type,
        timestamp: new Date(),
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  const handleMount = useCallback(
    (itemId) => {
      setMountedItems((prev) => {
        const next = new Set(prev);
        next.add(itemId);
        return next;
      });
      addToLog(`Mounted: ${itemId}`, 'mount');
    },
    [addToLog]
  );

  const handleUnmount = useCallback(
    (itemId) => {
      setMountedItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      addToLog(`Unmounted: ${itemId}`, 'unmount');
    },
    [addToLog]
  );

  // Update visible range when virtual index changes
  const updateVisibleRange = useCallback(
    (currentVirtual) => {
      const start = currentVirtual - VISIBLE_ITEMS_THRESHOLD;
      const end = currentVirtual + VISIBLE_ITEMS_THRESHOLD;
      setVisibleRange({ start, end });
      addToLog(`Updated range: ${start} to ${end}`);
    },
    [addToLog]
  );

  // Handle fetching new items when reaching edges
  const handleEdgeReached = useCallback(
    async (direction) => {
      try {
        addToLog(`Fetching ${direction} items...`);
        setLastDirection(direction);

        const newItems = await (direction === 'next' ? onFetchNext() : onFetchPrevious());

        if (!newItems || newItems.length === 0) {
          addToLog(`No more ${direction} items available`);
          return;
        }

        setItems((prev) => {
          const updated = direction === 'next' ? [...prev, ...newItems] : [...newItems, ...prev];
          addToLog(`Added ${newItems.length} ${direction} items`);
          return updated;
        });

        // Adjust virtual index and translation when prepending items
        if (direction === 'previous') {
          setVirtualIndex((prev) => prev + newItems.length);
          translateX.value = translateX.value - newItems.length * SCREEN_WIDTH;
        }
      } catch (error) {
        addToLog(`Error fetching ${direction} items: ${error.message}`, 'error');
      }
    },
    [onFetchNext, onFetchPrevious, addToLog]
  );

  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isGestureActive.value = true;
      runOnJS(addToLog)('Gesture started');
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
          runOnJS(setLastDirection)('previous');
        } else {
          newVirtualIndex++;
          runOnJS(setLastDirection)('next');
        }
      }

      translateX.value = withSpring(-newVirtualIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 100,
        mass: 0.5,
        velocity: event.velocityX,
      });

      runOnJS(setVirtualIndex)(newVirtualIndex);
      runOnJS(updateVisibleRange)(newVirtualIndex);
      runOnJS(addToLog)(`Swiped to index: ${newVirtualIndex}`);
    });

  // Generate visible items within the current range
  const visibleItems = useMemo(() => {
    const visible = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i >= 0 && i < items.length) {
        visible.push({
          virtualIndex: i,
          item: items[i],
        });
      }
    }
    return visible;
  }, [visibleRange, items]);

  // Check if we need to fetch more items
  useEffect(() => {
    const needsNext =
      virtualIndex + VISIBLE_ITEMS_THRESHOLD >= items.length && lastDirection === 'next';
    const needsPrevious =
      virtualIndex - VISIBLE_ITEMS_THRESHOLD <= 0 && lastDirection === 'previous';

    if (needsNext) {
      handleEdgeReached('next');
    } else if (needsPrevious) {
      handleEdgeReached('previous');
    }
  }, [virtualIndex, items.length, lastDirection, handleEdgeReached]);

  // Animation style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Wrap renderItem with debugging wrapper
  const renderItemWithDebug = useCallback(
    ({ item, virtualIndex }) => (
      <ItemWrapper itemId={item.id} onMount={handleMount} onUnmount={handleUnmount}>
        <View
          className="w-screen items-center justify-center"
          style={{
            width: SCREEN_WIDTH,
            position: 'absolute',
            left: virtualIndex * SCREEN_WIDTH,
          }}>
          {renderItem({ item, virtualIndex })}
        </View>
      </ItemWrapper>
    ),
    [handleMount, handleUnmount, renderItem]
  );

  return (
    <View className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View className="flex-1 flex-row" style={animatedStyle}>
          {visibleItems.map((itemData) => renderItemWithDebug(itemData))}
        </Animated.View>
      </GestureDetector>

      {/* Stats overlay */}
      <View className="absolute right-4 top-4 rounded-lg bg-black/80 p-2">
        <Text className="text-xs text-white">Mounted Items: {mountedItems.size}</Text>
        <Text className="mt-1 text-xs text-white">Virtual Index: {virtualIndex}</Text>
        <Text className="mt-1 text-xs text-white">Direction: {lastDirection}</Text>
      </View>

      {/* Debug log */}
      <DebugLog log={debugLog} />
    </View>
  );
};

export default InfiniteSwiperWithFetch;
