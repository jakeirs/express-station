'use dom';

import React from 'react';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet, TextInput, View, useColorScheme } from 'react-native';

export default function DOMComponent({ name }: { name: string }) {
  return (
    <div>
      <h1>Hello {name}</h1>
    </div>
  );
}
