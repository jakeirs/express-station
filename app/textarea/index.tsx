import React, { useCallback, useState } from 'react';
import {
  TextInput as RNTextInput,
  type TextInputContentSizeChangeEventData,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const ReanimatedTextInput = Animated.createAnimatedComponent(RNTextInput);

interface AnimatedInputText {
  className?: string;
  value?: string;
  placeholder?: string;
  onChangeText?: ((text: string) => void) | undefined;
}

export const AnimatedTextInput = ({
  className,
  value,
  onChangeText,
  placeholder = 'Type a message...',
}: AnimatedInputText) => {
  const inputHeight = useSharedValue(70); // Start with height for 2 lines

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: inputHeight.value,
    };
  });

  const onContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const height = e.nativeEvent.contentSize.height;

      const minHeight = 70;
      const lineBuffer = 30; // Approximate height of one line

      // Determine if content is growing or shrinking
      const isGrowing = height + lineBuffer > inputHeight.value;
      const isShrinking = height + lineBuffer < inputHeight.value;

      if (isGrowing) {
        inputHeight.value = withTiming(height + lineBuffer, { duration: 140 });
      } else if (isShrinking) {
        // Content is shrinking - shrink to content height plus buffer but maintain minimum
        const targetHeight = Math.max(minHeight, height + lineBuffer);
        inputHeight.value = withTiming(targetHeight, { duration: 140 });
      }
    },
    []
  );

  return (
    <ReanimatedTextInput
      className={`bg-white py-2  ${className ? className : ''} `}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      textAlignVertical="top"
      multiline
      onContentSizeChange={onContentSizeChange}
      style={[animatedStyles]}
    />
  );
};
