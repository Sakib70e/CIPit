import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/customer/HomeScreen';
import { OrdersScreen } from '../screens/customer/OrdersScreen';
import { SubscriptionsScreen } from '../screens/customer/SubscriptionsScreen';
import { ProductsScreen } from '../screens/customer/ProductsScreen';
import { NotificationsScreen } from '../screens/customer/NotificationsScreen';
import { ReorderScreen } from '../screens/customer/ReorderScreen';
import { CartScreen } from '../screens/customer/CartScreen';
import { CheckoutScreen } from '../screens/customer/CheckoutScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';
import { COLORS, SHADOWS } from '../constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="Reorder" component={ReorderScreen} />
  </Stack.Navigator>
);

const ShopStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProductsMain" component={ProductsScreen} />
    <Stack.Screen name="Cart" component={CartScreen} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
  </Stack.Navigator>
);

export const CustomerNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, focused }) => {
          let iconName = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Products') iconName = focused ? 'water' : 'water-outline';
          else if (route.name === 'Orders') iconName = focused ? 'receipt' : 'receipt-outline';
          else if (route.name === 'Subscriptions') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return (
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={24} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.labelStyle,
        tabBarStyle: [
          styles.tabBar,
          { 
            height: (Platform.OS === 'ios' ? 100 : 90) + insets.bottom * 0.5,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            paddingTop: 12
          }
        ],
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="Products" component={ShopStack} options={{ title: 'Shop' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="Subscriptions" component={SubscriptionsScreen} options={{ title: 'Plan' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Me' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...SHADOWS.medium,
    elevation: 20,
  },
  labelStyle: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});
