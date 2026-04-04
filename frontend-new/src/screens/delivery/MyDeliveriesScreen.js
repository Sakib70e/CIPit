import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  Alert,
  StatusBar,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const MyDeliveriesScreen = () => {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterToday, setFilterToday] = useState(false);
  const [timeSlotModal, setTimeSlotModal] = useState({ visible: false, order: null, value: '' });
  const [updating, setUpdating] = useState(false);

  const fetchMyDeliveries = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/orders/tasks');
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Fetch my deliveries error:', error.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyDeliveries();
  }, [fetchMyDeliveries]);

  const handleUpdateStatus = (order) => {
    let nextStatus = '';
    let actionLabel = '';

    if (order.status === 'ASSIGNED') {
      nextStatus = 'OUT_FOR_DELIVERY';
      actionLabel = 'Mark as Out for Delivery';
    } else if (order.status === 'OUT_FOR_DELIVERY') {
      nextStatus = 'DELIVERED';
      actionLabel = 'Mark as Delivered';
    } else {
      Alert.alert('Info', 'This order is already completed.');
      return;
    }

    Alert.alert(
      'Update Status',
      `Ready to update order #${order.id.toString().slice(-6).toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: actionLabel, 
          onPress: async () => {
            try {
              await api.put(`/orders/${order.id}/status`, { status: nextStatus });
              Alert.alert('Updated ✅', `Order is now ${nextStatus.replace(/_/g, ' ')}`);
              fetchMyDeliveries();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Update failed');
            }
          }
        }
      ]
    );
  };

  const handleMarkPayment = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/payment`, { paymentStatus: status });
      Alert.alert('Success', `Payment marked as ${status}`);
      fetchMyDeliveries();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Payment update failed');
    }
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Error', 'Phone number not available');
    }
  };

  const handleOpenMaps = (address) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open maps application.'));
  };

  const handleUpdateTimeSlot = async () => {
    if (!timeSlotModal.order) return;
    try {
      setUpdating(true);
      await api.put(`/orders/${timeSlotModal.order.id}/timeslot`, { timeSlot: timeSlotModal.value });
      Alert.alert('Success', 'Delivery time slot updated.');
      setTimeSlotModal({ visible: false, order: null, value: '' });
      fetchMyDeliveries();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (!filterToday) return true;
    const orderDate = new Date(o.deliveryDate || o.createdAt).toDateString();
    return orderDate === new Date().toDateString();
  });

  const renderDelivery = ({ item }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id.toString().slice(-6).toUpperCase()}</Text>
          <Text style={styles.customerName}>{item.user?.name || 'Customer'}</Text>
        </View>
        <Badge status={item.status} />
      </View>

      <View style={styles.divider} />
      
      <View style={styles.infoGrid}>
        <TouchableOpacity 
          style={styles.infoRow}
          onPress={() => handleCall(item.user?.phone)}
        >
          <View style={[styles.iconBox, { backgroundColor: COLORS.success + '10' }]}>
            <Ionicons name="call" size={16} color={COLORS.success} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.label}>Contact Customer</Text>
            <Text style={[styles.value, { color: COLORS.primary }]}>{item.user?.phone || 'No phone'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.infoRow}
          onPress={() => handleOpenMaps(item.address)}
        >
          <View style={[styles.iconBox, { backgroundColor: COLORS.secondary + '10' }]}>
            <Ionicons name="map" size={16} color={COLORS.secondary} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.label}>Navigate (Tap to Map)</Text>
            <Text style={styles.value} numberOfLines={2}>{item.address}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.scheduleBox}>
        <View style={styles.scheduleItem}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
          <Text style={styles.scheduleText}>
            {new Date(item.deliveryDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.scheduleItem, styles.timeSlotBtn]} 
          onPress={() => setTimeSlotModal({ visible: true, order: item, value: item.timeSlot || '' })}
        >
          <Ionicons name="time-outline" size={14} color={COLORS.primary} />
          <Text style={styles.scheduleText}>{item.timeSlot || 'Anytime'}</Text>
          <Ionicons name="create-outline" size={12} color={COLORS.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <View style={styles.manifest}>
        <Text style={styles.manifestLabel}>Items to Deliver</Text>
        {item.items?.map((orderItem, idx) => (
          <View key={idx} style={styles.manifestRow}>
            <Text style={styles.manifestQty}>{orderItem.quantity}x</Text>
            <Text style={styles.manifestName}>{orderItem.inventory?.itemName || 'Product'}</Text>
            <Text style={styles.manifestPrice}>${(orderItem.price * orderItem.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.manifestTotal}>
          <Text style={styles.totalLabel}>Cash to Collect:</Text>
          <Text style={styles.totalVal}>${(item.totalPrice || 0).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.paymentSection}>
        <Text style={styles.paymentLabel}>Payment Status</Text>
        <Badge status={item.paymentStatus} label={item.paymentStatus} />
      </View>

      <View style={styles.actions}>
        {item.status === 'ASSIGNED' && (
          <TouchableOpacity 
            style={styles.primaryAction} 
            onPress={() => handleUpdateStatus(item)}
          >
            <Ionicons name="bicycle" size={20} color={COLORS.white} />
            <Text style={styles.primaryActionText}>OUT FOR DELIVERY</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'OUT_FOR_DELIVERY' && (
          <TouchableOpacity 
            style={[styles.primaryAction, { backgroundColor: COLORS.success }]} 
            onPress={() => handleUpdateStatus(item)}
          >
            <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
            <Text style={styles.primaryActionText}>MARK AS DELIVERED</Text>
          </TouchableOpacity>
        )}
      </View>

      {item.paymentStatus === 'UNPAID' && (
        <TouchableOpacity 
          style={styles.secondaryAction} 
          onPress={() => handleMarkPayment(item.id, 'PAID')}
        >
          <Ionicons name="cash-outline" size={18} color={COLORS.success} />
          <Text style={styles.secondaryActionText}>CONFIRM PAYMENT RECEIVED</Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
           <Text style={styles.title}>My Deliveries</Text>
           <TouchableOpacity 
             style={[styles.todayToggle, filterToday && styles.todayToggleActive]}
             onPress={() => setFilterToday(!filterToday)}
           >
              <Ionicons name="calendar-outline" size={18} color={filterToday ? COLORS.white : COLORS.primary} />
              <Text style={[styles.todayText, filterToday && { color: COLORS.white }]}>Today</Text>
           </TouchableOpacity>
        </View>
      </View>

      <View style={styles.container}>
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDelivery}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchMyDeliveries} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            !refreshing && (
              <View style={styles.emptyContainer}>
                <Ionicons name="bicycle-outline" size={80} color={COLORS.border} />
                <Text style={styles.emptyTitle}>{filterToday ? "No Tasks Today" : "No Active Tasks"}</Text>
                <Text style={styles.emptySubtitle}>You don't have any assigned deliveries currently{filterToday ? " for today" : ""}. Head to "Available" to find tasks.</Text>
              </View>
            )
          }
        />
      </View>

      <Modal visible={timeSlotModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Time Slot</Text>
            <Text style={styles.modalSub}>{timeSlotModal.order ? `Order #${timeSlotModal.order.id.toString().slice(-6).toUpperCase()}` : ''}</Text>
            <TextInput 
              style={styles.modalInput}
              placeholder="e.g. 9:00 AM - 12:00 PM"
              value={timeSlotModal.value}
              onChangeText={(v) => setTimeSlotModal(prev => ({...prev, value: v}))}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={styles.modalBtnCancel} 
                onPress={() => setTimeSlotModal({ visible: false, order: null, value: '' })}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnSave} 
                onPress={handleUpdateTimeSlot}
                disabled={updating}
              >
                {updating ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.modalBtnSaveText}>Update Slot</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.dark },
  todayToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: COLORS.light, borderWidth: 1, borderColor: COLORS.primary },
  todayToggleActive: { backgroundColor: COLORS.primary },
  todayText: { fontSize: 13, fontWeight: '800', color: COLORS.primary, marginLeft: 8 },
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, paddingBottom: 40 },
  orderCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  orderHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 12 
  },
  orderId: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  customerName: { fontSize: 14, color: COLORS.primary, marginTop: 2, fontWeight: '700' },
  divider: { 
    height: 1, 
    backgroundColor: COLORS.border, 
    marginVertical: 12,
    opacity: 0.5
  },
  infoGrid: {
    marginBottom: 12
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  iconBox: { 
    width: 32, 
    height: 32, 
    borderRadius: 8, 
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  rowContent: { flex: 1 },
  label: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  value: { fontSize: 14, color: COLORS.dark, fontWeight: '600', marginTop: 2 },
  scheduleBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20
  },
  scheduleText: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '700',
    marginLeft: 6
  },
  manifest: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16
  },
  manifestLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase'
  },
  manifestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  manifestQty: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    width: 30
  },
  manifestName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1
  },
  manifestPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  manifestTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderStyle: 'dashed'
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.success
  },
  paymentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary
  },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  actionBtn: { 
    flex: 1, 
    minHeight: 48, 
    marginVertical: 0 
  },
  timeSlotBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  primaryAction: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    flex: 1,
    ...SHADOWS.medium,
  },
  primaryActionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.success,
    marginTop: 12,
    backgroundColor: COLORS.success + '05',
  },
  secondaryActionText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    width: '100%',
    ...SHADOWS.dark,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.dark,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '700',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: COLORS.light,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: COLORS.textSecondary,
    fontWeight: '800',
  },
  modalBtnSave: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  modalBtnSaveText: {
    color: COLORS.white,
    fontWeight: '900',
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 100,
    paddingHorizontal: 40
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: COLORS.dark, 
    marginTop: 20 
  },
  emptySubtitle: { 
    fontSize: 15, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    marginTop: 8,
    lineHeight: 22
  },
});
