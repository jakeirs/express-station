import { useHeaderHeight } from '@react-navigation/elements';
import React, { MutableRefObject, ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  ViewStyle,
} from 'react-native';

type Props = {
  children: ReactNode;
  scrollContentContainerStyle?: ViewStyle;
  scrollViewRef?: MutableRefObject<ScrollView | null>;
};

const StackOverFlow: React.FC<Props> = ({
  children,
  scrollContentContainerStyle = {},
  scrollViewRef,
}) => {
  const headerHeight = useHeaderHeight();

  const renderScrollView = (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, ...scrollContentContainerStyle }}
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}>
      {children}
    </ScrollView>
  );

  if (Platform.OS === 'android') return renderScrollView;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {renderScrollView}
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default StackOverFlow;
