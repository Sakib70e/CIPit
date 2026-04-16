import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';

import { AuthNavigator } from './AuthNavigator';
import { CustomerNavigator } from './CustomerNavigator';
import { DeliveryNavigator } from './DeliveryNavigator';
import { AdminNavigator } from './AdminNavigator';

export const RootNavigator = () => {
  const { user, token, isLoading, restoreToken } = useAuthStore();

  useEffect(() => {
    restoreToken();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  const renderNavigator = () => {
    if (!token || !user) return <AuthNavigator />;
    switch (user.role) {
      case 'ADMIN': return <AdminNavigator />;
      case 'DELIVERY': return <DeliveryNavigator />;
      default: return <CustomerNavigator />;
    }
  };

  return (
    <NavigationContainer>
      {renderNavigator()}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
