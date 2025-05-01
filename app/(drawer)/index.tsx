import { Stack } from 'expo-router';
import { View, Text, TextInput } from 'react-native';

import { Container } from '~/components/Container';
import { ScreenContent } from '~/components/ScreenContent';
import KeyboardAwareScrollViewExample from '~/app/textarea/EditorInputScrollAware';
import StackOverFlow from '../textarea/StackOverFlow';
import { useState } from 'react';

export default function Home() {
  const [inputText, setInputText] = useState('');
  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container>
        {/* <KeyboardAwareScrollViewExample /> */}
        <StackOverFlow>
          <View className="min-h-[500px] bg-black"></View>
          <TextInput
            className="mr-2 min-h-[200px] rounded-full border border-gray-300 px-4 py-2"
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            textAlignVertical="top"
            multiline
          />
        </StackOverFlow>
      </Container>
    </>
  );
}
