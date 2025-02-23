import React, { useState } from 'react';
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

const Swiper = ({
  children,
  onSwipeLeft, // New prop for left swipe callback
  onSwipeRight, // New prop for right swipe callback
}: {
  children: any;
  onSwipeLeft: any;
  onSwipeRight: any;
}) => {
  const items = React.Children.toArray(children).slice(0, 6);
  const [activeIndex, setActiveIndex] = useState(0);

  const translateX = useSharedValue(0);
  const currentIndex = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  const updateActiveIndex = (newIndex) => {
    setActiveIndex(newIndex);
  };

  // Helper function to handle swipe callbacks
  const handleSwipeCallback = (direction) => {
    if (direction === 'left' && onSwipeLeft) {
      onSwipeLeft();
    } else if (direction === 'right' && onSwipeRight) {
      onSwipeRight();
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      const nextPosition = -currentIndex.value * SCREEN_WIDTH + event.translationX;
      const minTranslate = -(items.length - 1) * SCREEN_WIDTH;
      translateX.value = Math.max(minTranslate, Math.min(0, nextPosition));
    })
    .onEnd((event) => {
      isGestureActive.value = false;

      const velocityThreshold = Math.abs(event.velocityX) > 500;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      let newIndex = currentIndex.value;
      let swipeDirection = null;

      if (velocityThreshold || distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          newIndex = Math.max(0, currentIndex.value - 1);
          swipeDirection = 'right';
        } else {
          newIndex = Math.min(items.length - 1, currentIndex.value + 1);
          swipeDirection = 'left';
        }

        // Call the swipe callback if direction changed
        if (swipeDirection && newIndex !== currentIndex.value) {
          runOnJS(handleSwipeCallback)(swipeDirection);
        }
      }

      translateX.value = withSpring(-newIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 100,
        mass: 0.5,
        velocity: event.velocityX,
      });

      currentIndex.value = newIndex;
      runOnJS(updateActiveIndex)(newIndex);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="flex-1">
      <GestureDetector gesture={panGesture}>
        <Animated.View className="flex-1 flex-row" style={animatedStyle}>
          {items.map((item, index) => (
            <View
              key={index}
              className="w-screen items-center justify-center"
              style={{ width: SCREEN_WIDTH }}>
              <View className="h-full w-full">{item}</View>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      <View className="absolute bottom-5 w-full flex-row items-center justify-center">
        {items.map((_, index) => (
          <View
            key={index}
            className={`mx-1 h-2 w-2 rounded-full ${
              activeIndex === index ? 'scale-110 bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </View>
    </View>
  );
};

export default Swiper;
