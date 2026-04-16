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
  ScrollView,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const CreateSubscriptionModal = ({ visible, onClose, onConfirm, inventory, initialData }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [freqType, setFreqType] = useState('DAILY'); // DAILY, INTERVAL, CUSTOM_DAYS
  const [interval, setInterval] = useState('2');
  const [activeDays, setActiveDays] = useState([]);
  const [loading, setLoading] = useState(false);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    if (visible && initialData) {
      const prod = inventory.find(i => i.id === initialData.itemId);
      setSelectedProduct(prod || null);
      setQuantity(initialData.quantity?.toString() || '1');
      if (initialData.intervalDays) {
        setFreqType('INTERVAL');
        setInterval(initialData.intervalDays.toString());
      } else if (initialData.activeDays) {
        setFreqType('CUSTOM_DAYS');
        setActiveDays(initialData.activeDays.split(','));
      } else {
        setFreqType('DAILY');
      }
    } else if (visible) {
      setSelectedProduct(null);
      setQuantity('1');
      setFreqType('DAILY');
      setInterval('2');
      setActiveDays([]);
    }
  }, [visible, initialData, inventory]);

  const toggleDay = (day) => {
    setActiveDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleConfirm = async () => {
    if (!selectedProduct) {
      Alert.alert('Selection Required', 'Please choose a product.');
      return;
    }

    const qtyNum = parseInt(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a positive number.');
      return;
    }

    let payload = {
      itemId: selectedProduct.id,
      quantity: qtyNum,
      frequency: freqType === 'DAILY' ? 'Daily' : 
                 freqType === 'INTERVAL' ? `Every ${interval} days` : 
                 `Weekly: ${activeDays.join(', ')}`,
      intervalDays: freqType === 'INTERVAL' ? parseInt(interval) : null,
      activeDays: freqType === 'CUSTOM_DAYS' ? activeDays.join(',') : null
    };

    setLoading(true);
    await onConfirm(payload);
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initialData ? 'Edit Schedule' : 'Set Schedule'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.groupLabel}>SELECT PRODUCT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productScroll}>
              {inventory.map(item => (
                <TouchableOpacity 
                  key={item.id}
                  onPress={() => setSelectedProduct(item)}
                  style={[styles.prodCard, selectedProduct?.id === item.id && styles.prodCardActive]}
                >
                  <Ionicons name="water" size={24} color={selectedProduct?.id === item.id ? COLORS.primary : COLORS.secondary} />
                  <Text style={[styles.prodName, selectedProduct?.id === item.id && styles.prodNameActive]}>{item.itemName}</Text>
                  <Text style={styles.prodSize}>{item.size}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.inputGroup}>
              <Text style={styles.groupLabel}>DAILY QUANTITY (OVER 1000 SUPPORTED)</Text>
              <View style={styles.qtyBox}>
                <TouchableOpacity onPress={() => setQuantity(Math.max(1, (parseInt(quantity)||1)-1).toString())}>
                  <Ionicons name="remove-circle-outline" size={32} color={COLORS.primary} />
                </TouchableOpacity>
                <TextInput 
                  style={styles.qtyInput} 
                  value={quantity} 
                  onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ''))} 
                  keyboardType="numeric" 
                />
                <TouchableOpacity onPress={() => setQuantity(((parseInt(quantity)||1)+1).toString())}>
                  <Ionicons name="add-circle-outline" size={32} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.groupLabel}>FREQUENCY</Text>
            <View style={styles.freqTabs}>
              {['DAILY', 'INTERVAL', 'CUSTOM_DAYS'].map(t => (
                <TouchableOpacity 
                  key={t}
                  onPress={() => setFreqType(t)}
                  style={[styles.freqTab, freqType === t && styles.freqTabActive]}
                >
                  <Text style={[styles.freqTabText, freqType === t && styles.freqTabTextActive]}>
                    {t === 'DAILY' ? 'Daily' : t === 'INTERVAL' ? 'Interval' : 'Custom'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {freqType === 'INTERVAL' && (
              <View style={styles.subInput}>
                <Text style={styles.subLabel}>Deliver every X days</Text>
                <View style={styles.intervalBox}>
                  <Text style={styles.intervalText}>Every</Text>
                  <TextInput style={styles.intervalInput} value={interval} onChangeText={setInterval} keyboardType="numeric" />
                  <Text style={styles.intervalText}>days</Text>
                </View>
              </View>
            )}

            {freqType === 'CUSTOM_DAYS' && (
              <View style={styles.subInput}>
                <Text style={styles.subLabel}>Select days</Text>
                <View style={styles.daysGrid}>
                  {days.map(d => (
                    <TouchableOpacity 
                      key={d} 
                      onPress={() => toggleDay(d)}
                      style={[styles.dayCircle, activeDays.includes(d) && styles.dayCircleActive]}
                    >
                      <Text style={[styles.dayText, activeDays.includes(d) && styles.dayTextActive]}>{d[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <Button 
            title={initialData ? "Apply Changes" : "Activate Schedule"} 
            onPress={handleConfirm}
            loading={loading}
            style={styles.confirmBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

export const SubscriptionsScreen = () => {
  const [subs, setSubs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSub, setEditingSub] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [subsRes, invRes] = await Promise.all([api.get('/subscriptions'), api.get('/inventory')]);
      setSubs(subsRes.data.data || []);
      setInventory(invRes.data.data || []);
    } catch (e) {
      console.log('Error fetching subscriptions', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteSub = (subId) => {
    Alert.alert('Cancel Schedule', 'Stop all future deliveries for this item?', [
      { text: 'Keep It', style: 'cancel' },
      { text: 'Stop Delivery', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/subscriptions/${subId}`);
          fetchData();
        } catch (err) { Alert.alert('Error', 'Failed to update schedule'); }
      }}
    ]);
  };

  const handleCreateOrUpdateSub = async (payload) => {
    try {
      if (editingSub) {
        await api.put(`/subscriptions/${editingSub.id}`, payload);
        Alert.alert('Updated ✨', 'Your delivery schedule has been modified.');
      } else {
        await api.post('/subscriptions', payload);
        Alert.alert('Activated 🚀', 'Weekly deliveries are now on autopilot!');
      }
      fetchData();
    } catch (err) {
      Alert.alert('Failed', err.response?.data?.message || 'Validation error. Please check inputs.');
    }
  };

  const renderSub = ({ item }) => (
    <Card style={styles.subCard}>
      <View style={styles.subHeader}>
        <View style={styles.prodIcon}>
          <Ionicons name="calendar" size={24} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.subName} numberOfLines={1}>{item.inventory?.itemName}</Text>
          <Text style={styles.subFreq}>{item.frequency}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.statusToggle, { backgroundColor: item.active ? COLORS.success + '15' : COLORS.border }]}
          onPress={async () => {
            await api.put(`/subscriptions/${item.id}`, { active: !item.active });
            fetchData();
          }}
        >
          <Text style={[styles.statusToggleText, { color: item.active ? COLORS.success : COLORS.secondary }]}>
            {item.active ? 'ACTIVE' : 'PAUSED'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subStats}>
        <View style={styles.subStatItem}>
          <Text style={styles.statLabel}>Next Delivery</Text>
          <Text style={styles.statVal}>{item.active ? new Date(item.nextDeliveryDate).toLocaleDateString([], { day: 'numeric', month: 'short' }) : 'Paused'}</Text>
        </View>
        <View style={styles.subStatItem}>
          <Text style={styles.statLabel}>Quantity</Text>
          <Text style={styles.statVal}>{item.quantity} Units</Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editAction} onPress={() => { setEditingSub(item); setModalVisible(true); }}>
          <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
          <Text style={styles.editActionText}>Edit Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteAction} onPress={() => handleDeleteSub(item.id)}>
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Schedules</Text>
        <Text style={styles.screenSubtitle}>Manage your recurring water supply</Text>
      </View>

      <FlatList
        data={subs}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSub}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          !refreshing && (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={80} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No Active Plans</Text>
              <Text style={styles.emptyMsg}>Set up a recurring delivery and never worry about water again.</Text>
              <Button title="Create Plan" onPress={() => { setEditingSub(null); setModalVisible(true); }} style={{ marginTop: 24, width: '100%' }} />
            </View>
          )
        }
      />
      
      {subs.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => { setEditingSub(null); setModalVisible(true); }}>
          <Ionicons name="add" size={32} color={COLORS.white} />
        </TouchableOpacity>
      )}

      <CreateSubscriptionModal 
        visible={modalVisible}
        inventory={inventory}
        initialData={editingSub}
        onClose={() => setModalVisible(false)}
        onConfirm={handleCreateOrUpdateSub}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  screenHeader: { padding: 20, backgroundColor: COLORS.white },
  screenTitle: { fontSize: 28, fontWeight: '900', color: COLORS.dark },
  screenSubtitle: { fontSize: 13, color: COLORS.secondary, marginTop: 4 },
  list: { padding: 16, paddingBottom: 120, backgroundColor: COLORS.background },
  subCard: { padding: 20, marginBottom: 16, borderRadius: 28, backgroundColor: COLORS.white, ...SHADOWS.light },
  subHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  prodIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: COLORS.primary+'08', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  subName: { fontSize: 17, fontWeight: '800', color: COLORS.dark },
  subFreq: { fontSize: 13, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  statusToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusToggleText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  subStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.light, paddingTop: 16, marginBottom: 16 },
  subStatItem: { flex: 1 },
  statLabel: { fontSize: 10, color: COLORS.secondary, fontWeight: '800', textTransform: 'uppercase' },
  statVal: { fontSize: 16, fontWeight: '800', color: COLORS.dark, marginTop: 4 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.light, paddingTop: 12, justifyContent: 'space-between', alignItems: 'center' },
  editAction: { flexDirection: 'row', alignItems: 'center' },
  editActionText: { marginLeft: 6, fontSize: 14, fontWeight: '700', color: COLORS.primary },
  deleteAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.danger + '08', borderRadius: 12 },
  fab: { position: 'absolute', bottom: 120, right: 24, width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium },
  empty: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: COLORS.dark, marginTop: 20 },
  emptyMsg: { fontSize: 14, color: COLORS.secondary, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 24, maxHeight: '92%', ...SHADOWS.dark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.dark },
  modalBody: { marginBottom: 24 },
  groupLabel: { fontSize: 11, fontWeight: '900', color: COLORS.secondary, marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' },
  productScroll: { marginBottom: 24 },
  prodCard: { padding: 16, borderRadius: 18, backgroundColor: COLORS.light, marginRight: 12, alignItems: 'center', width: 120, borderWidth: 1, borderColor: 'transparent' },
  prodCardActive: { backgroundColor: COLORS.primary+'08', borderColor: COLORS.primary },
  prodName: { fontSize: 14, fontWeight: '800', color: COLORS.secondary, marginTop: 10, textAlign: 'center' },
  prodNameActive: { color: COLORS.primary },
  prodSize: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.light, borderRadius: 20, padding: 8, width: 180 },
  qtyInput: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '900', color: COLORS.dark },
  freqTabs: { flexDirection: 'row', backgroundColor: COLORS.light, borderRadius: 16, padding: 5, marginBottom: 24 },
  freqTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14 },
  freqTabActive: { backgroundColor: COLORS.white, ...SHADOWS.light },
  freqTabText: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  freqTabTextActive: { color: COLORS.primary, fontWeight: '900' },
  subInput: { marginBottom: 24 },
  subLabel: { fontSize: 16, fontWeight: '800', color: COLORS.dark, marginBottom: 12 },
  intervalBox: { flexDirection: 'row', alignItems: 'center' },
  intervalInput: { backgroundColor: COLORS.light, width: 70, height: 48, borderRadius: 15, textAlign: 'center', fontSize: 20, fontWeight: '900', marginHorizontal: 12, color: COLORS.primary },
  intervalText: { fontSize: 16, color: COLORS.secondary, fontWeight: '700' },
  daysGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.light, justifyContent: 'center', alignItems: 'center' },
  dayCircleActive: { backgroundColor: COLORS.primary },
  dayText: { fontSize: 14, fontWeight: '900', color: COLORS.secondary },
  dayTextActive: { color: COLORS.white },
  confirmBtn: { marginBottom: 20 }
});
