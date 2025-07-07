import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';

/**
 * AlternateImplementation offers an approach to creating a layout with:
 * - Two fixed content views at the top
 * - A third view that fills the remaining space
 */
const AlternateImplementation = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="flex-1 bg-yellow-100" contentContainerClassName="flex-grow">
        <View className="bg-black">
          <Text>Siema eniu</Text>
          <Text>Siema eniu</Text>
          <Text>Siema eniu</Text>
          <Text>Siema eniu</Text>
        </View>

        <View>
          <Text>dwa dwa dwa</Text>
          <Text>dwa dwa dwa</Text>
          <Text>dwa dwa dwa</Text>
          <Text>dwa dwa dwa</Text>
          <Text>dwa dwa dwa</Text>
          <Text>dwa dwa dwa</Text>
          <Text>dwa dwa dwa</Text>
          <Text>dwa dwa dwa</Text>
          <Text>dwa dwa dwa</Text>
        </View>

        <View className="flex-1 flex-grow bg-green-500">
          <Text>trzy trzy</Text>
          <Text>trzy trzy</Text>
          <Text>trzy trzy</Text>
          <Text>trzy trzy</Text>
          <Text>trzy trzy</Text>
          <Text>trzy trzy</Text>
          <Text>trzy trzy</Text>
          <Text>trzy trzy</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AlternateImplementation;
