import React, { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  Platform,
  Keyboard,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"

// Custom hook for floating input logic
const useFloatingInput = () => {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<string[]>([])
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const animatedKeyboardHeight = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        const height = e.endCoordinates.height
        setKeyboardHeight(height)
        Animated.timing(animatedKeyboardHeight, {
          toValue: height,
          duration: Platform.OS === "ios" ? 250 : 0,
          useNativeDriver: false,
        }).start()
      }
    )

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0)
        Animated.timing(animatedKeyboardHeight, {
          toValue: 0,
          duration: Platform.OS === "ios" ? 250 : 0,
          useNativeDriver: false,
        }).start()
      }
    )

    return () => {
      keyboardWillShowListener.remove()
      keyboardWillHideListener.remove()
    }
  }, [])

  const handleSend = () => {
    if (message.trim()) {
      setMessages([...messages, message.trim()])
      setMessage("")
      // Scroll to bottom after adding a new message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }

  return {
    message,
    setMessage,
    messages,
    handleSend,
    scrollViewRef,
    animatedKeyboardHeight,
  }
}

const FloatingInputExample = () => {
  const { 
    message, 
    setMessage, 
    messages, 
    handleSend, 
    scrollViewRef,
    animatedKeyboardHeight 
  } = useFloatingInput()

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1">
        <View className="p-4 border-b border-gray-200">
          <Text className="text-xl font-bold">Floating Input Example</Text>
          
          <View className="flex-row space-x-2 mt-2">
            <Pressable 
              className="bg-blue-500 p-3 rounded-md flex-1"
              onPress={() => router.push("/textarea/sticky-input")}
            >
              <Text className="text-white text-center font-medium">Sticky Input</Text>
            </Pressable>
            
            <Pressable 
              className="bg-blue-500 p-3 rounded-md flex-1"
              onPress={() => router.back()}
            >
              <Text className="text-white text-center font-medium">KeyboardAvoidingView</Text>
            </Pressable>
          </View>
          
          <Text className="mt-2 text-gray-700">
            This example shows a TextInput that floats above the keyboard.
            The input animates with the keyboard and maintains its position.
          </Text>
        </View>

        {/* Main content area with messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 p-4"
          contentContainerClassName="pb-20" // Extra padding to ensure content isn't hidden behind the input
        >
          {messages.length > 0 ? (
            messages.map((msg, index) => (
              <View key={index} className="bg-green-100 p-3 rounded-lg mb-2 self-end max-w-[80%]">
                <Text>{msg}</Text>
              </View>
            ))
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-400">Send a message to start the conversation</Text>
            </View>
          )}
        </ScrollView>

        {/* Floating input that animates with keyboard */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: animatedKeyboardHeight,
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "#e5e5e5",
          }}
        >
          <View className="p-2 flex-row items-center">
            <TextInput
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-2"
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable
              className="bg-green-500 w-10 h-10 rounded-full items-center justify-center"
              onPress={handleSend}
            >
              <Text className="text-white font-bold">→</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}

export default FloatingInputExample
