import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/orders/me');
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Fetch orders error:', error.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = (orderId) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/orders/${orderId}/cancel`);
              Alert.alert('Success', 'Your order has been cancelled.');
              fetchOrders();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel');
            }
          }
        }
      ]
    );
  };

  const renderOrder = ({ item }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id.toString().slice(-6).toUpperCase()}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
        <Badge status={item.status} />
      </View>
      
      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Order Manifest</Text>
        {item.items?.map((orderItem, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Ionicons name="water-outline" size={16} color={COLORS.primary} />
            <Text style={styles.itemText}>
              {orderItem.quantity}x {orderItem.inventory?.itemName || 'Product'} ({orderItem.inventory?.size})
            </Text>
            <Text style={styles.itemPrice}>${(orderItem.price * orderItem.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText} numberOfLines={2}>{item.address}</Text>
        </View>

        {item.deliveryAgent && (
          <View style={styles.agentBox}>
            <View style={styles.agentHeader}>
              <Ionicons name="bicycle" size={16} color={COLORS.success} />
              <Text style={styles.agentTitle}>Assigned Agent</Text>
            </View>
            <Text style={styles.agentName}>{item.deliveryAgent.name}</Text>
            <Text style={styles.agentPhone}>{item.deliveryAgent.phone}</Text>
            
            {item.deliveryDate && (
              <View style={styles.scheduleRow}>
                <Ionicons name="time-outline" size={14} color={COLORS.secondary} />
                <Text style={styles.scheduleText}>
                  Scheduled: {new Date(item.deliveryDate).toLocaleDateString()} {item.timeSlot ? `(${item.timeSlot})` : ''}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.paymentLabel}>Payment Status</Text>
          <Badge status={item.paymentStatus} label={item.paymentStatus} />
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.price}>${(item.totalPrice || 0).toFixed(2)}</Text>
        </View>
      </View>

      {item.status === 'PENDING' && (
        <TouchableOpacity 
          style={styles.cancelBtn} 
          onPress={() => handleCancelOrder(item.id)}
        >
          <Text style={styles.cancelText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchOrders} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            !refreshing && (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={80} color={COLORS.border} />
                <Text style={styles.emptyTitle}>No Orders Yet</Text>
                <Text style={styles.emptySubtitle}>Your order history will appear here once you place an order.</Text>
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 40 },
  orderCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  orderHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 12 
  },
  orderId: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  date: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  divider: { 
    height: 1, 
    backgroundColor: COLORS.border, 
    marginVertical: 12,
    opacity: 0.5
  },
  section: {
    marginBottom: 12
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  itemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  itemText: { 
    marginLeft: 8, 
    fontSize: 14, 
    color: COLORS.dark,
    fontWeight: '600',
    flex: 1
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700'
  },
  infoSection: {
    marginTop: 8
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1
  },
  agentBox: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  agentTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.success,
    marginLeft: 6,
    textTransform: 'uppercase'
  },
  agentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark
  },
  agentPhone: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)'
  },
  scheduleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '600'
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)'
  },
  paymentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  priceColumn: {
    alignItems: 'flex-end'
  },
  totalLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  price: { fontSize: 20, fontWeight: '900', color: COLORS.primary, marginTop: 2 },
  cancelBtn: { 
    marginTop: 16, 
    alignItems: 'center', 
    paddingVertical: 10,
    backgroundColor: COLORS.danger + '10',
    borderRadius: SIZES.radius
  },
  cancelText: { color: COLORS.danger, fontSize: 14, fontWeight: '700' },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 100,
    paddingHorizontal: 40
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: COLORS.dark, 
    marginTop: 20 
  },
  emptySubtitle: { 
    fontSize: 15, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    marginTop: 8,
    lineHeight: 22
  },
});

