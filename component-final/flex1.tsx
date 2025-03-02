import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';

const AbsolutePositioningDemos = () => {
  const { width } = useWindowDimensions();
  const [containerHeight, setContainerHeight] = useState(100);

  const onLayoutHandler = (event) => {
    const { width } = event.nativeEvent.layout;
    setContainerHeight(width * 0.3); // 30% of width
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Solution 1: Fixed Height</Text>
      <View style={styles.demoContainer}>
        <View style={styles.fixedHeightContainer}>
          <View style={styles.absoluteContent}>
            <Text style={styles.contentText}>Fixed Height (200px)</Text>
          </View>
        </View>
        <View style={styles.nextComponent}>
          <Text style={styles.contentText}>Next Component</Text>
        </View>
      </View>

      <Text style={styles.header}>Solution 2: Aspect Ratio</Text>
      <View style={styles.demoContainer}>
        <View style={styles.aspectRatioContainer}>
          <View style={styles.aspectRatioInner}>
            <View style={styles.absoluteContent2}>
              <Text style={styles.contentText}>4:1 Aspect Ratio</Text>
            </View>
          </View>
        </View>
        <View style={styles.nextComponent}>
          <Text style={styles.contentText}>Next Component</Text>
        </View>
      </View>

      <Text style={styles.header}>Solution 3: Dynamic Height</Text>
      <View style={styles.demoContainer}>
        <View
          style={[styles.dynamicContainer, { height: containerHeight }]}
          onLayout={onLayoutHandler}>
          <View style={styles.absoluteContent3}>
            <Text style={styles.contentText}>Dynamic Height ({containerHeight.toFixed(0)}px)</Text>
          </View>
        </View>
        <View style={styles.nextComponent}>
          <Text style={styles.contentText}>Next Component</Text>
        </View>
      </View>

      <Text style={styles.header}>Solution 4: Spacer View</Text>
      <View style={styles.demoContainer}>
        <View style={styles.spacerContainer}>
          <View style={styles.spacer} />
          <View style={styles.absoluteOverlay}>
            <Text style={styles.contentText}>With Spacer (150px)</Text>
          </View>
        </View>
        <View style={styles.nextComponent}>
          <Text style={styles.contentText}>Next Component</Text>
        </View>
      </View>

      <Text style={styles.header}>Solution 5: Flexbox Intrinsic</Text>
      <View style={styles.demoContainer}>
        <View style={styles.flexContainer}>
          <View style={styles.intrinsicContent}>
            <Text style={styles.hiddenText}>Intrinsic Content Size</Text>
          </View>
          <View style={styles.absoluteFlexOverlay}>
            <Text style={styles.contentText}>Intrinsic Content Size</Text>
          </View>
        </View>
        <View style={styles.nextComponent}>
          <Text style={styles.contentText}>Next Component</Text>
        </View>
      </View>

      <View style={styles.spacerBottom} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
    backgroundColor: '#333',
    color: 'white',
  },
  demoContainer: {
    marginBottom: 20,
  },

  // Solution 1: Fixed Height
  fixedHeightContainer: {
    height: 200,
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  absoluteContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 100, 200, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Solution 2: Aspect Ratio
  aspectRatioContainer: {
    width: '100%',
    paddingTop: '25%', // 4:1 ratio
    position: 'relative',
    backgroundColor: '#e0e0e0',
  },
  aspectRatioInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  absoluteContent2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(200, 100, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Solution 3: Dynamic Height
  dynamicContainer: {
    width: '100%',
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  absoluteContent3: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(100, 200, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Solution 4: Spacer View
  spacerContainer: {
    position: 'relative',
    width: '100%',
  },
  spacer: {
    height: 150,
    width: '100%',
    backgroundColor: 'transparent',
  },
  absoluteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(200, 0, 200, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Solution 5: Flexbox with Intrinsic Content
  flexContainer: {
    position: 'relative',
    width: '100%',
  },
  intrinsicContent: {
    padding: 40,
    opacity: 0,
  },
  absoluteFlexOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 200, 200, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenText: {
    fontSize: 18,
  },

  // Common styles
  nextComponent: {
    padding: 20,
    backgroundColor: '#d0d0d0',
  },
  contentText: {
    fontSize: 18,
  },
  spacerBottom: {
    height: 50,
  },
});

export default AbsolutePositioningDemos;
