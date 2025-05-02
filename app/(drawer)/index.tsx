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

import { Container } from '~/components/Container';
import { ScreenContent } from '~/components/ScreenContent';
import KeyboardAwareScrollViewExample from '~/app/textarea/EditorInputScrollAware';
import StackOverFlow from '../textarea/StackOverFlow';
import { useState, useRef } from 'react';
import Slider from '../textarea/ReanimatedInput';
import DOMComponent from '../textarea/LexicalExpo';
import Editor from '../textarea/dom-components/hello-dom';
import AnimatedTextInputComponent from '../textarea';

// Create animated TextInput component
const AnimatedTextInput = Animated.createAnimatedComponent(RNTextInput);

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container>
        {/* <KeyboardAwareScrollViewExample /> */}
        {/* <StackOverFlow>
          <View className="min-h-[500px] bg-black"></View>
            <AnimatedTextInput
              className="mr-2 rounded-xl border border-gray-300 bg-white px-4 py-2"
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              textAlignVertical="top"
              multiline
              onContentSizeChange={onContentSizeChange}
              onKeyPress={handleKeyPress}
              style={animatedStyles}
            />
        </StackOverFlow> */}
        {/* <Slider /> */}
        <StackOverFlow>
          <View className="flex-1">
            <View className="h-[200px] bg-green-500"></View>
            <View className="h-[400px] bg-black"></View>
            <AnimatedTextInputComponent />
            {/* <Editor setPlainText={setPlainText} setEditorState={setEditorState} /> */}
          </View>
        </StackOverFlow>
      </Container>
    </>
  );
}
