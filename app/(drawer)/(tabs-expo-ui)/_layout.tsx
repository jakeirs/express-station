import { Tabs, TabList, TabTrigger, TabSlot, useTabSlot } from 'expo-router/ui';
import { Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Screen } from 'react-native-screens';
import type { TabsDescriptor, TabsSlotRenderOptions } from 'expo-router/ui';
import { CustomTabList } from './components/CustomTabList';
import { TabButton } from './components/TabButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedScreen = Animated.createAnimatedComponent(Screen);

export default function TabLayout() {
  const renderAnimatedTab = (
    descriptor: TabsDescriptor,
    { isFocused, loaded, index, detachInactiveScreens }: TabsSlotRenderOptions
  ) => {
    console.log('descriptor.route.key', descriptor.route.key);
    console.log('isFocused', isFocused);
    console.log('index', index);
    console.log('detachInactiveScreens', detachInactiveScreens);

    const animatedStyle = useAnimatedStyle(() => {
      const translateX = isFocused
        ? withTiming(0, { duration: 300 })
        : withTiming(index === 0 ? -SCREEN_WIDTH : SCREEN_WIDTH, { duration: 300 });

      return {
        transform: [{ translateX }],
      };
    });

    if (!loaded && !isFocused) return null;

    return (
      <AnimatedScreen key={descriptor.route.key} style={[{ flex: 1 }, animatedStyle]}>
        {descriptor.render()}
      </AnimatedScreen>
    );
  };

  return (
    <Tabs>
      <TabSlot renderFn={renderAnimatedTab} />
      <TabList asChild>
        <TabList style={{ backgroundColor: 'black' }}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="code" title="Tab One" />
          </TabTrigger>
          <TabTrigger name="two" href="/two" asChild>
            <TabButton icon="code" title="Tab Two" />
          </TabTrigger>
        </TabList>
      </TabList>
    </Tabs>
  );
}
