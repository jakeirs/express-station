import React, { useState } from 'react';
import { Stack } from 'expo-router';
import {
  View,
  Text,
  TextInput as RNTextInput,
  type TextInputContentSizeChangeEventData,
  type NativeSyntheticEvent,
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
  const inputHeight = useSharedValue(70); // Start with height for 2 lines

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: inputHeight.value,
      minHeight: 70, // Ensure minimum height for 2 lines
    };
  });

  const onContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const height = e.nativeEvent.contentSize.height;
    console.log('height', height);

    // Update height if content requires more space
    if (height > inputHeight.value) {
      inputHeight.value = withTiming(Math.max(70, height), { duration: 150 });
    }
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
      style={[animatedStyles]}
    />
  );
};

export default AnimatedTextInputComponent;
