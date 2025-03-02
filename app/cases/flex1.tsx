import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';

/**
 * AlternateImplementation offers another approach to creating a layout with:
 * - A fixed-height component (Item1)
 * - A component that fills remaining space (Item2)
 * - Full screen scrolling when content exceeds the screen
 *
 * This implementation uses dynamic measurements instead of fixed calculations.
 */
const AlternateImplementation = () => {
  // Get the screen dimensions
  const { height: screenHeight } = Dimensions.get('window');

  // Track the height of Item1 to calculate the remaining space
  const [item1Height, setItem1Height] = useState(0);

  // Create expandable content
  const [extraItems, setExtraItems] = useState([]);

  const addMoreContent = () => {
    setExtraItems([...extraItems, extraItems.length + 1]);
  };

  // Calculate approximate remaining height based on item1's measured height
  // Add some buffer for padding/margins
  const remainingHeight = Math.max(screenHeight - item1Height - 300, 300);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="p-4">
        {/* Item 1: Fixed height component */}
        <View
          className="mb-4 rounded-xl bg-purple-600 p-4"
          // Use onLayout to dynamically measure the height of Item1
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setItem1Height(height);
          }}>
          <Text className="mb-2 text-2xl font-bold text-white">Item 1</Text>
          <Text className="mb-4 text-white">
            This component has its own intrinsic height based on content. We measure this height
            dynamically to calculate the space for Item2.
          </Text>

          <View className="mb-4 rounded-lg bg-white/20 p-3">
            <Text className="text-sm text-white">
              This approach uses React Native's onLayout to measure components and calculate
              remaining space dynamically, which can be more flexible than hard-coded heights.
            </Text>
          </View>

          <TouchableOpacity
            className="items-center rounded-lg bg-purple-800 p-3"
            onPress={addMoreContent}>
            <Text className="font-bold text-white">Add more content to Item 2</Text>
          </TouchableOpacity>
        </View>

        {/* Item 2: Takes remaining space or grows based on content */}
        <View
          className="rounded-xl bg-amber-500 p-4"
          // Use the dynamically calculated height as a minimum
          style={{ minHeight: remainingHeight }}>
          <Text className="mb-3 text-2xl font-bold text-white">Item 2</Text>
          <Text className="mb-3 text-2xl font-bold text-white">Item 2</Text>
          <Text className="mb-3 text-2xl font-bold text-white">Item 2</Text>
          <Text className="mb-3 text-2xl font-bold text-white">Item 2</Text>
          <Text className="mb-3 text-2xl font-bold text-white">Item 2</Text>
          <Text className="mb-3 text-2xl font-bold text-white">Item 2</Text>
          <Text className="mb-3 text-2xl font-bold text-white">Item 2</Text>
          <Text className="mb-3 text-2xl font-bold text-white">Item 2</Text>
          <Text className="mb-3 text-2xl font-bold text-white">Item 2</Text>
          <Text className="mb-3 text-2xl font-bold text-white">Item 2</Text>

          {/* Additional content to demonstrate scrolling */}
          {extraItems.map((item) => (
            <View key={item} className="mt-3 rounded-lg bg-amber-700 p-4">
              <Text className="text-white">
                Extra content item {item}. As you add more items, the content will expand and the
                screen will become scrollable.
              </Text>
            </View>
          ))}

          {extraItems.length === 0 && (
            <Text className="mt-8 text-center italic text-white">
              Press the button above to add content and see how scrolling works
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AlternateImplementation;
