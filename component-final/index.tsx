import React, { useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import Top from './components/Top';

const App = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Example event dates (add your own logic for real events)
  const eventDates = [
    new Date(), // Today
    new Date(new Date().setDate(new Date().getDate() + 3)), // 3 days from now
    new Date(new Date().setDate(new Date().getDate() + 5)), // 5 days from now
  ];

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    console.log('Selected date:', date);
    // Here you can add your logic to handle the date selection
    // For example, fetch events for the selected date
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <View className="p-5">
        <Text className="text-2xl font-bold text-white">Schedule</Text>
      </View>

      <Top
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        daysToShow={5}
        daysForward={30}
        daysBackward={30}
        eventDates={eventDates}
      />

      <View className="flex-1 p-5">
        <Text className="mb-5 text-lg text-white">Selected: {selectedDate.toDateString()}</Text>
        {/* Your events or schedule content would go here */}
      </View>
    </SafeAreaView>
  );
};

export default App;
