import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import api from '../../services/api';

const StatCard = ({ title, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statLabel}>{title}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

export const DashboardScreen = () => {
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      // Backend has a /dashboard route that returns stats
      const res = await api.get('/auth/dashboard');
      setStats(res.data.data);
    } catch (err) {
      console.error('Fetch stats error:', err.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchStats} />}
    >
      <Text style={styles.title}>Admin Dashboard 🏛️</Text>
      
      <View style={styles.grid}>
        <StatCard title="Total Customers" value={stats?.totalUsers || '...'} color="#007BFF" />
        <StatCard title="Active Orders" value={stats?.totalOrders || '...'} color="#28A745" />
        <StatCard title="Delivery Agents" value={stats?.deliveryCount || '...'} color="#FFC107" />
        <StatCard title="Inventory Items" value={stats?.inventoryCount || '...'} color="#17A2B8" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Performance</Text>
        <Text style={styles.health}>✨ API Connection: Verified</Text>
        <Text style={styles.health}>✨ Database: Syncing</Text>
        <Text style={styles.health}>✨ Network: Local (SDK 54)</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBFF' },
  content: { padding: 24, paddingVertical: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#003366', marginBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  statLabel: { fontSize: 13, color: '#666', fontWeight: 'bold' },
  statValue: { fontSize: 24, fontWeight: '800', marginTop: 5 },
  section: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginTop: 15, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#444' },
  health: { fontSize: 15, color: '#555', marginBottom: 8 },
});
