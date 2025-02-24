import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
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

// Debug log component for tracking component lifecycle
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

// Loading indicator component
const LoadingOverlay = () => (
  <View className="absolute inset-0 bg-black/50 items-center justify-center">
    <ActivityIndicator size="large" color="#ffffff" />
    <Text className="text-white mt-4">Loading more items...</Text>
  </View>
);

// ItemWrapper for tracking mount/unmount
const ItemWrapper = ({ children, itemId, onMount, onUnmount }) => {
  useEffect(() => {
    onMount(itemId);
    return () => onUnmount(itemId);
  }, [itemId]);
  return children;
};

// Main InfiniteSwiperWithFetch component
const InfiniteSwiperWithFetch = ({ 
  initialItems,
  initialIndex = Math.floor(initialItems.length / 2),
  onFetchNext, 
  onFetchPrevious, 
  renderItem 
}) => {
  const [items, setItems] = useState(initialItems);
  const [virtualIndex, setVirtualIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleRange, setVisibleRange] = useState({ 
    start: initialIndex - VISIBLE_ITEMS_THRESHOLD, 
    end: initialIndex + VISIBLE_ITEMS_THRESHOLD 
  });

  // Debug state
  const [debugLog, setDebugLog] = useState([]);
  const [mountedItems, setMountedItems] = useState(new Set());
  const [lastDirection, setLastDirection] = useState('initial');
  const isFetchingRef = useRef(false);

  // Animation values
  const translateX = useSharedValue(-initialIndex * SCREEN_WIDTH);
  const isGestureActive = useSharedValue(false);
  const previousVirtualIndexRef = useRef(initialIndex);

  const addToLog = useCallback((message, type = 'info') => {
    setDebugLog(prev => [{
      message, type, timestamp: new Date()
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

  const updateVisibleRange = useCallback((currentVirtual) => {
    setVisibleRange({
      start: currentVirtual - VISIBLE_ITEMS_THRESHOLD,
      end: currentVirtual + VISIBLE_ITEMS_THRESHOLD
    });
  }, []);

  const handleEdgeReached = useCallback(async (direction) => {
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      addToLog(`Fetching ${direction} items...`);
      
      const newItems = await (direction === 'next' ? onFetchNext() : onFetchPrevious());
      
      if (!newItems || newItems.length === 0) {
        addToLog(`No more ${direction} items available`);
        // Revert to previous position if no items are available
        setVirtualIndex(previousVirtualIndexRef.current);
        translateX.value = withSpring(-previousVirtualIndexRef.current * SCREEN_WIDTH);
        return;
      }

      setItems(prev => {
        const updated = direction === 'next' 
          ? [...prev, ...newItems]
          : [...newItems, ...prev];
        addToLog(`Added ${newItems.length} ${direction} items`);
        return updated;
      });

      if (direction === 'previous') {
        const offset = newItems.length;
        setVirtualIndex(prev => {
          const newIndex = prev + offset;
          previousVirtualIndexRef.current = newIndex;
          return newIndex;
        });
        translateX.value = translateX.value - (offset * SCREEN_WIDTH);
      }
    } catch (error) {
      addToLog(`Error fetching ${direction} items: ${error.message}`, 'error');
      // Revert to previous position on error
      setVirtualIndex(previousVirtualIndexRef.current);
      translateX.value = withSpring(-previousVirtualIndexRef.current * SCREEN_WIDTH);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [onFetchNext, onFetchPrevious]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isGestureActive.value = true;
      runOnJS(addToLog)('Gesture started');
    })
    .onUpdate((event) => {
      if (!isFetchingRef.current) {
        translateX.value = -virtualIndex * SCREEN_WIDTH + event.translationX;
      }
    })
    .onEnd((event) => {
      isGestureActive.value = false;
      
      if (isFetchingRef.current) {
        translateX.value = withSpring(-virtualIndex * SCREEN_WIDTH);
        return;
      }
      
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

      previousVirtualIndexRef.current = virtualIndex;
      
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

  useEffect(() => {
    if (isFetchingRef.current) return;

    const needsNext = virtualIndex + VISIBLE_ITEMS_THRESHOLD >= items.length 
      && lastDirection === 'next';
    const needsPrevious = virtualIndex - VISIBLE_ITEMS_THRESHOLD <= 0 
      && lastDirection === 'previous';

    if (needsNext || needsPrevious) {
      handleEdgeReached(needsNext ? 'next' : 'previous');
    }
  }, [virtualIndex, items.length, lastDirection]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

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

      {isLoading && <LoadingOverlay />}

      {/* Stats overlay */}
      <View className="absolute top-4 right-4 bg-black/80 rounded-lg p-2">
        <Text className="text-white text-xs">
          Mounted Items: {mountedItems.size}
        </Text>
        <Text className="text-white text-xs mt-1">
          Virtual Index: {virtualIndex}
        </Text>
        <Text className="text-white text-xs mt-1">
          Direction: {lastDirection}
        </Text>
      </View>

      <DebugLog log={debugLog} />
    </View>
  );
};

export default InfiniteSwiperWithFetch;