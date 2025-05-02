import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  type TextInputContentSizeChangeEventData,
  type NativeSyntheticEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(RNTextInput);

const AnimatedTextInputComponent = () => {
  const [inputText, setInputText] = useState('');
  const inputHeight = useSharedValue(80); // Start with height for 2 lines

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: inputHeight.value,
      minHeight: inputHeight.value, // Ensure minimum height for 2 lines
    };
  });

  const onContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const height = e.nativeEvent.contentSize.height;
    console.log('height', height);

    // Always update height based on content, but maintain minimum height
    const newHeight = Math.max(inputHeight.value, height); // Ensure minimum height for 2 lines

    // Use different animations for growing vs shrinking
    if (newHeight > inputHeight.value) {
      // Growing - use faster timing for smooth expansion
      inputHeight.value = withTiming(newHeight, { duration: 140 });
    } else if (newHeight < inputHeight.value) {
      // Shrinking - use slightly slower timing for natural feel
      inputHeight.value = withTiming(newHeight, { duration: 200 });
    }
  };

  const handleKeyPress = (e: any) => {
    console.log('handleKeyPress');

    if (e.nativeEvent.key === 'Enter') {
      console.log('inputHeight.value', inputHeight.value);
      // Add extra height with animation when Enter is pressed
      inputHeight.value = withSpring(inputHeight.value + 20);
    }
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const h = event.nativeEvent.layout.height;

    console.log('h', h);
  };

  return (
    <AnimatedTextInput
      className="mr-2 rounded-xl border border-gray-300 bg-white px-4 py-2"
      value={inputText}
      onChangeText={setInputText}
      placeholder="Type a message..."
      textAlignVertical="top"
      multiline
      onContentSizeChange={onContentSizeChange}
      onKeyPress={handleKeyPress}
      onLayout={onLayout}
      style={[animatedStyles]}
    />
  );
};

export default AnimatedTextInputComponent;
export default AnimatedTextInputComponent;
