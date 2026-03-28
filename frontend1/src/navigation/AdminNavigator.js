import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { InventoryScreen } from '../screens/admin/InventoryScreen';
import { OrdersScreen } from '../screens/customer/OrdersScreen';
import { UsersScreen } from '../screens/admin/UsersScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'cellular';
          if (route.name === 'Dashboard') iconName = 'bar-chart-outline';
          else if (route.name === 'Inventory') iconName = 'cube-outline';
          else if (route.name === 'Orders') iconName = 'list-outline';
          else if (route.name === 'Users') iconName = 'people-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'All Orders' }} />
      <Tab.Screen name="Users" component={UsersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
