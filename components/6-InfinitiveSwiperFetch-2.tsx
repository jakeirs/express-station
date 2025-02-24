import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Dimensions, ActivityIndicator } from 'react-native';
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
const FETCH_THRESHOLD = 3;

// Rich mock data generation
const CATEGORIES = ['Nature', 'Technology', 'Art', 'Science', 'Travel'];
const DESCRIPTIONS = [
  'Exploring the wonders of our natural world',
  'Breaking new ground in innovation',
  'Expressing creativity through visual medium',
  'Discovering the mysteries of the universe',
  'Adventure awaits around every corner',
];
const TAGS = [
  ['wildlife', 'ecosystem', 'environment'],
  ['innovation', 'digital', 'future'],
  ['creative', 'inspiration', 'design'],
  ['research', 'discovery', 'knowledge'],
  ['adventure', 'exploration', 'culture'],
];
const COLORS = [
  'bg-emerald-500',   // Nature
  'bg-blue-500',      // Technology
  'bg-purple-500',    // Art
  'bg-indigo-500',    // Science
  'bg-amber-500',     // Travel
];

// Generate a rich item with varied content
const generateRichItem = (id) => {
  const categoryIndex = Math.abs(id % CATEGORIES.length);
  const readTime = Math.floor(Math.random() * 10) + 3; // 3-12 minutes
  const likes = Math.floor(Math.random() * 1000) + 100; // 100-1099 likes
  
  return {
    id,
    title: `${CATEGORIES[categoryIndex]} ${Math.abs(id)}`,
    category: CATEGORIES[categoryIndex],
    description: DESCRIPTIONS[categoryIndex],
    tags: TAGS[categoryIndex],
    readTime,
    likes,
    colorClass: COLORS[categoryIndex],
    timestamp: new Date().toISOString(),
    isSubscriberOnly: Math.random() > 0.7, // 30% chance of being premium content
  };
};

// Create our mock database with items centered around 0
const MOCK_DB = {};
for (let i = -20; i <= 20; i++) {
  MOCK_DB[i] = generateRichItem(i);
}

// Mock API functions with artificial delay
const mockFetchNext = async (lastId) => {
  const delay = Math.random() * 1000 + 500;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const newItems = [];
  for (let i = 1; i <= 3; i++) {
    const newId = lastId + i;
    if (newId <= 20) { // Limit to our mock database range
      newItems.push(MOCK_DB[newId]);
    }
  }
  return newItems;
};

const mockFetchPrevious = async (firstId) => {
  const delay = Math.random() * 1000 + 500;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const newItems = [];
  for (let i = 1; i <= 3; i++) {
    const newId = firstId - i;
    if (newId >= -20) { // Limit to our mock database range
      newItems.push(MOCK_DB[newId]);
    }
  }
  return newItems.reverse(); // Maintain correct order
};

// Main Swiper Component
const InfiniteSwiperWithFetch = ({ 
  initialItems, 
  onFetchNext, 
  onFetchPrevious,
  renderItem,
}) => {
  // Component implementation remains the same as before
  const [items, setItems] = useState(initialItems);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  const [virtualIndex, setVirtualIndex] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: items.length - 1 });

  const translateX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  // Fetch implementation remains the same as before
  const fetchMoreItems = useCallback(async (direction) => {
    try {
      if (direction === 'next' && !isLoadingNext) {
        setIsLoadingNext(true);
        const newItems = await onFetchNext();
        if (newItems.length > 0) {
          setItems(prevItems => [...prevItems, ...newItems]);
        }
        setIsLoadingNext(false);
      } else if (direction === 'previous' && !isLoadingPrevious) {
        setIsLoadingPrevious(true);
        const newItems = await onFetchPrevious();
        if (newItems.length > 0) {
          setItems(prevItems => [...newItems, ...prevItems]);
          setVirtualIndex(prevIndex => prevIndex + newItems.length);
        }
        setIsLoadingPrevious(false);
      }
    } catch (error) {
      console.error(`Error fetching ${direction} items:`, error);
      setIsLoadingNext(false);
      setIsLoadingPrevious(false);
    }
  }, [onFetchNext, onFetchPrevious, isLoadingNext, isLoadingPrevious]);

  // Rest of the component implementation remains the same...
  // (Previous implementation of getRealIndex, updateVisibleRange, visibleItems, etc.)

  const getRealIndex = useCallback((virtual) => {
    let real = virtual % items.length;
    if (real < 0) real += items.length;
    return real;
  }, [items.length]);

  const updateVisibleRange = useCallback((currentVirtual) => {
    const start = currentVirtual - VISIBLE_ITEMS_THRESHOLD;
    const end = currentVirtual + VISIBLE_ITEMS_THRESHOLD;
    setVisibleRange({ start, end });
  }, []);

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

  const updateIndex = useCallback((newVirtualIndex) => {
    setVirtualIndex(newVirtualIndex);
    runOnJS(updateVisibleRange)(newVirtualIndex);
  }, [updateVisibleRange]);

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

  useEffect(() => {
    const realIndex = getRealIndex(virtualIndex);
    if (realIndex > items.length - FETCH_THRESHOLD) {
      fetchMoreItems('next');
    } else if (realIndex < FETCH_THRESHOLD) {
      fetchMoreItems('previous');
    }
  }, [virtualIndex, items.length, fetchMoreItems]);

  return (
    <View className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View className="flex-1 flex-row" style={animatedStyle}>
          {isLoadingPrevious && (
            <View 
              className="w-screen items-center justify-center"
              style={{
                width: SCREEN_WIDTH,
                position: 'absolute',
                left: (visibleRange.start - 1) * SCREEN_WIDTH,
              }}
            >
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          )}

          {visibleItems.map(({ virtualIndex, item }) => (
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
                {renderItem({ item, index: virtualIndex })}
              </View>
            </View>
          ))}

          {isLoadingNext && (
            <View 
              className="w-screen items-center justify-center"
              style={{
                width: SCREEN_WIDTH,
                position: 'absolute',
                left: (visibleRange.end + 1) * SCREEN_WIDTH,
              }}
            >
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          )}
        </Animated.View>
      </GestureDetector>

      <View className="flex-row justify-center items-center absolute bottom-5 w-full">
        {items.map((_, index) => (
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

// Demo Component using the Swiper
const SwiperDemo = () => {
  // Start with items -2 to 2 as initial data
  const [initialItems] = useState(
    [-2, -1, 0, 1, 2].map(id => MOCK_DB[id])
  );

  const fetchNextItems = async () => {
    const lastItem = initialItems[initialItems.length - 1];
    console.log('Fetching next items after ID:', lastItem.id);
    const newItems = await mockFetchNext(lastItem.id);
    console.log('Received new items:', newItems.length);
    return newItems;
  };

  const fetchPreviousItems = async () => {
    const firstItem = initialItems[0];
    console.log('Fetching previous items before ID:', firstItem.id);
    const newItems = await mockFetchPrevious(firstItem.id);
    console.log('Received new items:', newItems.length);
    return newItems;
  };

  const renderItem = ({ item }) => (
    <View className={`flex-1 ${item.colorClass} w-full p-6`}>
      <View className="flex-1 justify-between">
        <View>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-2xl font-bold">
              {item.title}
            </Text>
            {item.isSubscriberOnly && (
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-white text-sm">Premium</Text>
              </View>
            )}
          </View>
          
          <Text className="text-white/80 mb-4">
            {item.description}
          </Text>
          
          <View className="flex-row flex-wrap gap-2 mb-4">
            {item.tags.map((tag, index) => (
              <View key={index} className="bg-white/10 px-3 py-1 rounded-full">
                <Text className="text-white text-sm">#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View className="bg-white/10 p-4 rounded-lg">
          <View className="flex-row justify-between mb-2">
            <Text className="text-white/70 text-sm">
              {item.readTime} min read
            </Text>
            <Text className="text-white/70 text-sm">
              {item.likes} likes
            </Text>
          </View>
          <Text className="text-white/70 text-sm">
            ID: {item.id} • Generated: {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      <InfiniteSwiperWithFetch
        initialItems={initialItems}
        onFetchNext={fetchNextItems}
        onFetchPrevious={fetchPreviousItems}
        renderItem={renderItem}
      />
    </View>
  );
};

export default SwiperDemo;