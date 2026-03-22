import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface TypingIndicatorProps {
  visible?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ visible = true }) => {
  const animatedValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (!visible) return;

    const animations = animatedValues.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            delay: index * 150,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            delay: index * 150,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [visible, animatedValues]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          {animatedValues.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -6],
                      }),
                    },
                  ],
                  opacity: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.label}>Assistant is typing...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
    alignItems: 'flex-start',
  },
  bubble: {
    backgroundColor: '#E9E9EB',
    padding: 16,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666666',
    marginHorizontal: 2,
  },
  label: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
});

export default TypingIndicator;
