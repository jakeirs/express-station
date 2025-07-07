import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { Text } from 'react-native';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { Screen } from 'react-native-screens';
import type { TabsDescriptor, TabsSlotRenderOptions } from 'expo-router/ui';
import { CustomTabList } from './components/CustomTabList';

const AnimatedScreen = Animated.createAnimatedComponent(Screen);

export default function TabLayout() {
  const customRenderer = (descriptor: TabsDescriptor, { isFocused, loaded }: TabsSlotRenderOptions) => {
    if (!loaded) return null;

    return (
      <AnimatedScreen
        key={descriptor.route.key}
        style={{ flex: 1 }}
        entering={SlideInRight.duration(300)}
        exiting={SlideOutLeft.duration(300)}
      >
        {descriptor.render()}
      </AnimatedScreen>
    );
  };

  return (
    <Tabs>
      <TabSlot renderFn={customRenderer} />
      <TabList asChild>
        <TabList>
          <TabTrigger name="index" href="/">
            <Text>Tab One</Text>
          </TabTrigger>
          <TabTrigger name="two" href="/two">
            <Text>Tab Two</Text>
          </TabTrigger>
        </TabList>
      </TabList>
    </Tabs>
  );
}
