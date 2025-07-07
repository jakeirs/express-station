import { Link, Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { HeaderButton } from '~/components/HeaderButton';
import { TabBarIcon } from '~/components/TabBarIcon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: '#A9A9A9',
        tabBarStyle: {
          backgroundColor: 'black',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Tab One',
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
          headerRight: () => (
            <View>
              <Text>asdasd</Text>
            </View>
          ),
          // tabBarLabel: () => (
          //   <View>
          //     <Text>asdasd</Text>
          //   </View>
          // ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Tab Two',
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
        }}
      />
    </Tabs>
  );
}
