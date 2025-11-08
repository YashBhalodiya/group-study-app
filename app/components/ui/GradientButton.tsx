import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { animatedStyles } from '../../styles/animatedStyles';
import { Colors } from '../../constants';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface GradientButtonProps {
  onPress: () => void;
  title: string;
  colors?: string[];
}

export const GradientButton: React.FC<GradientButtonProps> = ({ onPress, title, colors = Colors.primaryGradient }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedTouchable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[animatedStyles.gradientButton, animatedStyle]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={animatedStyles.gradientButtonContent}
      >
        <Text style={{ color: Colors.surface, fontSize: 16, fontWeight: '600' }}>
          {title}
        </Text>
      </LinearGradient>
    </AnimatedTouchable>
  );
};