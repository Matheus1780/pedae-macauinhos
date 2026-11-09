import React from 'react';
import { View, Image } from 'react-native';
import { useTheme } from '../state/ThemeProvider';
// One source asset with two equal rows. Only the wordmark changes with the theme.
export function BrandLogo({ width = 150 }: { width?: number }) {
  const { dark } = useTheme();
  const height = width / 3;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="PedeAê"
      testID={dark ? 'logo-dark' : 'logo-light'}
      style={{ width, height, overflow: 'hidden' }}
    >
      <Image
        source={require('../../assets/brand/logo-themes.png')}
        accessible={false}
        style={{ position: 'absolute', width, height: height * 2, top: dark ? -height : 0 }}
        resizeMode="stretch"
      />
    </View>
  );
}
