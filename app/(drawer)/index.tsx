import { Stack } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  type TextInputContentSizeChangeEventData,
  type NativeSyntheticEvent,
} from 'react-native';

import { Container } from '~/components/Container';
import { ScreenContent } from '~/components/ScreenContent';
import KeyboardAwareScrollViewExample from '~/app/textarea/EditorInputScrollAware';
import StackOverFlow from '../textarea/StackOverFlow';
import { useState } from 'react';
import Slider from '../textarea/ReanimatedInput';
import DOMComponent from '../textarea/LexicalExpo';
import Editor from '../textarea/dom-components/hello-dom';

export default function Home() {
  const [inputText, setInputText] = useState('');

  const onContentSizeChange = (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    const height = e.nativeEvent.contentSize.height;
    console.log('height', height);
  };

  const [editorState, setEditorState] = useState<string | null>(null);
  const [plainText, setPlainText] = useState('');

  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <Container>
        {/* <KeyboardAwareScrollViewExample /> */}
        {/* <StackOverFlow>
          <View className="min-h-[500px] bg-black"></View>
          <TextInput
            className="mr-2 min-h-[200px] rounded-xl border border-gray-300 bg-white px-4 py-2"
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            textAlignVertical="top"
            multiline
            onContentSizeChange={onContentSizeChange}
          />
        </StackOverFlow> */}
        {/* <Slider /> */}
        <StackOverFlow>
          <View className="flex-1">
            <View className="h-[900px] bg-green-500"></View>
            <TextInput
              className="mr-2 min-h-[200px] rounded-xl border border-gray-300 bg-white px-4 py-2"
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              textAlignVertical="top"
              multiline
              onContentSizeChange={onContentSizeChange}
            />
            {/* <Editor setPlainText={setPlainText} setEditorState={setEditorState} /> */}
          </View>
        </StackOverFlow>
      </Container>
    </>
  );
}
