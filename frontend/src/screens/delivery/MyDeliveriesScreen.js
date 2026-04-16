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
import { COLORS, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const MyDeliveriesScreen = () => {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterToday, setFilterToday] = useState(false);
  const [timeSlotModal, setTimeSlotModal] = useState({ visible: false, order: null });
  const [startHour, setStartHour] = useState('9');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('10');
  const [endPeriod, setEndPeriod] = useState('AM');
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
    if (!startHour || !endHour) {
      Alert.alert('Error', 'Please enter both start and end times.');
      return;
    }
    const timeSlotStr = `${startHour} ${startPeriod} - ${endHour} ${endPeriod}`;
    try {
      setUpdating(true);
      // CORRECTED ROUTE: /delivery-info instead of /timeslot
      await api.put(`/orders/${timeSlotModal.order.id}/delivery-info`, { timeSlot: timeSlotStr });
      Alert.alert('Success ✨', 'Customer has been notified of the time slot.');
      setTimeSlotModal({ visible: false, order: null });
      fetchMyDeliveries();
    } catch (err) {
      Alert.alert('Routing Error', err.response?.data?.message || 'Update failed. Check connection.');
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
          <Ionicons name="calendar" size={16} color={COLORS.primary} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.scheduleLabel}>Delivery Date</Text>
            <Text style={styles.scheduleText}>
              {new Date(item.deliveryDate || item.createdAt).toLocaleDateString(undefined, { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.scheduleItem, styles.timeSlotBtn]} 
          onPress={() => {
            setStartHour('9');
            setStartPeriod('AM');
            setEndHour('10');
            setEndPeriod('AM');
            setTimeSlotModal({ visible: true, order: item });
          }}
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
           <Text style={styles.title}>My Tasks</Text>
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
                <Text style={styles.emptySubtitle}>You don't have any assigned deliveries specifically for today.</Text>
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
            <View style={styles.timePickerContainer}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>Start</Text>
                <View style={styles.timeInputRow}>
                  <TextInput 
                    style={styles.timeInput}
                    value={startHour}
                    onChangeText={setStartHour}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <View style={styles.periodToggle}>
                    <TouchableOpacity style={[styles.periodBtn, startPeriod === 'AM' && styles.periodBtnActive]} onPress={() => setStartPeriod('AM')}>
                      <Text style={[styles.periodText, startPeriod === 'AM' && styles.periodTextActive]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.periodBtn, startPeriod === 'PM' && styles.periodBtnActive]} onPress={() => setStartPeriod('PM')}>
                      <Text style={[styles.periodText, startPeriod === 'PM' && styles.periodTextActive]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.timeTo}><Text style={styles.timeToText}>to</Text></View>

              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>End</Text>
                <View style={styles.timeInputRow}>
                  <TextInput 
                    style={styles.timeInput}
                    value={endHour}
                    onChangeText={setEndHour}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <View style={styles.periodToggle}>
                    <TouchableOpacity style={[styles.periodBtn, endPeriod === 'AM' && styles.periodBtnActive]} onPress={() => setEndPeriod('AM')}>
                      <Text style={[styles.periodText, endPeriod === 'AM' && styles.periodTextActive]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.periodBtn, endPeriod === 'PM' && styles.periodBtnActive]} onPress={() => setEndPeriod('PM')}>
                      <Text style={[styles.periodText, endPeriod === 'PM' && styles.periodTextActive]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={styles.modalBtnCancel} 
                onPress={() => setTimeSlotModal({ visible: false, order: null })}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnSave} 
                onPress={handleUpdateTimeSlot}
                disabled={updating}
              >
                {updating ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.modalBtnSaveText}>Save Slot</Text>}
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
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.dark },
  todayToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: COLORS.light, borderWidth: 1, borderColor: COLORS.primary },
  todayToggleActive: { backgroundColor: COLORS.primary },
  todayText: { fontSize: 13, fontWeight: '800', color: COLORS.primary, marginLeft: 8 },
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, paddingBottom: 60 },
  orderCard: { padding: 20, marginBottom: 16, borderRadius: 28, backgroundColor: COLORS.white, ...SHADOWS.medium },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderId: { fontSize: 17, fontWeight: '800', color: COLORS.dark },
  customerName: { fontSize: 15, color: COLORS.primary, marginTop: 2, fontWeight: '800' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14, opacity: 0.3 },
  infoGrid: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowContent: { flex: 1 },
  label: { fontSize: 10, color: COLORS.secondary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 14, color: COLORS.dark, fontWeight: '700', marginTop: 1 },
  scheduleBox: { flexDirection: 'row', backgroundColor: COLORS.light, borderRadius: 16, padding: 14, marginBottom: 18 },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', marginRight: 24, flex: 1 },
  scheduleLabel: { fontSize: 10, fontWeight: '800', color: COLORS.secondary, textTransform: 'uppercase', marginBottom: 2 },
  scheduleText: { fontSize: 13, color: COLORS.dark, fontWeight: '800' },
  manifest: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f0f0f0', marginBottom: 18 },
  manifestLabel: { fontSize: 10, fontWeight: '900', color: COLORS.secondary, marginBottom: 14, textTransform: 'uppercase' },
  manifestRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  manifestQty: { fontSize: 14, fontWeight: '900', color: COLORS.primary, width: 34 },
  manifestName: { fontSize: 14, fontWeight: '700', color: COLORS.dark, flex: 1 },
  manifestPrice: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  manifestTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f0f0f0', borderStyle: 'dotted' },
  totalLabel: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  totalVal: { fontSize: 20, fontWeight: '900', color: COLORS.success },
  paymentSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  paymentLabel: { fontSize: 15, fontWeight: '800', color: COLORS.secondary },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  timeSlotBtn: { borderWidth: 1, borderColor: COLORS.primary + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  primaryAction: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 20, flex: 1, ...SHADOWS.medium },
  primaryActionText: { color: COLORS.white, fontSize: 15, fontWeight: '900', marginLeft: 10 },
  secondaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 20, borderWeight: 2, borderColor: COLORS.success, marginTop: 14, backgroundColor: COLORS.success + '05', borderStyle: 'dashed', borderWidth: 1.5 },
  secondaryActionText: { color: COLORS.success, fontSize: 14, fontWeight: '800', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 32, padding: 24, width: '100%', ...SHADOWS.dark },
  modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.dark, textAlign: 'center' },
  modalSub: { fontSize: 13, color: COLORS.secondary, textAlign: 'center', marginTop: 4, fontWeight: '800', marginBottom: 24 },
  timePickerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  timeColumn: { flex: 1 },
  timeLabel: { fontSize: 11, fontWeight: '900', color: COLORS.secondary, marginBottom: 8, textTransform: 'uppercase' },
  timeInputRow: { flexDirection: 'row', alignItems: 'center' },
  timeInput: { flex: 1, height: 50, backgroundColor: COLORS.light, borderRadius: 14, textAlign: 'center', fontSize: 20, fontWeight: '900', color: COLORS.dark, marginRight: 10 },
  periodToggle: { backgroundColor: COLORS.light, borderRadius: 14, flexDirection: 'column', overflow: 'hidden' },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  periodBtnActive: { backgroundColor: COLORS.primary },
  periodText: { fontSize: 11, fontWeight: '900', color: COLORS.secondary },
  periodTextActive: { color: COLORS.white },
  timeTo: { paddingHorizontal: 12, paddingTop: 24 },
  timeToText: { fontSize: 15, fontWeight: '700', color: COLORS.secondary },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtnCancel: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  modalBtnCancelText: { color: COLORS.secondary, fontWeight: '900' },
  modalBtnSave: { flex: 2, backgroundColor: COLORS.primary, borderRadius: 18, paddingVertical: 16, alignItems: 'center', ...SHADOWS.medium },
  modalBtnSaveText: { color: COLORS.white, fontWeight: '900' },
  emptyContainer: { alignItems: 'center', marginTop: 120, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: COLORS.dark, marginTop: 24 },
  emptySubtitle: { fontSize: 16, color: COLORS.secondary, textAlign: 'center', marginTop: 10, lineHeight: 24 }
});
