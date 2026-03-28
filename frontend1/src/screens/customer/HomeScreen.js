import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import { Button } from '../../components/Button';

export const HomeScreen = () => {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      // Backend usually returns { success, data }
      setItems(res.data.data || []);
    } catch (error) {
      console.error('Inventory error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handlePlaceOrder = async (item) => {
    Alert.alert(
      'Confirm Order',
      `Order 1x ${item.itemName} (${item.size}) for $${item.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              const payload = {
                items: [{ itemId: item.id, quantity: 1 }],
                address: user?.address, // Default to profile address
              };
              await api.post('/orders', payload);
              Alert.alert('Success 🚀', 'Your order has been placed!');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to place order');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.itemName}</Text>
        <Text style={styles.itemSize}>{item.size}</Text>
        <Text style={styles.itemPrice}>${item.price}</Text>
      </View>
      <TouchableOpacity 
        style={styles.orderBtn}
        onPress={() => handlePlaceOrder(item)}
      >
        <Text style={styles.orderBtnText}>Order</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Hello, {user?.name} 👋</Text>
        <Text style={styles.headerSub}>What can we deliver for you today?</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchInventory} />
        }
        ListHeaderComponent={<Text style={styles.sectionTitle}>Available Products</Text>}
        ListEmptyComponent={
          !loading && <Text style={styles.empty}>No items available in your area yet.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBFF' },
  header: { padding: 24, paddingTop: 40, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  welcome: { fontSize: 24, fontWeight: 'bold', color: '#003366' },
  headerSub: { fontSize: 16, color: '#666', marginTop: 4 },
  list: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#444' },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  itemSize: { fontSize: 14, color: '#888', marginTop: 2 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: '#007BFF', marginTop: 5 },
  orderBtn: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  orderBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 16 },
});
