import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { format, addDays, subDays, isToday, isSameDay } from 'date-fns';
import Swiper from '../swiper';

// Get screen width for calculations
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Type definitions
interface DateItem {
  id: string;
  date: Date;
  dayName: string;
  dayNumber: string;
  month?: string;
  hasEvents?: boolean;
}

// Grouped date item (represents a slide with multiple dates)
interface DateGroup {
  id: string;
  dates: DateItem[];
}

interface DateCarouselProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  daysToShow?: number;
  daysForward?: number;
  daysBackward?: number;
  eventDates?: Date[];
  showDebugPanel?: boolean;
}

const Top: React.FC<DateCarouselProps> = ({
  selectedDate = new Date(),
  onDateSelect,
  daysToShow = 5,
  daysForward = 30,
  daysBackward = 30,
  eventDates = [],
  showDebugPanel = false,
}) => {
  // Keep track of the central date
  const [centralDate, setCentralDate] = useState(selectedDate);

  // Keep track of the selected date
  const [activeDate, setActiveDate] = useState(selectedDate);

  // Calculate how many groups of days we need
  const totalDays = daysBackward + 1 + daysForward; // +1 for the central date
  const numGroups = Math.ceil(totalDays / daysToShow);

  // Generate individual date items
  const generateDateItems = useCallback(
    (centerDate: Date): DateItem[] => {
      const items: DateItem[] = [];

      // Generate dates backward
      for (let i = daysBackward; i > 0; i--) {
        const date = subDays(centerDate, i);
        items.push({
          id: date.toISOString(),
          date,
          dayName: format(date, 'EEE'),
          dayNumber: format(date, 'd'),
          month: format(date, 'MMM'),
          hasEvents: eventDates.some((eventDate) => isSameDay(eventDate, date)),
        });
      }

      // Add the center date
      items.push({
        id: centerDate.toISOString(),
        date: centerDate,
        dayName: format(centerDate, 'EEE'),
        dayNumber: format(centerDate, 'd'),
        month: format(centerDate, 'MMM'),
        hasEvents: eventDates.some((eventDate) => isSameDay(eventDate, centerDate)),
      });

      // Generate dates forward
      for (let i = 1; i <= daysForward; i++) {
        const date = addDays(centerDate, i);
        items.push({
          id: date.toISOString(),
          date,
          dayName: format(date, 'EEE'),
          dayNumber: format(date, 'd'),
          month: format(date, 'MMM'),
          hasEvents: eventDates.some((eventDate) => isSameDay(eventDate, date)),
        });
      }

      return items;
    },
    [daysBackward, daysForward, eventDates]
  );

  // Group dates into slides
  const generateGroupedDates = useCallback(
    (dateItems: DateItem[]): DateGroup[] => {
      const groups: DateGroup[] = [];

      // Create groups of daysToShow dates
      for (let i = 0; i < dateItems.length; i += daysToShow) {
        const group: DateItem[] = dateItems.slice(i, i + daysToShow);
        groups.push({
          id: `group-${i}`,
          dates: group,
        });
      }

      return groups;
    },
    [daysToShow]
  );

  // Calculate initial date items and groups
  const allDateItems = useMemo(
    () => generateDateItems(centralDate),
    [centralDate, generateDateItems]
  );
  const [dateGroups, setDateGroups] = useState<DateGroup[]>(generateGroupedDates(allDateItems));

  // Find the initial index where the selected date appears
  const initialIndex = useMemo(() => {
    // Find which group contains the selected date
    return dateGroups.findIndex((group) =>
      group.dates.some((dateItem) => isSameDay(dateItem.date, selectedDate))
    );
  }, [dateGroups, selectedDate]);

  // Handle date selection when an item is tapped
  const handleDatePress = useCallback(
    (date: Date) => {
      setActiveDate(date);
      if (onDateSelect) {
        onDateSelect(date);
      }
    },
    [onDateSelect]
  );

  // Handle when the user swipes and reaches near the end
  const handleSwipeEnd = useCallback(
    (info: {
      direction: 'next' | 'previous';
      currentIndex: number;
      distanceFromEdge: number;
      shouldFetch: boolean;
    }) => {
      if (info.shouldFetch) {
        // Calculate new central date based on swipe direction
        // We need to move by daysToShow * some factor to ensure we're generating
        // truly new dates and not just shifting slightly
        const moveByDays = daysToShow * 3; // Move by 3 slides worth of days

        const newCentralDate =
          info.direction === 'next'
            ? addDays(centralDate, moveByDays)
            : subDays(centralDate, moveByDays);

        setCentralDate(newCentralDate);

        // Generate new date items and groups
        const newDateItems = generateDateItems(newCentralDate);
        setDateGroups(generateGroupedDates(newDateItems));
      }
    },
    [centralDate, daysToShow, generateDateItems, generateGroupedDates]
  );

  // Calculate the width for each date item
  // We want to fit daysToShow items in a single screen
  const dateItemWidth = SCREEN_WIDTH / daysToShow;

  // Render a group of date items (one slide)
  const renderGroup = useCallback(
    ({ item }: { item: DateGroup; index: number }) => {
      return (
        <View className="w-full max-w-full flex-row items-center justify-center bg-orange-500 p-3">
          {item.dates.map((dateItem) => {
            const isSelected = isSameDay(dateItem.date, activeDate);
            const isCurrentDay = isToday(dateItem.date);

            return (
              <TouchableOpacity
                key={dateItem.id}
                onPress={() => handleDatePress(dateItem.date)}
                className={`
                  items-center justify-center rounded-full px-1 py-2
                  ${isSelected ? 'bg-yellow-500' : 'bg-red-500'}
                  ${isCurrentDay && !isSelected ? 'border border-white' : ''}
                `}
                style={{
                  width: `${100 / daysToShow - 1}%`,
                }}>
                <Text
                  className={`
                    mb-1 text-sm
                    ${isSelected ? 'text-black' : 'text-white'}
                  `}>
                  {dateItem.dayName}
                </Text>
                <Text
                  className={`
                    text-xl font-bold
                    ${isSelected ? 'text-black' : 'text-white'}
                  `}>
                  {dateItem.dayNumber}
                </Text>
                {dateItem.hasEvents && <View className="mt-1 h-1.5 w-1.5 rounded-full bg-white" />}
              </TouchableOpacity>
            );
          })}
        </View>
      );
    },
    [activeDate, handleDatePress, daysToShow]
  );

  return (
    <View className="h-24 bg-blue-500">
      <Swiper
        initialItems={dateGroups}
        renderItem={renderGroup}
        initialIndex={initialIndex > 0 ? initialIndex : 0}
        onSwipeEnd={handleSwipeEnd}
        fetchThreshold={2}
        showDebugPanel={showDebugPanel}
      />
    </View>
  );
};

export default Top;
