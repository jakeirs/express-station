import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { View } from 'react-native';
import { TabButton } from './components/TabButton';

export default function TabLayout() {
  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={{
          backgroundColor: 'black',
          flexDirection: 'row',
          paddingVertical: 8,
        }}>
        <TabTrigger name="index" href="/" asChild
        
        
        >
          <TabButton icon="code" title="Tab One" />
        </TabTrigger>
        <TabTrigger name="two" href="/two" asChild>
          <TabButton icon="code" title="Tab Two" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
