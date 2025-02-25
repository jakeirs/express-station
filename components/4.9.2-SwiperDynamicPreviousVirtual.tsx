import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Dimensions, ScrollView, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Define our screen dimensions and thresholds
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VISIBLE_ITEMS_THRESHOLD = 2;
const FETCH_THRESHOLD = 4; // How many items from the edge to trigger fetch

export type SwipeDirection = 'next' | 'previous';

// Generic type for item data
export interface ItemData {
  id: string | number;
  [key: string]: any; // Allow for any additional properties
}

// Type for render item function
export type RenderItemFunction<T extends ItemData> = (info: {
  item: T;
  index: number;
}) => React.ReactNode;

// Define our component props
interface SwiperProps<T extends ItemData> {
  initialItems: T[];
  renderItem: RenderItemFunction<T>;
  initialIndex?: number;
  onSwipeEnd?: (info: { 
    direction: SwipeDirection;
    currentIndex: number;
    distanceFromEdge: number;
    shouldFetch: boolean;
  }) => void;
  fetchThreshold?: number; // Override the default threshold
  showDebugPanel?: boolean;
}

// Define visible item structure
interface VisibleItem<T extends ItemData> {
  absoluteIndex: number;
  relativeIndex: number;
  item: T;
}

// Debug component props
interface DebugLogProps<T extends ItemData> {
  log: VisibleItem<T>[];
  absoluteIndex: number;
  relativeIndex: number;
  totalItems: number;
  offset: number;
  gestureActive: boolean;
}

// Debug component to visualize what's happening
function DebugLog<T extends ItemData>({ 
  log, 
  absoluteIndex,
  relativeIndex,
  totalItems,
  offset,
  gestureActive
}: DebugLogProps<T>) {
  const visibleAbsoluteIndices = log.map(item => item.absoluteIndex);
  const visibleRelativeIndices = log.map(item => item.relativeIndex);

  return (
    <ScrollView
      className="absolute bottom-0 left-0 right-0 h-32 bg-black/80"
      contentContainerClassName="p-2">
      <Text className="mb-1 text-xs text-white">Absolute Indices:</Text>
      <View className="mb-2 flex flex-row">
        {visibleAbsoluteIndices.map((entry, index) => (
          <Text key={index} className="mr-1 text-xs text-green-400">
            {entry}{' '}
          </Text>
        ))}
      </View>

      <Text className="mb-1 text-xs text-white">Relative Indices:</Text>
      <View className="mb-2 flex flex-row">
        {visibleRelativeIndices.map((entry, index) => (
          <Text key={index} className="mr-1 text-xs text-blue-400">
            {entry}{' '}
          </Text>
        ))}
      </View>

      <Text className="text-xs text-red-400">Current Absolute Index: {absoluteIndex}</Text>
      <Text className="text-xs text-purple-400">Current Relative Index: {relativeIndex}</Text>
      <Text className="text-xs text-orange-400">Offset: {offset}</Text>
      <Text className="text-xs text-blue-400">Total Items: {totalItems}</Text>
      <Text className="text-xs text-yellow-400">Gesture Active: {gestureActive ? 'Yes' : 'No'}</Text>
    </ScrollView>
  );
}

// Main Swiper component with generic type support
function Swiper<T extends ItemData>({
  initialItems,
  renderItem,
  initialIndex = 0,
  onSwipeEnd,
  fetchThreshold = FETCH_THRESHOLD,
  showDebugPanel = false,
}: SwiperProps<T>) {
  // We need to track the original data
  const [items, setItems] = useState<T[]>(initialItems);
  
  // This tracks the offset between absolute and relative indices
  // When items are prepended, this value increases
  const [offset, setOffset] = useState(0);
  
  // Track if gesture is active for UI display
  const [isGestureActiveState, setIsGestureActiveState] = useState(false);
  
  // Store previous items array for comparison
  const prevItemsRef = useRef<T[]>(initialItems);
  
  // Current absolute position - this doesn't change when items are prepended
  const absoluteIndex = useSharedValue(initialIndex);
  
  // Current relative index in the array - this is calculated from absoluteIndex and offset
  const [relativeIndex, setRelativeIndex] = useState(initialIndex);
  
  // The translation value for animations
  const translateX = useSharedValue(-absoluteIndex.value * SCREEN_WIDTH);
  
  // Gesture state
  const isGestureActive = useSharedValue(false);
  
  // This updates the React state when the absolute index changes
  const updateRelativeIndex = useCallback(() => {
    const newRelativeIndex = absoluteIndex.value - offset;
    setRelativeIndex(newRelativeIndex);
  }, [offset]);
  
  // Monitor absoluteIndex for changes
  useAnimatedReaction(
    () => absoluteIndex.value,
    (current, previous) => {
      if (current !== previous && previous !== null) {
        runOnJS(updateRelativeIndex)();
      }
    }
  );
  
  // Update items when initialItems changes
  useEffect(() => {
    if (initialItems === prevItemsRef.current) {
      return; // No change, skip update
    }
    
    const oldItems = prevItemsRef.current;
    const newItems = initialItems;
    
    // If items were prepended, we need to update our offset
    if (oldItems.length > 0 && newItems.length > oldItems.length) {
      // Find the position of the first old item in the new array
      const firstOldItemId = oldItems[0].id;
      let firstOldItemNewIndex = -1;
      
      for (let i = 0; i < newItems.length; i++) {
        if (newItems[i].id === firstOldItemId) {
          firstOldItemNewIndex = i;
          break;
        }
      }
      
      if (firstOldItemNewIndex > 0) {
        // Update offset by the number of prepended items
        setOffset(prevOffset => prevOffset + firstOldItemNewIndex);
      }
    }
    
    // Update items and reference
    setItems(newItems);
    prevItemsRef.current = newItems;
  }, [initialItems]);
  
  // Calculate which items should be visible
  const getVisibleItems = useCallback((): VisibleItem<T>[] => {
    const visibleItems: VisibleItem<T>[] = [];
    
    // Convert absolute index to relative index for array access
    const currentRelativeIndex = absoluteIndex.value - offset;
    
    // Calculate the visible range in relative indices
    const startRelativeIdx = Math.max(0, currentRelativeIndex - VISIBLE_ITEMS_THRESHOLD);
    const endRelativeIdx = Math.min(items.length - 1, currentRelativeIndex + VISIBLE_ITEMS_THRESHOLD);
    
    for (let relIdx = startRelativeIdx; relIdx <= endRelativeIdx; relIdx++) {
      if (items[relIdx]) { // Safety check
        // Convert back to absolute index for positioning
        const absIdx = relIdx + offset;
        
        visibleItems.push({
          absoluteIndex: absIdx,
          relativeIndex: relIdx,
          item: items[relIdx],
        });
      }
    }
    
    return visibleItems;
  }, [items, offset, absoluteIndex]);
  
  // Get visible items
  const visibleItems = useMemo(() => getVisibleItems(), [getVisibleItems]);
  
  // Handle fetch checking based on current position
  const checkFetchNeeded = useCallback((direction: SwipeDirection, absIdx: number) => {
    if (!onSwipeEnd) return;
    
    // Convert to relative index for array-based calculations
    const relIdx = absIdx - offset;
    
    const distanceFromEdge = direction === 'next'
      ? items.length - relIdx - 1  // Distance to end in relative terms
      : relIdx;                    // Distance to start in relative terms
    
    const shouldFetch = distanceFromEdge <= fetchThreshold;
    
    onSwipeEnd({
      direction,
      currentIndex: relIdx,
      distanceFromEdge,
      shouldFetch
    });
  }, [items.length, offset, fetchThreshold, onSwipeEnd]);
  
  // Pan gesture handler
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isGestureActive.value = true;
      runOnJS(setIsGestureActiveState)(true);
    })
    .onUpdate((event) => {
      // Calculate new position based on absolute index
      const newPosition = -absoluteIndex.value * SCREEN_WIDTH + event.translationX;
      
      // Get relative index bounds
      const minRelativeIndex = 0;
      const maxRelativeIndex = items.length - 1;
      
      // Convert to absolute bounds
      const minAbsoluteTranslate = -(maxRelativeIndex + offset) * SCREEN_WIDTH;
      const maxAbsoluteTranslate = -(minRelativeIndex + offset) * SCREEN_WIDTH;
      
      // Apply constraints
      translateX.value = Math.max(minAbsoluteTranslate, Math.min(maxAbsoluteTranslate, newPosition));
    })
    .onEnd((event) => {
      // Determine if we should change index
      const velocityThreshold = Math.abs(event.velocityX) > 500;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      
      let newAbsoluteIndex = absoluteIndex.value;
      let direction: SwipeDirection | undefined;
      
      if (velocityThreshold || distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          // Move backward
          const newRelativeIndex = Math.max(0, (absoluteIndex.value - offset) - 1);
          newAbsoluteIndex = newRelativeIndex + offset;
          
          if (absoluteIndex.value !== newAbsoluteIndex) {
            direction = 'previous';
          }
        } else {
          // Move forward
          const newRelativeIndex = Math.min(items.length - 1, (absoluteIndex.value - offset) + 1);
          newAbsoluteIndex = newRelativeIndex + offset;
          
          if (absoluteIndex.value !== newAbsoluteIndex) {
            direction = 'next';
          }
        }
      }
      
      // Animate to new position
      translateX.value = withSpring(-newAbsoluteIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 100,
        mass: 0.5,
        velocity: event.velocityX,
        restSpeedThreshold: 0.5,
      });
      
      // Update absolute index if changed
      if (newAbsoluteIndex !== absoluteIndex.value) {
        absoluteIndex.value = newAbsoluteIndex;
        
        // Check if we need to fetch more data
        if (direction) {
          runOnJS(checkFetchNeeded)(direction, newAbsoluteIndex);
        }
      }
      
      // Mark gesture as inactive
      isGestureActive.value = false;
      runOnJS(setIsGestureActiveState)(false);
    })
    .onFinalize(() => {
      // Ensure gesture is properly cleaned up
      isGestureActive.value = false;
      runOnJS(setIsGestureActiveState)(false);
    });
  
  // Animated style for transitions
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  return (
    <View className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View className="flex-1 flex-row" style={animatedStyle}>
          {visibleItems.map(({ absoluteIndex: absIdx, item }) => (
            <View
              key={item.id ?? absIdx}
              className="w-screen items-center justify-center"
              style={{
                width: SCREEN_WIDTH,
                position: 'absolute',
                left: absIdx * SCREEN_WIDTH,
              }}>
              <View className="h-full w-full">
                {renderItem({ item, index: absIdx - offset })}
              </View>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>
      
      {/* Pagination indicators */}
      <View className="absolute top-10 w-full flex-row items-center justify-center">
        {items.length > 0 && items.map((_, index) => (
          <View
            key={index}
            className={`mx-1 h-2 w-2 rounded-full ${
              relativeIndex === index ? 'scale-110 bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </View>
      
      {/* Debug panel */}
      {showDebugPanel && (
        <DebugLog 
          log={visibleItems}
          absoluteIndex={absoluteIndex.value}
          relativeIndex={relativeIndex}
          totalItems={items.length}
          offset={offset}
          gestureActive={isGestureActiveState}
        />
      )}
    </View>
  );
}

export default Swiper;