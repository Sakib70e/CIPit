import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export const Logo = ({ size = 100, style }) => {
  return (
    <View style={[styles.container, style, { width: size, height: size / 2 }]}>
      <Image
        source={require('../../assets/CIPITLOGO_Circle.png')}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
});
