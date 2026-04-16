import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';

const InfoRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || 'Not set'}</Text>
  </View>
);

export const ProfileScreen = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to end your session?', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Account ⚙️</Text>
      
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
      </View>
      
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.roleTag}>ROLE: {user?.role}</Text>

      <View style={styles.section}>
        <InfoRow label="Phone" value={user?.phone} />
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Address" value={user?.address} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBFF' },
  content: { padding: 24, paddingVertical: 40, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', alignSelf: 'flex-start', color: '#003366', marginBottom: 30 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 4,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  roleTag: { color: '#007BFF', fontWeight: 'bold', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 15, backgroundColor: '#E1F0FF', marginTop: 10, fontSize: 13 },
  section: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '100%', marginTop: 30, elevation: 1 },
  row: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  label: { fontSize: 12, color: '#999', textTransform: 'uppercase', marginBottom: 5 },
  value: { fontSize: 16, color: '#333', fontWeight: '500' },
  logoutBtn: { marginTop: 40, width: '100%', paddingVertical: 15, borderRadius: 10, borderWidth: 1, borderColor: '#DC3545', alignItems: 'center' },
  logoutText: { color: '#DC3545', fontWeight: 'bold', fontSize: 16 },
});
