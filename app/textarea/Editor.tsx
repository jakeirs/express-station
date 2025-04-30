import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Custom hook for keyboard avoiding logic
const useKeyboardAvoiding = () => {
  const [text, setText] = useState('');

  const handleTextChange = (newText: string) => {
    setText(newText);
  };

  return {
    text,
    handleTextChange,
  };
};

const KeyboardAvoidingExample = () => {
  const { text, handleTextChange } = useKeyboardAvoiding();

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 p-4">
        <Text className="mb-4 text-xl font-bold">KeyboardAvoidingView Example</Text>

        <View className="mb-4 flex-row space-x-2">
          <Pressable
            className="flex-1 rounded-md bg-blue-500 p-3"
            onPress={() => router.push('/textarea/sticky-input')}>
            <Text className="text-center font-medium text-white">Sticky Input Example</Text>
          </Pressable>

          <Pressable
            className="flex-1 rounded-md bg-blue-500 p-3"
            onPress={() => router.push('/textarea/floating-input')}>
            <Text className="text-center font-medium text-white">Floating Input Example</Text>
          </Pressable>
        </View>

        <Text className="mb-2 text-gray-700">
          This example demonstrates how KeyboardAvoidingView works with TextInput. The view adjusts
          its height or position based on the keyboard height.
        </Text>

        {/* KeyboardAvoidingView wraps the scrollable content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 50}>
          <ScrollView className="flex-1">
            {/* Adding some content to demonstrate scrolling */}
            {Array.from({ length: 10 }).map((_, index) => (
              <View key={index} className="mb-4 rounded-md bg-gray-100 p-4">
                <Text>Scrollable content item {index + 1}</Text>
              </View>
            ))}

            {/* TextInput at the bottom of the scrollable content */}
            <View className="mb-4 rounded-md bg-white p-4 shadow-sm">
              <TextInput
                className="min-h-[100px] rounded-md border border-gray-300 p-3"
                multiline
                value={text}
                onChangeText={handleTextChange}
                placeholder="Type something here..."
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default KeyboardAvoidingExample;
