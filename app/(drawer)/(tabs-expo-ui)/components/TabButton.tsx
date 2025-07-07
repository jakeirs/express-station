import { TabTriggerSlotProps } from 'expo-router/ui';
import { ComponentProps, Ref } from 'react';
import { Text, Pressable, View } from 'react-native';
import { TabBarIcon } from '~/components/TabBarIcon';

export type TabButtonProps = TabTriggerSlotProps & {
  icon?: ComponentProps<typeof TabBarIcon>['name'];
  title: string;
  ref?: Ref<View>;
};

export function TabButton({ icon = 'code', title, children, isFocused, ...props }: TabButtonProps) {
  return (
    <Pressable
      {...props}
      style={[
        {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 8,
        },
      ]}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <TabBarIcon 
          name={icon} 
          color={isFocused ? 'white' : '#A9A9A9'} 
        />
        <Text style={{ 
          color: isFocused ? 'white' : '#A9A9A9',
          fontSize: 12 
        }}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}
