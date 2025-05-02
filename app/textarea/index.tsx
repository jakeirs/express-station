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
  const inputHeight = useSharedValue(100); // Start with height for 2 lines
  const lastContentHeight = useSharedValue(0); // Track the last content height

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: inputHeight.value,
      minHeight: inputHeight.value, // Ensure minimum height for 2 lines
    };
  });

  const onContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const height = e.nativeEvent.contentSize.height;
    console.log('height', height, inputHeight.value);

    // Determine if content is growing or shrinking
    const isGrowing = height > lastContentHeight.value;
    const isShrinking = height < lastContentHeight.value;

    // Update the last content height
    lastContentHeight.value = height;

    // Maintain minimum height of 70 and always keep a buffer of one line (20px) when shrinking
    const minHeight = 70;
    const lineBuffer = 30; // Approximate height of one line

    if (isGrowing && height > inputHeight.value) {
      // Content is growing and exceeds current height - expand
      inputHeight.value = withTiming(height + lineBuffer, { duration: 140 });
      console.log('height + lineBuffer', height + lineBuffer);
    } else if (isShrinking) {
      // Content is shrinking - shrink to content height plus buffer but maintain minimum
      const targetHeight = Math.max(minHeight, height + lineBuffer);
      inputHeight.value = withTiming(targetHeight, { duration: 200 });
    }
  };

  const handleKeyPress = (e: any) => {
    // console.log('handleKeyPress');
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
