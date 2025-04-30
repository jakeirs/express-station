import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SimpleNotepad = () => {
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const scrollViewRef = useRef(null);
  
  const handleTextChange = (newText) => {
    setText(newText);
  };
  
  const handleContentSizeChange = () => {
    // Scroll to the bottom when content size changes
    scrollViewRef.current?.scrollToEnd({ animated: false });
  };
  
  const handleSelectionChange = (event) => {
    // Scroll to keep the cursor visible when selection changes
    scrollViewRef.current?.scrollToEnd({ animated: false });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scroll} 
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={true}
          onContentSizeChange={handleContentSizeChange}
        >
          <View style={{ height: 500, backgroundColor: 'green' }}></View>
          <View style={styles.noteContainer}>
            <TextInput
              style={styles.editor}
              multiline
              value={text}
              onChangeText={handleTextChange}
              onSelectionChange={handleSelectionChange}
              placeholder="Zacznij pisać swoją notatkę..."
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  keyboardContainer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  noteContainer: {
    flex: 1,
    margin: 15,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  editor: {
    minHeight: 300,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  viewMode: {
    padding: 15,
    minHeight: 300,
  },
  contentView: {
    flex: 1,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2095F2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'flex-end',
    margin: 15,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#2095F2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: 'flex-end',
    margin: 15,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyNoteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SimpleNotepad;
