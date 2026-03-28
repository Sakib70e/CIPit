import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import api from '../../services/api';

export const SubscriptionsScreen = () => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSubs();
  }, []);

  const fetchSubs = async () => {
    try {
      const res = await api.get('/subscriptions');
      setSubs(Array.isArray(res.data) ? res.data : res.data?.subscriptions || []);
    } catch (e) {
      console.log('Error fetching subscriptions', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#007BFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Subscriptions</Text>
      {subs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>🔔 No active subscriptions.</Text>
        </View>
      ) : (
        <FlatList
          data={subs}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSubs(); }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.itemName ?? 'Water'}</Text>
              <Text style={styles.detail}>Frequency: {item.frequency}</Text>
              <Text style={styles.detail}>Status: {item.isActive ? '✅ Active' : '❌ Paused'}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  detail: { color: '#666', fontSize: 13, marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#999' },
});
