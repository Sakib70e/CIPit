import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import api from '../../services/api';

export const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/orders/me');
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Fetch orders error:', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
              Alert.alert('Cancelled', 'Your order has been cancelled.');
              fetchOrders();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED': return '#28A745';
      case 'CANCELLED': return '#DC3545';
      case 'OUT_FOR_DELIVERY': return '#FFC107';
      default: return '#007BFF';
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id.toString().slice(-4)}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {item.status}
        </Text>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.price}>Total: ${item.totalPrice}</Text>
      </View>

      <Text style={styles.address} numberOfLines={1}>📍 {item.address}</Text>

      {item.status === 'PENDING' && (
        <TouchableOpacity 
          style={styles.cancelLink} 
          onPress={() => handleCancelOrder(item.id)}
        >
          <Text style={styles.cancelText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />
        }
        ListHeaderComponent={<Text style={styles.title}>My Orders</Text>}
        ListEmptyComponent={<Text style={styles.empty}>You haven't placed any orders yet.</Text>}
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
    borderLeftColor: '#007BFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  status: { fontSize: 14, fontWeight: 'bold' },
  details: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  date: { color: '#666' },
  price: { fontWeight: '700', color: '#333' },
  address: { color: '#888', fontSize: 13, marginBottom: 10 },
  cancelLink: { alignSelf: 'flex-end', padding: 5 },
  cancelText: { color: '#DC3545', fontSize: 14, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
});
