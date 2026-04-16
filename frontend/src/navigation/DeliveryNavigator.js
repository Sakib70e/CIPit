import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AvailableOrdersScreen } from '../screens/delivery/AvailableOrdersScreen';
import { MyDeliveriesScreen } from '../screens/delivery/MyDeliveriesScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

export const DeliveryNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = 'bicycle';
          if (route.name === 'Available') iconName = focused ? 'file-tray-full' : 'file-tray-outline';
          else if (route.name === 'MyDeliveries') iconName = focused ? 'bicycle' : 'bicycle-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontWeight: '600' },
        headerStyle: {
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTitleStyle: {
          fontWeight: '800',
          color: COLORS.dark,
        },
      })}
    >
      <Tab.Screen 
        name="Available" 
        component={AvailableOrdersScreen} 
        options={{ title: 'Find Orders' }}
      />
      <Tab.Screen 
        name="MyDeliveries" 
        component={MyDeliveriesScreen} 
        options={{ title: 'My Tasks' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
      />
    </Tab.Navigator>
  );
};
