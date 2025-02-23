import { Image, View } from 'react-native';

export default function ImageDisplay1() {
  return (
    <View className="items-center justify-center p-4">
      <Image
        source={require('../assets/images/831-200x300.jpg')}
        style={{ width: 200, height: 300 }}
      />
    </View>
  );
}
