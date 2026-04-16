import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  Alert,
  StatusBar,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { OrderModal } from '../../components/OrderModal';
import { useAuthStore } from '../../store/useAuthStore';

const StatusBadge = ({ status }) => {
  const getColors = () => {
    switch (status) {
      case 'DELIVERED': return { bg: COLORS.success + '15', text: COLORS.success, icon: 'checkmark-circle' };
      case 'CANCELLED': return { bg: COLORS.danger + '15', text: COLORS.danger, icon: 'close-circle' };
      case 'ASSIGNED': return { bg: COLORS.primary + '15', text: COLORS.primary, icon: 'bicycle' };
      case 'OUT_FOR_DELIVERY': return { bg: COLORS.warning + '15', text: COLORS.warning, icon: 'car' };
      default: return { bg: COLORS.light, text: COLORS.secondary, icon: 'time' };
    }
  };
  const colors = getColors();
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Ionicons name={colors.icon} size={12} color={colors.text} style={{ marginRight: 4 }} />
      <Text style={[styles.badgeText, { color: colors.text }]}>{status.replace(/_/g, ' ')}</Text>
    </View>
  );
};

export const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // ACTIVE, COMPLETED, CANCELLED
  const [editingOrder, setEditingOrder] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  const user = useAuthStore(s => s.user);

  const fetchOrders = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/orders/me');
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Fetch orders error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (activeTab === 'ACTIVE') return ['PENDING', 'ASSIGNED', 'OUT_FOR_DELIVERY'].includes(o.status);
      if (activeTab === 'COMPLETED') return o.status === 'DELIVERED';
      if (activeTab === 'CANCELLED') return o.status === 'CANCELLED';
      return true;
    });
  }, [orders, activeTab]);

  const handleCancelOrder = (orderId) => {
    Alert.alert('Cancel Order', 'Stop this delivery?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          await api.put(`/orders/${orderId}/cancel`);
          fetchOrders();
        } catch (err) { Alert.alert('Error', 'Failed to cancel'); }
      }}
    ]);
  };

  const handleEditConfirm = async (payload) => {
    try {
      await api.put(`/orders/${editingOrder.id}`, payload);
      Alert.alert('Updated! ✨', 'Your order details have been saved.');
      fetchOrders();
    } catch (err) { Alert.alert('Update Failed', 'Could not save changes.'); }
  };

  const handleCall = (phone) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const renderOrder = ({ item }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>ID: #{item.id?.toString().slice(-4).toUpperCase() || 'NEW'}</Text>
          <Text style={styles.orderDate}>
            Delivery: {new Date(item.deliveryDate || item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.divider} />

      {item.items?.map((oi, idx) => (
        <View key={idx} style={styles.itemLine}>
          <Text style={styles.itemQty}>{oi.quantity}x</Text>
          <Text style={styles.itemName} numberOfLines={1}>{oi.inventory?.itemName} ({oi.inventory?.size})</Text>
          <Text style={styles.itemPrice}>${(oi.price * oi.quantity).toFixed(2)}</Text>
        </View>
      ))}

      {/* DELIVERY AGENT INFO */}
      {item.deliveryAgent && (
        <View style={styles.agentBox}>
          <View style={styles.agentInfo}>
             <Ionicons name="person-circle" size={32} color={COLORS.primary} />
             <View style={{ marginLeft: 10 }}>
                <Text style={styles.agentLabel}>Delivery Specialist</Text>
                <Text style={styles.agentName}>{item.deliveryAgent.name}</Text>
             </View>
          </View>
          <TouchableOpacity style={styles.callAgent} onPress={() => handleCall(item.deliveryAgent.phone)}>
             <Ionicons name="call" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.addressLine, { marginTop: 12 }]}>
        <Ionicons name="location-outline" size={14} color={COLORS.secondary} />
        <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
      </View>

      {/* TIME SLOT & PAYMENT STATUS */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={COLORS.secondary} />
          <Text style={styles.metaText}>{item.timeSlot || 'Assigning soon...'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="cash-outline" size={14} color={item.paymentStatus === 'PAID' ? COLORS.success : COLORS.danger} />
          <Text style={[styles.metaText, { color: item.paymentStatus === 'PAID' ? COLORS.success : COLORS.danger }]}>
            {item.paymentStatus}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.totalPrice}>Total: ${(item.totalPrice || 0).toFixed(2)}</Text>
        <View style={styles.actions}>
          {(item.status === 'PENDING' || item.status === 'ASSIGNED') && (
            <>
              <TouchableOpacity style={styles.editBtn} onPress={() => { setEditingOrder(item); setEditModalVisible(true); }}>
                <Ionicons name="pencil" size={16} color={COLORS.primary} />
                <Text style={styles.btnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelOrder(item.id)}>
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              </TouchableOpacity>
            </>
          )}
          {item.status === 'DELIVERED' && (
            <TouchableOpacity style={styles.reorderBtn} onPress={() => navigation.navigate('Reorder', { previousOrder: item })}>
              <Text style={styles.reorderText}>Reorder</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screenHeader}>
        <Text style={styles.title}>History</Text>
        
        <View style={styles.tabs}>
          {['ACTIVE', 'COMPLETED', 'CANCELLED'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'ACTIVE' ? 'In Progress' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchOrders} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={60} color={COLORS.border} />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} orders found.</Text>
            </View>
          )
        }
      />

      {editingOrder && (
        <OrderModal 
          visible={editModalVisible}
          item={editingOrder.items[0]?.inventory}
          userAddress={user?.address}
          initialData={{
            quantity: editingOrder.items[0]?.quantity,
            address: editingOrder.address,
            email: editingOrder.email,
            deliveryDate: editingOrder.deliveryDate
          }}
          onClose={() => setEditModalVisible(false)}
          onConfirm={handleEditConfirm}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  screenHeader: { padding: 16, backgroundColor: COLORS.white },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.dark, marginBottom: 16 },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.light, borderRadius: 14, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: COLORS.white, ...SHADOWS.light },
  tabText: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  activeTabText: { color: COLORS.primary },
  list: { padding: 16, paddingBottom: 100, backgroundColor: COLORS.background },
  orderCard: { marginBottom: 16, padding: 16, borderRadius: 24, backgroundColor: COLORS.white, ...SHADOWS.light },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 14, fontWeight: '800', color: COLORS.dark },
  orderDate: { fontSize: 11, color: COLORS.secondary, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: COLORS.light, marginVertical: 12 },
  itemLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemQty: { fontSize: 13, fontWeight: '800', color: COLORS.primary, width: 30 },
  itemName: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.dark },
  itemPrice: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  agentBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.light, padding: 12, borderRadius: 16, marginTop: 12 },
  agentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  agentLabel: { fontSize: 10, fontWeight: '800', color: COLORS.secondary, textTransform: 'uppercase' },
  agentName: { fontSize: 14, fontWeight: '900', color: COLORS.dark },
  callAgent: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center' },
  addressLine: { flexDirection: 'row', alignItems: 'center' },
  addressText: { flex: 1, color: COLORS.textSecondary, fontSize: 12, marginLeft: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: COLORS.secondary, fontWeight: '700', marginLeft: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.light },
  totalPrice: { fontSize: 16, fontWeight: '900', color: COLORS.dark },
  actions: { flexDirection: 'row', alignItems: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginRight: 8 },
  btnText: { color: COLORS.primary, fontWeight: '800', fontSize: 12, marginLeft: 4 },
  cancelBtn: { padding: 6, backgroundColor: COLORS.danger + '05', borderRadius: 10 },
  reorderBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.primary, borderRadius: 10 },
  reorderText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, marginTop: 12 }
});
