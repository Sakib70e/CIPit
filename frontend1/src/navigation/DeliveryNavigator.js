import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AvailableOrdersScreen } from '../screens/delivery/AvailableOrdersScreen';
import { MyDeliveriesScreen } from '../screens/delivery/MyDeliveriesScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export const DeliveryNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'cube';
          if (route.name === 'Available') iconName = 'list-circle-outline';
          else if (route.name === 'My Deliveries') iconName = 'bicycle-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Available" component={AvailableOrdersScreen} options={{ title: 'Available Orders' }} />
      <Tab.Screen name="My Deliveries" component={MyDeliveriesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
