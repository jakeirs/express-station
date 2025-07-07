import { TabTriggerSlotProps } from 'expo-router/ui';
import { ComponentProps, Ref } from 'react';
import { Text, Pressable, View } from 'react-native';
import { TabBarIcon } from '~/components/TabBarIcon';

export type TabButtonProps = TabTriggerSlotProps & {
  icon?: ComponentProps<typeof TabBarIcon>['name'];
  title: string;
  ref?: Ref<View>;
  isActive?: boolean;
};

export function TabButton({ icon = 'code', title, children, isFocused, isActive, ...props }: TabButtonProps) {
  const isTabActive = isActive !== undefined ? isActive : isFocused;

  return (
    <Pressable
      {...props}
      style={[
        {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 8,
          position: 'relative',
          minHeight: 60,
          justifyContent: 'center',
        },
      ]}>
      <View 
        style={{ 
          alignItems: 'center', 
          gap: 6,
          transform: [{ translateY: isTabActive ? -3 : 0 }, { scale: isTabActive ? 1.05 : 1 }],
        }}
      >
        <View style={{ 
          alignItems: 'center', 
          height: 28, 
          justifyContent: 'center',
          padding: 2,
        }}>
          <TabBarIcon 
            name={icon} 
            color={isTabActive ? '#FFFFFF' : '#A9A9A9'} 
          />
        </View>
        <Text style={{ 
          color: isTabActive ? '#FFFFFF' : '#A9A9A9',
          fontSize: isTabActive ? 13 : 12,
          fontWeight: isTabActive ? '700' : '500',
          textAlign: 'center',
          letterSpacing: 0.5,
        }}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}
