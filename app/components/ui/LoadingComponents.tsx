import React from 'react';
import type { FC } from 'react';
import { View } from 'react-native';
import { animatedStyles } from '../../styles/animatedStyles';
import { ShimmerEffect } from './ShimmerEffect';

interface LoadingComponentsModule {
  LoadingCard: FC;
  LoadingListItem: FC;
}

const LoadingCard: FC = () => {
  return (
    <View style={animatedStyles.shimmerContainer}>
      <ShimmerEffect style={{ height: 200, borderRadius: 12 }} />
    </View>
  );
};

export const LoadingListItem: React.FC = () => {
  return (
    <View style={animatedStyles.listItem}>
      <ShimmerEffect style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <ShimmerEffect 
          style={{ 
            width: '80%', 
            height: 20, 
            borderRadius: 4, 
            marginBottom: 8 
          }} 
        />
        <ShimmerEffect 
          style={{ 
            width: '60%', 
            height: 16, 
            borderRadius: 4 
          }} 
        />
      </View>
    </View>
  );
};