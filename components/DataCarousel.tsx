import React, { useState } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const Swiper = ({ children }) => {
  // Convert children to array and ensure we have exactly 6 items
  const items = React.Children.toArray(children).slice(0, 6);
  const [activeIndex, setActiveIndex] = useState(0);

  const translateX = useSharedValue(0);
  const currentIndex = useSharedValue(0);

  const updateActiveIndex = (newIndex) => {
    setActiveIndex(newIndex);
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      const newPosition = context.startX + event.translationX;
      const minTranslate = -(items.length - 1) * SCREEN_WIDTH;
      translateX.value = Math.max(minTranslate, Math.min(0, newPosition));
    },
    onEnd: (event) => {
      const velocityThreshold = Math.abs(event.velocityX) > 500;
      const distanceThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      
      let newIndex = currentIndex.value;

      if (velocityThreshold || distanceThreshold) {
        if (event.velocityX > 0 || event.translationX > 0) {
          newIndex = Math.max(0, currentIndex.value - 1);
        } else {
          newIndex = Math.min(items.length - 1, currentIndex.value + 1);
        }
      }

      translateX.value = withSpring(-newIndex * SCREEN_WIDTH, {
        damping: 20,
        stiffness: 100,
      });
      currentIndex.value = newIndex;
      runOnJS(updateActiveIndex)(newIndex);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="flex-1">
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View className="flex-1 flex-row" style={animatedStyle}>
          {items.map((item, index) => (
            <View 
              key={index} 
              className="w-screen items-center justify-center"
              style={{ width: SCREEN_WIDTH }} // Ensure exact screen width
            >
              {/* Wrapper to make children take full width */}
              <View className="w-full h-full">
                {item}
              </View>
            </View>
          ))}
        </Animated.View>
      </PanGestureHandler>
      
      {/* Pagination indicators */}
      <View className="flex-row justify-center items-center absolute bottom-5 w-full">
        {items.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              activeIndex === index 
                ? 'bg-white scale-110' 
                : 'bg-white/50'
            }`}
          />
        ))}
      </View>
    </View>
  );
};

export default Swiper;

// Usage Example:
/*
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View className="flex-1">
      <Swiper>
        <View className="flex-1 bg-pink-500 w-full">
          <Text className="text-white">Slide 1</Text>
        </View>
        <View className="flex-1 bg-purple-500 w-full">
          <Text className="text-white">Slide 2</Text>
        </View>
        // ... Add more slides up to 6
      </Swiper>
    </View>
  );
}
*/