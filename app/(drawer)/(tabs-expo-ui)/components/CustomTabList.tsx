import { forwardRef } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useState, useEffect } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing
} from 'react-native-reanimated';
import { TabTrigger } from 'expo-router/ui';
import { TabButton } from './TabButton';

const tabs = [
  { name: 'index', icon: 'code', title: 'Tab One' },
  { name: 'two', icon: 'code', title: 'Tab Two' }
];

export const CustomTabList = forwardRef<View, { children: React.ReactNode }>((props, ref) => {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const translateX = useSharedValue(0);
  
  const tabWidth = width / tabs.length;

  useEffect(() => {
    translateX.value = withTiming(activeIndex * tabWidth + tabWidth / 2 - 20, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [activeIndex, tabWidth]);

  // Initialize circle position
  useEffect(() => {
    translateX.value = tabWidth / 2 - 20;
  }, [tabWidth]);

  const animatedCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View
      ref={ref}
      style={{
        backgroundColor: 'black',
        paddingVertical: 8,
        position: 'relative',
      }}
    >
      {/* Animated traveling circle */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#333333',
            top: 8,
            zIndex: 0,
          },
          animatedCircleStyle,
        ]}
      />
      
      {/* Custom tab buttons */}
      <View style={{ flexDirection: 'row' }}>
        {tabs.map((tab, index) => (
          <TabTrigger 
            key={tab.name}
            name={tab.name}
            onPress={() => setActiveIndex(index)}
          >
            <TabButton 
              icon={tab.icon as any} 
              title={tab.title}
              isActive={index === activeIndex}
            />
          </TabTrigger>
        ))}
      </View>
      
      {/* Hidden original children (the route-defining TabTriggers) */}
      <View style={{ display: 'none' }}>
        {props.children}
      </View>
    </View>
  );
});

CustomTabList.displayName = 'CustomTabList';
