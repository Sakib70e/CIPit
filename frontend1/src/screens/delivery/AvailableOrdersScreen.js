import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import api from '../../services/api';

export const AvailableOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUnassigned = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/orders/unassigned');
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Fetch unassigned orders error:', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUnassigned();
  }, []);

  const handleAssign = (orderId) => {
    Alert.alert(
      'Assign Order',
      'Do you want to take this delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept', 
          onPress: async () => {
            try {
              await api.post(`/orders/${orderId}/assign`);
              Alert.alert('Success ✅', 'Order assigned to you! Go to "My Deliveries" to proceed.');
              fetchUnassigned();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to assign order');
            }
          }
        }
      ]
    );
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id.toString().slice(-4)}</Text>
        <Text style={styles.price}>${item.totalPrice}</Text>
      </View>
      
      <Text style={styles.addressLabel}>Delivery Address:</Text>
      <Text style={styles.addressText}>{item.address}</Text>

      <TouchableOpacity 
        style={styles.assignBtn}
        onPress={() => handleAssign(item.id)}
      >
        <Text style={styles.assignBtnText}>Take Delivery</Text>
      </TouchableOpacity>
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
          <RefreshControl refreshing={refreshing} onRefresh={fetchUnassigned} />
        }
        ListHeaderComponent={<Text style={styles.title}>Available Orders</Text>}
        ListEmptyComponent={<Text style={styles.empty}>No unassigned orders found.</Text>}
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
    borderLeftColor: '#28A745',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  price: { fontWeight: '700', color: '#28A745', fontSize: 16 },
  addressLabel: { color: '#666', fontSize: 13, marginTop: 5 },
  addressText: { color: '#333', fontSize: 15, marginTop: 2, marginBottom: 15 },
  assignBtn: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  assignBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
});
