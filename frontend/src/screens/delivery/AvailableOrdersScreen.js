import { SafeAreaView } from 'react-native-safe-area-context';
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
  Modal,
  TextInput
} from 'react-native';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const TimeSlotPickerModal = ({ visible, onClose, onConfirm, order }) => {
  const [startHour, setStartHour] = useState('9');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('10');
  const [endPeriod, setEndPeriod] = useState('AM');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!startHour || !endHour) {
      Alert.alert('Error', 'Please enter both start and end times.');
      return;
    }
    setLoading(true);
    const timeSlotStr = `${startHour} ${startPeriod} - ${endHour} ${endPeriod}`;
    
    // BUG FIX: Preservation of the pre-selected customer delivery date.
    // If order.deliveryDate exists (e.g. 30th April), we must NOT default to today.
    const deliveryDate = order?.deliveryDate || new Date().toISOString();
    
    await onConfirm(order.id, {
      timeSlot: timeSlotStr,
      deliveryDate: deliveryDate
    });
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Schedule Delivery</Text>
          <Text style={styles.modalSubtitle}>Pick a time slot for this task</Text>
          
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

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
            <Button 
              title="Confirm & Accept" 
              onPress={handleConfirm}
              loading={loading}
              style={styles.confirmBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const AvailableOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const fetchUnassigned = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/orders/unassigned');
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Fetch unassigned orders error:', error.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUnassigned();
  }, [fetchUnassigned]);

  const handleOpenPicker = (order) => {
    setSelectedOrder(order);
    setPickerVisible(true);
  };

  const onConfirmAssign = async (orderId, payload) => {
    try {
      await api.post(`/orders/${orderId}/assign`, payload);
      Alert.alert('Task Accepted!', 'Head over to "My Deliveries" to start your work.');
      fetchUnassigned();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to assign order');
    }
  };

  const renderOrder = ({ item }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id.toString().slice(-6).toUpperCase()}</Text>
          <Text style={styles.date}>Created: {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Text>
        </View>
        <Text style={styles.price}>${(item.totalPrice || 0).toFixed(2)}</Text>
      </View>

      <View style={styles.divider} />
      
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Ionicons name="person-outline" size={18} color={COLORS.primary} />
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{item.user?.name || 'Guest'}</Text>
        </View>
      </View>

      {item.deliveryDate && (
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: COLORS.warning + '10' }]}>
            <Ionicons name="calendar" size={18} color={COLORS.warning} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.label}>Requested Delivery Date</Text>
            <Text style={[styles.value, { color: COLORS.warning }]}>
              {new Date(item.deliveryDate).toDateString()}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Ionicons name="location-outline" size={18} color={COLORS.primary} />
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value} numberOfLines={2}>{item.address}</Text>
        </View>
      </View>

      <View style={styles.manifest}>
        <Text style={styles.manifestLabel}>Manifest</Text>
        {item.items?.map((orderItem, idx) => (
          <Text key={idx} style={styles.manifestItem}>
            • {orderItem.quantity}x {orderItem.inventory?.itemName || 'Product'}
          </Text>
        ))}
      </View>

      <Button 
        title="Accept Task" 
        onPress={() => handleOpenPicker(item)}
        variant="success"
        style={styles.assignBtn}
        icon={<Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />}
      />
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
           <Text style={styles.title}>Inbound Tasks</Text>
           <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
        </View>
      </View>
      <View style={styles.container}>
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchUnassigned} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            !refreshing && (
              <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-outline" size={80} color={COLORS.border} />
                <Text style={styles.emptyTitle}>No New Tasks</Text>
                <Text style={styles.emptySubtitle}>There are no unassigned orders at the moment. Please check back later.</Text>
              </View>
            )
          }
        />
      </View>

      <TimeSlotPickerModal 
        visible={pickerVisible}
        order={selectedOrder}
        onClose={() => setPickerVisible(false)}
        onConfirm={onConfirmAssign}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.dark },
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
  date: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  price: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  divider: { 
    height: 1, 
    backgroundColor: COLORS.border, 
    marginVertical: 12,
    opacity: 0.5
  },
  row: { 
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
  manifest: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16
  },
  manifestLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  manifestItem: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '600',
    marginBottom: 2
  },
  assignBtn: { marginTop: 0 },
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.dark
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.dark,
    textAlign: 'center'
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  timeColumn: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.light,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
    marginRight: 8,
  },
  periodToggle: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  periodBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  periodBtnActive: {
    backgroundColor: COLORS.primary,
  },
  periodText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  periodTextActive: {
    color: COLORS.white,
  },
  timeTo: {
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  timeToText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cancelLink: {
    padding: 12
  },
  cancelLinkText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 15
  },
  confirmBtn: {
    flex: 1,
    marginLeft: 20,
    marginTop: 0
  }
});
