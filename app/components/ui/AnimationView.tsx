import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { Colors, Layout } from '../../constants';

interface AnimationViewProps {
  source: any;
  autoPlay?: boolean;
  loop?: boolean;
  style?: any;
  width?: number;
  height?: number;
}

export const AnimationView: React.FC<AnimationViewProps> = ({
  source,
  autoPlay = true,
  loop = true,
  style,
  width = 200,
  height = 200,
}) => {
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.placeholder, { width, height }]}>
          <Text style={styles.placeholderText}>📚 Study Animation</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={source}
        autoPlay={autoPlay}
        loop={loop}
        style={[styles.animation, { width, height }]}
        onAnimationFailure={() => setHasError(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    alignSelf: 'center',
  },
  placeholder: {
    backgroundColor: '#FFF3CD',
    borderRadius: Layout.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFE69C',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: Layout.fontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
