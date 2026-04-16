import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Badge } from '../../components/Badge';

export const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notiCard, !item.isRead && styles.unreadCard]}
      onPress={() => handleMarkRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: item.isRead ? COLORS.light : COLORS.primary + '15' }]}>
        <Ionicons 
          name={item.title.toLowerCase().includes('order') ? 'cart' : 'notifications'} 
          size={24} 
          color={item.isRead ? COLORS.secondary : COLORS.primary} 
        />
      </View>
      <View style={styles.content}>
        <View style={styles.notiHeader}>
          <Text style={styles.notiTitle}>{item.title}</Text>
          <Text style={styles.notiTime}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <Text style={styles.notiMsg}>{item.message}</Text>
        <Text style={styles.notiDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={() => api.put('/notifications/read-all').then(fetchNotifications)}>
          <Text style={styles.markAll}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchNotifications} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={60} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyMsg}>We'll notify you when your orders move!</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  markAll: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  list: { paddingVertical: 8 },
  notiCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
    backgroundColor: COLORS.white,
    alignItems: 'flex-start'
  },
  unreadCard: { backgroundColor: COLORS.primary + '05' },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  content: { flex: 1 },
  notiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notiTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  notiTime: { fontSize: 12, color: COLORS.textSecondary },
  notiMsg: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  notiDate: { fontSize: 11, color: COLORS.secondary, marginTop: 4, textTransform: 'uppercase' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 10, marginLeft: 8 },
  empty: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark, marginTop: 16 },
  emptyMsg: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 }
});
