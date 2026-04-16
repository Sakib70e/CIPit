import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  StatusBar,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { OrderModal } from '../../components/OrderModal';
import { Logo } from '../../components/Logo';

export const HomeScreen = ({ navigation, route }) => {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState({ activeOrders: 0, nextDelivery: null });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [ordersRes, notiRes] = await Promise.all([
        api.get('/orders/me'),
        api.get('/notifications')
      ]);

      const activeOrders = (ordersRes.data.data || []).filter(o =>
        ['PENDING', 'ASSIGNED', 'OUT_FOR_DELIVERY'].includes(o.status)
      ).length;

      setStats({
        activeOrders,
        nextDelivery: (ordersRes.data.data || []).find(o => o.status === 'ASSIGNED')?.deliveryDate || null
      });

      setHasUnread((notiRes.data.data || []).some(n => !n.isRead));
    } catch (error) {
      console.error('Home data error:', error.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Handle item passed from Products page
  useEffect(() => {
    if (route.params?.orderItem) {
      setSelectedItem(route.params.orderItem);
      setOrderModalVisible(true);
    }
  }, [route.params?.orderItem]);

  const onConfirmOrder = async (payload) => {
    try {
      await api.post('/orders', payload);
      Alert.alert('Success 🚀', 'Your order has been placed!');
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to place order');
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Minimal Navbar */}
      <View style={styles.navbar}>
        <Logo size={180} />
        <TouchableOpacity
          style={styles.notiBtn}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.dark} />
          {hasUnread && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={COLORS.primary} />
        }
      >
        <View style={styles.welcome}>
          <Text style={styles.greeting}>Hey {user?.name?.split(' ')[0]}! 👋</Text>
          <Text style={styles.subGreeting}>Stay hydrated with CIPit.</Text>
        </View>

        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="cart-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statLabel}>Active Orders</Text>
            <Text style={styles.statValue}>{stats.activeOrders}</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.statLabel}>Next Delivery</Text>
            <Text style={styles.statValue}>
              {stats.nextDelivery ? new Date(stats.nextDelivery).toLocaleDateString([], { day: 'numeric', month: 'short' }) : 'None'}
            </Text>
          </Card>
        </View>

        <TouchableOpacity
          style={styles.shopNow}
          onPress={() => navigation.navigate('Products')}
        >
          <View style={styles.shopNowText}>
            <Text style={styles.shopTitle}>Need Water Now?</Text>
            <Text style={styles.shopSubtitle}>Browse our premium range</Text>
          </View>
          <View style={styles.shopIcon}>
            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        <Card style={styles.promoCard}>
          <Text style={styles.promoTitle}>Save 15% on Subscriptions</Text>
          <Text style={styles.promoDesc}>Set it and forget it. Get water delivered automatically on your schedule.</Text>
          <TouchableOpacity
            style={styles.promoBtn}
            onPress={() => navigation.navigate('Subscriptions')}
          >
            <Text style={styles.promoBtnText}>View Schedule</Text>
          </TouchableOpacity>
          <Ionicons name="water" size={100} color={COLORS.white + '15'} style={styles.promoBgIcon} />
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      <OrderModal
        visible={orderModalVisible}
        item={selectedItem}
        userAddress={user?.address}
        onClose={() => setOrderModalVisible(false)}
        onConfirm={onConfirmOrder}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  navbar: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50'
  },
  logo: { alignSelf: 'center' },
  notiBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.light, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger, borderWidth: 1.5, borderColor: COLORS.white },
  container: { flex: 1, backgroundColor: COLORS.background },
  welcome: { padding: SIZES.padding, paddingBottom: 10 },
  greeting: { fontSize: 24, fontWeight: '900', color: COLORS.dark },
  subGreeting: { fontSize: 16, color: COLORS.secondary, marginTop: 4 },
  statsContainer: { flexDirection: 'row', padding: 8, justifyContent: 'space-between' },
  statCard: { flex: 0.48, padding: 20, borderRadius: 24, backgroundColor: COLORS.white, ...SHADOWS.light },
  statIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statLabel: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  statValue: { fontSize: 17, fontWeight: '900', color: COLORS.dark, marginTop: 4 },
  shopNow: {
    margin: 16,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium
  },
  shopNowText: { flex: 1 },
  shopTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  shopSubtitle: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
  shopIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  promoCard: {
    margin: 16,
    backgroundColor: COLORS.dark,
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden'
  },
  promoTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white, maxWidth: '70%' },
  promoDesc: { fontSize: 14, color: COLORS.white + '80', marginTop: 12, maxWidth: '80%', lineHeight: 20 },
  promoBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, marginTop: 24, alignSelf: 'flex-start' },
  promoBtnText: { color: COLORS.white, fontWeight: '700' },
  promoBgIcon: { position: 'absolute', right: -20, bottom: -20 }
});
