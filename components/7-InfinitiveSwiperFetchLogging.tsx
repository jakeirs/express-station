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

// Logging components
const DebugLog = ({ log }) => (
  <ScrollView 
    className="absolute bottom-0 left-0 right-0 bg-black/80 h-32"
    contentContainerClassName="p-2"
  >
    {log.map((entry, index) => (
      <Text 
        key={index} 
        className={`text-xs ${
          entry.type === 'mount' ? 'text-green-400' : 
          entry.type === 'unmount' ? 'text-red-400' : 
          'text-blue-400'
        }`}
      >
        {entry.timestamp.toLocaleTimeString()} - {entry.message}
      </Text>
    ))}
  </ScrollView>
);

const ItemWrapper = ({ children, itemId, onMount, onUnmount }) => {
  useEffect(() => {
    onMount(itemId);
    return () => onUnmount(itemId);
  }, [itemId]);

  return children;
};

const InfiniteSwiperWithFetch = ({ initialItems, onFetchNext, onFetchPrevious, renderItem }) => {
  const [items, setItems] = useState(initialItems);
  const [virtualIndex, setVirtualIndex] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ 
    start: -VISIBLE_ITEMS_THRESHOLD, 
    end: VISIBLE_ITEMS_THRESHOLD 
  });

  // Debug state
  const [debugLog, setDebugLog] = useState([]);
  const [mountedItems, setMountedItems] = useState(new Set());

  // Animation values
  const translateX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  // Logging functions
  const addToLog = useCallback((message, type = 'info') => {
    setDebugLog(prev => [{
      message,
      type,
      timestamp: new Date()
    }, ...prev.slice(0, 19)]);
  }, []);

  const handleMount = useCallback((itemId) => {
    setMountedItems(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    addToLog(`Mounted: ${itemId}`, 'mount');
  }, [addToLog]);

  const handleUnmount = useCallback((itemId) => {
    setMountedItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    addToLog(`Unmounted: ${itemId}`, 'unmount');
  }, [addToLog]);

  // Update visible range when virtual index changes
  const updateVisibleRange = useCallback((currentVirtual) => {
    const start = currentVirtual - VISIBLE_ITEMS_THRESHOLD;
    const end = currentVirtual + VISIBLE_ITEMS_THRESHOLD;
    setVisibleRange({ start, end });
  }, []);

  // Handle updates when approaching edges
  const handleEdgeReached = useCallback(async (direction) => {
    try {
      addToLog(`Fetching ${direction} items...`);
      const newItems = await (direction === 'next' ? onFetchNext() : onFetchPrevious());
      
      setItems(prev => {
        const updated = direction === 'next' 
          ? [...prev, ...newItems]
          : [...newItems, ...prev];
        addToLog(`Added ${newItems.length} ${direction} items`);
        return updated;
      });

      if (direction === 'previous') {
        setVirtualIndex(prev => prev + newItems.length);
        translateX.value = translateX.value - (newItems.length * SCREEN_WIDTH);
      }
    } catch (error) {
      addToLog(`Error fetching ${direction} items: ${error.message}`, 'error');
    }
  }, [onFetchNext, onFetchPrevious]);

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

      runOnJS(setVirtualIndex)(newVirtualIndex);
      runOnJS(updateVisibleRange)(newVirtualIndex);
      runOnJS(addToLog)(`Swiped to index: ${newVirtualIndex}`);
    });

  // Generate visible items
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
    if (virtualIndex + VISIBLE_ITEMS_THRESHOLD >= items.length) {
      handleEdgeReached('next');
    } else if (virtualIndex - VISIBLE_ITEMS_THRESHOLD <= 0) {
      handleEdgeReached('previous');
    }
  }, [virtualIndex, items.length]);

  // Animation style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Wrap renderItem with debug wrapper
  const renderItemWithDebug = useCallback(({ item, virtualIndex }) => (
    <ItemWrapper
      itemId={item.id}
      onMount={handleMount}
      onUnmount={handleUnmount}
    >
      <View
        className="w-screen items-center justify-center"
        style={{
          width: SCREEN_WIDTH,
          position: 'absolute',
          left: virtualIndex * SCREEN_WIDTH,
        }}
      >
        {renderItem({ item, virtualIndex })}
      </View>
    </ItemWrapper>
  ), [handleMount, handleUnmount, renderItem]);

  return (
    <View className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View 
          className="flex-1 flex-row" 
          style={animatedStyle}
        >
          {visibleItems.map((itemData) => 
            renderItemWithDebug(itemData)
          )}
        </Animated.View>
      </GestureDetector>

      {/* Stats overlay */}
      <View className="absolute top-4 right-4 bg-black/80 rounded-lg p-2">
        <Text className="text-white text-xs">
          Mounted Items: {mountedItems.size}
        </Text>
        <Text className="text-white text-xs mt-1">
          Virtual Index: {virtualIndex}
        </Text>
      </View>

      {/* Debug log */}
      <DebugLog log={debugLog} />
    </View>
  );
};

export default InfiniteSwiperWithFetch;