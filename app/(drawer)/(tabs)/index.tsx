import { Text, View } from "react-native"
import { Button } from "../../../components/Button"
import { useBearsState } from "./hooks/useBearsState"

export default function TabOneScreen() {
  const { bears, increasePopulation, removeAllBears, handleRandomUpdate } = useBearsState()

  return (
    <View className="flex-1 items-center justify-center gap-4">
      <Text className="text-2xl font-bold">useState Example</Text>
      
      <View className="items-center gap-2">
        <Text className="text-xl">Bears: {bears}</Text>
        
        <Button 
          title="Add Bear 🐻" 
          onPress={increasePopulation}
        />
        
        <Button 
          title="Remove All Bears" 
          onPress={removeAllBears}
        />
        
        <Button 
          title="Random Update" 
          onPress={handleRandomUpdate}
        />
      </View>

      <Text className="text-sm text-gray-500 max-w-[80%] text-center mt-4">
        This is a useState example showing local state management.
        Unlike Zustand, this state will reset when you navigate away from this tab.
      </Text>
    </View>
  )
}
