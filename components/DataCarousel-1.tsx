import React, { useState } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Screen width is used to calculate swipe thresholds and slide dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const Swiper = ({ children }) => {
  // We ensure exactly 6 items by slicing the children array
  const items = React.Children.toArray(children).slice(0, 6);
  const [activeIndex, setActiveIndex] = useState(0);

  // Shared values for animations
  const translateX = useSharedValue(0);
  const currentIndex = useSharedValue(0);
  const isGestureActive = useSharedValue(false);

  // Updates the visual indicator of which slide is active
  const updateActiveIndex = (newIndex) => {
    setActiveIndex(newIndex);
  };

  // The new Gesture.Pan() implementation provides a more declarative API
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      // Calculate the new position while ensuring we stay within boundaries
      const nextPosition = -currentIndex.value * SCREEN_WIDTH + event.translationX;
      const minTranslate = -(items.length - 1) * SCREEN_WIDTH;
      translateX.value = Math.max(minTranslate, Math.min(0, nextPosition));
    })
    .onEnd((event) => {
      isGestureActive.value = false;

      // Determine if the swipe should trigger a slide change
      const velocityThreshold = Math.abs(event.velocityX) > 500;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      let newIndex = currentIndex.value;

      if (velocityThreshold || distanceThreshold) {
        // Calculate direction and update index accordingly
        if (event.velocityX > 0 || event.translationX > 0) {
          // Swipe right - go to previous slide
          newIndex = Math.max(0, currentIndex.value - 1);
        } else {
          // Swipe left - go to next slide
          newIndex = Math.min(items.length - 1, currentIndex.value + 1);
        }
      }

      // Animate to the final position with spring physics
      translateX.value = withSpring(-newIndex * SCREEN_WIDTH, {
        damping: 20, // Controls how quickly the spring stops
        stiffness: 100, // Controls how rigid the spring feels
        mass: 0.5, // Adds a bit more responsiveness
        velocity: event.velocityX, // Uses the gesture velocity for natural feel
      });

      currentIndex.value = newIndex;
      runOnJS(updateActiveIndex)(newIndex);
    });

  // Animated style for smooth transitions
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
              {/* Wrapper ensures children take full width and height */}
              <View className="h-full w-full">{item}</View>
            </View>
          ))}
        </Animated.View>
      </GestureDetector>

      {/* Pagination indicators show current position */}
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
