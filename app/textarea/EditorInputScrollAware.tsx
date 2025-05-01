import React, { useState } from 'react';
import { View, Text, TextInput, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const KeyboardAwareScrollViewExample = () => {
  const [messages, setMessages] = useState<string[]>([
    'Hello there!',
    'Welcome to the KeyboardAwareScrollView example',
    'This demonstrates a sticky input at the bottom',
    'The input stays at the bottom and moves with the keyboard',
    'The input stays at the bottom and moves with the keyboard',
    'The input stays at the bottom and moves with the keyboard',
    'The input stays at the bottom and moves with the keyboard',
    'The input stays at the bottom and moves with the keyboard',
    'The input stays at the bottom and moves with the keyboard',
    'Try typing a message below',
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      setMessages([...messages, inputText.trim()]);
      setInputText('');
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1">
        <Text className="p-4 text-xl font-bold">KeyboardAwareScrollView Example</Text>

        {/* Main content area with messages */}
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          extraScrollHeight={Platform.OS === 'ios' ? 30 : 20}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="p-4 pb-20" // Add padding at bottom for the input
          className="flex-1">
          {messages.map((message, index) => (
            <View
              key={index}
              className={`mb-4 max-w-[80%] rounded-lg p-3 ${
                index % 2 === 0 ? 'self-end bg-blue-100' : 'self-start bg-gray-100'
              }`}>
              <Text>{message}</Text>
            </View>
          ))}
        </KeyboardAwareScrollView>

        {/* Sticky input at the bottom */}
        <View className="absolute bottom-0 left-0 right-0 flex-row items-center border-t border-gray-200 bg-white p-2">
          <TextInput
            className="mr-2 flex-1 rounded-full border border-gray-300 px-4 py-2"
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-blue-500"
            onPress={handleSend}>
            <Text className="font-bold text-white">→</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default KeyboardAwareScrollViewExample;
