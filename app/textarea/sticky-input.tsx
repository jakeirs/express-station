import React, { useState, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Pressable,
  ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"

// Custom hook for sticky input logic
const useStickyInput = () => {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<string[]>([])
  const scrollViewRef = useRef<ScrollView>(null)

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
  }
}

const StickyInputExample = () => {
  const { message, setMessage, messages, handleSend, scrollViewRef } = useStickyInput()

  return (
    <SafeAreaView className="flex-1">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          <View className="p-4 border-b border-gray-200">
            <Text className="text-xl font-bold">Sticky Input Example</Text>
            
            <View className="flex-row space-x-2 mt-2">
              <Pressable 
                className="bg-blue-500 p-3 rounded-md flex-1"
                onPress={() => router.push("/textarea/floating-input")}
              >
                <Text className="text-white text-center font-medium">Floating Input Example</Text>
              </Pressable>
              
              <Pressable 
                className="bg-blue-500 p-3 rounded-md flex-1"
                onPress={() => router.back()}
              >
                <Text className="text-white text-center font-medium">KeyboardAvoidingView</Text>
              </Pressable>
            </View>
            
            <Text className="mt-2 text-gray-700">
              This example shows a TextInput that sticks to the keyboard.
              The input stays at the bottom of the screen, just above the keyboard.
            </Text>
          </View>

          {/* Main content area with messages */}
          <ScrollView 
            ref={scrollViewRef}
            className="flex-1 p-4"
            contentContainerClassName="pb-4"
          >
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <View key={index} className="bg-blue-100 p-3 rounded-lg mb-2 self-end max-w-[80%]">
                  <Text>{msg}</Text>
                </View>
              ))
            ) : (
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray-400">Send a message to start the conversation</Text>
              </View>
            )}
          </ScrollView>

          {/* Sticky input area that stays above the keyboard */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          >
            <View className="p-2 border-t border-gray-200 bg-white flex-row items-center">
              <TextInput
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-2"
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <Pressable
                className="bg-blue-500 w-10 h-10 rounded-full items-center justify-center"
                onPress={handleSend}
              >
                <Text className="text-white font-bold">→</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  )
}

export default StickyInputExample
