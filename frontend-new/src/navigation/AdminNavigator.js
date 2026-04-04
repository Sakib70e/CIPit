import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { InventoryScreen } from '../screens/admin/InventoryScreen';
import { AdminTasksScreen } from '../screens/admin/AdminTasksScreen';
import { UsersScreen } from '../screens/admin/UsersScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';
import { AvailableOrdersScreen } from '../screens/delivery/AvailableOrdersScreen';
import { MyDeliveriesScreen } from '../screens/delivery/MyDeliveriesScreen';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();

export const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = 'bar-chart';
          if (route.name === 'Dashboard') iconName = focused ? 'speedometer' : 'speedometer-outline';
          else if (route.name === 'Inventory') iconName = focused ? 'cube' : 'cube-outline';
          else if (route.name === 'Orders') iconName = focused ? 'file-tray-full' : 'file-tray-full-outline';
          else if (route.name === 'Inbound') iconName = focused ? 'bicycle' : 'bicycle-outline';
          else if (route.name === 'Deliveries') iconName = focused ? 'navigate' : 'navigate-outline';
          else if (route.name === 'Users') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Orders" component={AdminTasksScreen} />
      <Tab.Screen name="Inbound" component={AvailableOrdersScreen} options={{ title: 'Inbound' }} />
      <Tab.Screen name="Deliveries" component={MyDeliveriesScreen} options={{ title: 'My Deliveries' }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Users" component={UsersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
