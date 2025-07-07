import React from 'react';
import { View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft
} from 'react-native-reanimated';
import { useTabSlot, TabSlotProps } from 'expo-router/ui';

interface AnimatedTabSlotProps extends TabSlotProps {
  animationType?: 'fade' | 'slide' | 'scale';
  duration?: number;
}

export function AnimatedTabSlot({ 
  animationType = 'fade', 
  duration = 300,
  ...props 
}: AnimatedTabSlotProps) {
  const slot = useTabSlot(props);

  const getEnteringAnimation = () => {
    switch (animationType) {
      case 'slide':
        return SlideInRight.duration(duration);
      case 'fade':
        return FadeIn.duration(duration);
      case 'scale':
        return FadeIn.duration(duration);
      default:
        return FadeIn.duration(duration);
    }
  };

  const getExitingAnimation = () => {
    switch (animationType) {
      case 'slide':
        return SlideOutLeft.duration(duration);
      case 'fade':
        return FadeOut.duration(duration);
      case 'scale':
        return FadeOut.duration(duration);
      default:
        return FadeOut.duration(duration);
    }
  };

  return (
    <Animated.View 
      style={{ flex: 1 }}
      entering={getEnteringAnimation()}
      exiting={getExitingAnimation()}
      key={slot.key}
    >
      {slot}
    </Animated.View>
  );
}
