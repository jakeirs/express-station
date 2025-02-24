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
const VISIBLE_ITEMS_THRESHOLD = 5; // Items to keep mounted on each side
const INITIAL_BUFFER_SIZE = 5; // Initial items on each side

// Type definitions
interface LogEntry {
  message: string;
  type: 'mount' | 'unmount' | 'info' | 'error';
  timestamp: Date;
}

interface Props<T> {
  initialItems: T[];
  onFetchNext: () => Promise<T[]>;
  onFetchPrevious: () => Promise<T[]>;
  renderItem: (props: { item: T; virtualIndex: number }) => React.ReactNode;
}

function InfiniteSwiperWithFetch<T extends { id: string }>({
  initialItems,
  onFetchNext,
  onFetchPrevious,
  renderItem,
}: Props<T>) {
  // State for items and positioning
  const [items, setItems] = useState<T[]>(initialItems);
  const [virtualIndex, setVirtualIndex] = useState(INITIAL_BUFFER_SIZE);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  // Debug state
  const [debugLog, setDebugLog] = useState<LogEntry[]>([]);
  const [mountedItems, setMountedItems] = useState<Set<string>>(new Set());

  // Animation values
  const translateX = useSharedValue(-INITIAL_BUFFER_SIZE * SCREEN_WIDTH);
  const isGestureActive = useSharedValue(false);

  // Initial loading of items in both directions
  useEffect(() => {
    const initializeItems = async () => {
      try {
        setIsLoadingPrevious(true);
        setIsLoadingNext(true);
        addToLog('Initializing items in both directions...');

        const [prevItems, nextItems] = await Promise.all([
          onFetchPrevious(),
          onFetchNext(),
        ]);

        setItems(prev => [...prevItems, ...prev, ...nextItems]);
        setVirtualIndex(prev => prev + prevItems.length);
        translateX.value = -(INITIAL_BUFFER_SIZE + prevItems.length) * SCREEN_WIDTH;

        addToLog(`Initialized with ${prevItems.length + initialItems.length + nextItems.length} items`);
      } catch (error) {
        addToLog('Error initializing items', 'error');
      } finally {
        setIsLoadingPrevious(false);
        setIsLoadingNext(false);
      }
    };

    initializeItems();
  }, []);

  // Logging functions
  const addToLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setDebugLog(prev => [{
      message,
      type,
      timestamp: new Date()
    }, ...prev.slice(0, 19)]);
  }, []);

  // Mount/Unmount tracking
  const handleMount = useCallback((itemId: string) => {
    setMountedItems(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    addToLog(`Mounted: ${itemId}`, 'mount');
  }, [addToLog]);

  const handleUnmount = useCallback((itemId: string) => {
    setMountedItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    addToLog(`Unmounted: ${itemId}`, 'unmount');
  }, [addToLog]);

  // Fetch new items when needed
  const fetchItems = useCallback(async (direction: 'next' | 'previous') => {
    if ((direction === 'next' && isLoadingNext) || 
        (direction === 'previous' && isLoadingPrevious)) {
      return;
    }

    try {
      direction === 'next' ? setIsLoadingNext(true) : setIsLoadingPrevious(true);
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
        // Adjust position when adding items to the beginning
        setVirtualIndex(prev => prev + newItems.length);
        translateX.value = translateX.value - (newItems.length * SCREEN_WIDTH);
      }
    } catch (error) {
      addToLog(`Error fetching ${direction} items`, 'error');
    } finally {
      direction === 'next' ? setIsLoadingNext(false) : setIsLoadingPrevious(false);
    }
  }, [onFetchNext, onFetchPrevious, isLoadingNext, isLoadingPrevious]);

  // Generate visible items based on current position
  const visibleItems = useMemo(() => {
    const start = virtualIndex - VISIBLE_ITEMS_THRESHOLD;
    const end = virtualIndex + VISIBLE_ITEMS_THRESHOLD;
    
    const visible = [];
    for (let i = start; i <= end; i++) {
      if (i >= 0 && i < items.length) {
        visible.push({
          virtualIndex: i,
          item: items[i],
        });
      }
    }
    return visible;
  }, [virtualIndex, items]);

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
      runOnJS(addToLog)(`Swiped to index: ${newVirtualIndex}`);
    });

  // Check if we need to fetch more items
  useEffect(() => {
    const needsNext = virtualIndex + VISIBLE_ITEMS_THRESHOLD >= items.length;
    const needsPrevious = virtualIndex - VISIBLE_ITEMS_THRESHOLD <= 0;

    if (needsNext && !isLoadingNext) {
      fetchItems('next');
    }
    if (needsPrevious && !isLoadingPrevious) {
      fetchItems('previous');
    }
  }, [virtualIndex, items.length]);

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
                position: 'absolute',
                left: (Math.max(0, virtualIndex - VISIBLE_ITEMS_THRESHOLD - 1)) * SCREEN_WIDTH,
              }}
            >
              <Text className="text-white">Loading previous...</Text>
            </View>
          )}

          {visibleItems.map(({ item, virtualIndex }) => (
            <View
              key={item.id}
              className="w-screen items-center justify-center"
              style={{
                position: 'absolute',
                left: virtualIndex * SCREEN_WIDTH,
              }}
            >
              {renderItem({ item, virtualIndex })}
            </View>
          ))}

          {/* Loading indicator for next items */}
          {isLoadingNext && (
            <View 
              className="w-screen items-center justify-center"
              style={{
                position: 'absolute',
                left: (Math.min(items.length - 1, virtualIndex + VISIBLE_ITEMS_THRESHOLD + 1)) * SCREEN_WIDTH,
              }}
            >
              <Text className="text-white">Loading next...</Text>
            </View>
          )}
        </Animated.View>
      </GestureDetector>

      {/* Debug overlay */}
      <View className="absolute top-4 right-4 bg-black/80 rounded-lg p-2">
        <Text className="text-white text-xs">
          Mounted Items: {mountedItems.size}
        </Text>
        <Text className="text-white text-xs mt-1">
          Virtual Index: {virtualIndex}
        </Text>
        <Text className="text-white text-xs mt-1">
          Total Items: {items.length}
        </Text>
      </View>

      {/* Debug log */}
      <ScrollView 
        className="absolute bottom-0 left-0 right-0 bg-black/80 h-32"
        contentContainerClassName="p-2"
      >
        {debugLog.map((entry, index) => (
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
    </View>
  );
}

export default InfiniteSwiperWithFetch;