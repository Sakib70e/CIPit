import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import api from '../../services/api';

export const UsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(Array.isArray(res.data) ? res.data : res.data?.users || []);
    } catch (e) {
      console.log('Error fetching users', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const changeRole = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      Alert.alert('Success', `Role changed to ${newRole}`);
      fetchUsers();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to change role');
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#007BFF" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Users 👥</Text>
      {users.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>No users found.</Text></View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.detail}>Phone: {item.phone}</Text>
              <Text style={styles.detail}>Role: <Text style={styles.role}>{item.role}</Text></Text>
              {item.role === 'CUSTOMER' && (
                <TouchableOpacity style={styles.btn} onPress={() => changeRole(item.id, 'DELIVERY')}>
                  <Text style={styles.btnText}>Promote to Delivery</Text>
                </TouchableOpacity>
              )}
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
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 12, elevation: 2 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  detail: { color: '#666', fontSize: 13, marginTop: 2 },
  role: { fontWeight: 'bold', color: '#007BFF' },
  btn: { marginTop: 10, backgroundColor: '#28A745', padding: 8, borderRadius: 6, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
});
