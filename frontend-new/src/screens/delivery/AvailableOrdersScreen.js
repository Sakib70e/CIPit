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
  Modal
} from 'react-native';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const TimeSlotPickerModal = ({ visible, onClose, onConfirm, orderId }) => {
  const [selectedSlot, setSelectedSlot] = useState('Morning (9 AM - 12 PM)');
  const [loading, setLoading] = useState(false);

  const slots = [
    'Morning (9 AM - 12 PM)',
    'Afternoon (1 PM - 4 PM)',
    'Evening (5 PM - 8 PM)'
  ];

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(orderId, {
      timeSlot: selectedSlot,
      deliveryDate: new Date().toISOString() // Default to today for now
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
          
          <View style={styles.slotList}>
            {slots.map(slot => (
              <TouchableOpacity 
                key={slot}
                onPress={() => setSelectedSlot(slot)}
                style={[
                  styles.slotOption,
                  selectedSlot === slot && styles.slotOptionSelected
                ]}
              >
                <Ionicons 
                  name={selectedSlot === slot ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={selectedSlot === slot ? COLORS.primary : COLORS.border} 
                />
                <Text style={[
                  styles.slotText,
                  selectedSlot === slot && styles.slotTextSelected
                ]}>{slot}</Text>
              </TouchableOpacity>
            ))}
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
  const [selectedOrderId, setSelectedOrderId] = useState(null);
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

  const handleOpenPicker = (orderId) => {
    setSelectedOrderId(orderId);
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
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
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
        onPress={() => handleOpenPicker(item.id)}
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
        orderId={selectedOrderId}
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
  slotList: {
    marginBottom: 24
  },
  slotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12
  },
  slotOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05'
  },
  slotText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  slotTextSelected: {
    color: COLORS.primary,
    fontWeight: '700'
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

