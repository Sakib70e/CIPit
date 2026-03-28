import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import api from '../../services/api';

export const MyDeliveriesScreen = () => {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyDeliveries = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/orders/me');
      // For delivery agents, this endpoint returns their assigned orders
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Fetch my deliveries error:', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyDeliveries();
  }, []);

  const handleUpdateStatus = (orderId, currentStatus) => {
    let nextStatus = '';
    let actionLabel = '';

    if (currentStatus === 'ASSIGNED') {
      nextStatus = 'OUT_FOR_DELIVERY';
      actionLabel = 'Set to Out for Delivery';
    } else if (currentStatus === 'OUT_FOR_DELIVERY') {
      nextStatus = 'DELIVERED';
      actionLabel = 'Set to Delivered';
    } else {
      Alert.alert('Done', 'Order has already been delivered or cancelled.');
      return;
    }

    Alert.alert(
      'Update Status',
      `Ready to update order #${orderId.toString().slice(-4)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: actionLabel, 
          onPress: async () => {
            try {
              await api.put(`/orders/${orderId}/status`, { status: nextStatus });
              Alert.alert('Updated ✅', `Order is now ${nextStatus.replace(/_/g, ' ')}!`);
              fetchMyDeliveries();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Update failed');
            }
          }
        }
      ]
    );
  };

  const renderDelivery = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id.toString().slice(-4)}</Text>
        <Text style={styles.price}>${item.totalPrice}</Text>
      </View>
      
      <Text style={styles.addressLabel}>Deliver to:</Text>
      <Text style={styles.addressText}>{item.address}</Text>

      <View style={styles.statusRow}>
        <Text style={styles.currentStatus}>Status: {item.status.replace(/_/g, ' ')}</Text>
      </View>

      {['ASSIGNED', 'OUT_FOR_DELIVERY'].includes(item.status) && (
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => handleUpdateStatus(item.id, item.status)}
        >
          <Text style={styles.actionBtnText}>Update Progress</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDelivery}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchMyDeliveries} />
        }
        ListHeaderComponent={<Text style={styles.title}>My Active Deliveries</Text>}
        ListEmptyComponent={<Text style={styles.empty}>No active deliveries assigned yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBFF' },
  list: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#003366' },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  price: { fontWeight: '700', color: '#333' },
  addressLabel: { color: '#666', fontSize: 13, marginTop: 5 },
  addressText: { color: '#333', fontSize: 15, marginTop: 2, marginBottom: 10 },
  statusRow: { marginBottom: 15 },
  currentStatus: { fontSize: 13, fontWeight: '600', color: '#007BFF' },
  actionBtn: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
});
