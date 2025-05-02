import React from 'react';
import { View } from 'react-native';
import Editor from './EditorInputScrollAware';

const TextAreaComponent = () => {
  return (
    <View className="flex-1 p-4">
      <Editor />
    </View>
  );
};

export default TextAreaComponent;
