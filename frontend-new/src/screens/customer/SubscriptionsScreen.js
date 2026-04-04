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
  ScrollView
} from 'react-native';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const CreateSubscriptionModal = ({ visible, onClose, onConfirm, inventory }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState('Daily');
  const [loading, setLoading] = useState(false);

  const frequencies = ['Daily', 'Every 2 Days', 'Weekly', 'Bi-Weekly'];

  const handleConfirm = async () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a product.');
      return;
    }
    setLoading(true);
    await onConfirm({
      itemId: selectedProduct.id,
      quantity,
      frequency
    });
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Subscription</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Product</Text>
              <View style={styles.productGrid}>
                {inventory.map(item => (
                  <TouchableOpacity 
                    key={item.id}
                    onPress={() => setSelectedProduct(item)}
                    style={[
                      styles.productOption,
                      selectedProduct?.id === item.id && styles.productOptionSelected
                    ]}
                  >
                    <Ionicons 
                      name="water" 
                      size={20} 
                      color={selectedProduct?.id === item.id ? COLORS.primary : COLORS.textSecondary} 
                    />
                    <Text style={[
                      styles.productOptionText,
                      selectedProduct?.id === item.id && styles.productOptionTextSelected
                    ]}>{item.itemName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <View style={styles.quantityStepper}>
                <TouchableOpacity 
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  style={styles.stepperBtn}
                >
                  <Ionicons name="remove" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity 
                  onPress={() => setQuantity(quantity + 1)}
                  style={styles.stepperBtn}
                >
                  <Ionicons name="add" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <View style={styles.freqList}>
                {frequencies.map(f => (
                  <TouchableOpacity 
                    key={f}
                    onPress={() => setFrequency(f)}
                    style={[
                      styles.freqOption,
                      frequency === f && styles.freqOptionSelected
                    ]}
                  >
                    <Text style={[
                      styles.freqOptionText,
                      frequency === f && styles.freqOptionTextSelected
                    ]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.subHint}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.hintText}>
                Your first delivery will be scheduled for today or the next eligible day.
              </Text>
            </View>
          </ScrollView>

          <Button 
            title="Start Subscription" 
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
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [subsRes, invRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/inventory')
      ]);
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

  const handleCancelSub = (subId) => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to stop this recurring delivery?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/subscriptions/${subId}`);
              Alert.alert('Success', 'Subscription cancelled.');
              fetchData();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to cancel');
            }
          }
        }
      ]
    );
  };

  const handleToggleSub = async (subId, currentStatus) => {
    try {
      await api.put(`/subscriptions/${subId}`, { active: !currentStatus });
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleCreateSub = async (payload) => {
    try {
      await api.post('/subscriptions', payload);
      Alert.alert('Success 🎉', 'New subscription established.');
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create');
    }
  };

  const renderSub = ({ item }) => (
    <Card style={styles.subCard}>
      <View style={styles.subHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="repeat" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.subInfo}>
          <Text style={styles.itemName}>{item.inventory?.itemName || 'Pure Water'}</Text>
          <View style={styles.freqBadge}>
            <Ionicons name="time-outline" size={12} color={COLORS.primary} />
            <Text style={styles.frequencyText}>{item.frequency}</Text>
          </View>
        </View>
        <Badge status={item.active ? 'ACTIVE' : 'PAUSED'} />
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.detailValue}>{item.quantity} units</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Next Delivery</Text>
          <Text style={styles.detailValue}>
            {new Date(item.nextDeliveryDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button 
          title={item.active ? 'Pause' : 'Resume'} 
          variant={item.active ? 'secondary' : 'success'}
          style={styles.actionBtn} 
          textStyle={styles.actionBtnText}
          onPress={() => handleToggleSub(item.id, item.active)}
        />
        <Button 
          title="Cancel" 
          variant="outline" 
          style={[styles.actionBtn, { borderColor: COLORS.danger }]} 
          textStyle={[styles.actionBtnText, { color: COLORS.danger }]}
          onPress={() => handleCancelSub(item.id)}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <FlatList
          data={subs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSub}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            !refreshing && (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={80} color={COLORS.border} />
                <Text style={styles.emptyTitle}>No Subscriptions</Text>
                <Text style={styles.emptySubtitle}>You don't have any recurring deliveries scheduled.</Text>
                <Button 
                  title="Subscribe Now" 
                  variant="primary" 
                  style={{ marginTop: 20, width: '100%' }}
                  onPress={() => setCreateModalVisible(true)}
                />
              </View>
            )
          }
        />
        
        {subs.length > 0 && (
          <TouchableOpacity 
            style={styles.fab} 
            onPress={() => setCreateModalVisible(true)}
          >
            <Ionicons name="add" size={30} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      <CreateSubscriptionModal 
        visible={createModalVisible}
        inventory={inventory}
        onClose={() => setCreateModalVisible(false)}
        onConfirm={handleCreateSub}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  subCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  subHeader: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 16 
  },
  iconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  subInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  freqBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 4 
  },
  frequencyText: { 
    fontSize: 12, 
    color: COLORS.primary, 
    fontWeight: '700', 
    marginLeft: 4,
    textTransform: 'uppercase'
  },
  detailsRow: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.light, 
    borderRadius: SIZES.radius,
    padding: 12,
    marginBottom: 16
  },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase', fontWeight: '800' },
  detailValue: { fontSize: 14, fontWeight: '800', color: COLORS.dark, marginTop: 4 },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  actionBtn: { 
    flex: 0.48, 
    minHeight: 40, 
    paddingVertical: 8,
    marginVertical: 0
  },
  actionBtnText: { fontSize: 14 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  modalBody: { marginBottom: 24 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 12 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  productOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.light,
    marginRight: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  productOptionSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary
  },
  productOptionText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginLeft: 8 },
  productOptionTextSelected: { color: COLORS.primary, fontWeight: '700' },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 4,
    width: 140
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light
  },
  quantityValue: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: COLORS.dark },
  freqList: { flexDirection: 'row', flexWrap: 'wrap' },
  freqOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.light,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  freqOptionSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary
  },
  freqOptionText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  freqOptionTextSelected: { color: COLORS.primary, fontWeight: '700' },
  subHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    padding: 12,
    borderRadius: 12,
    marginTop: 8
  },
  hintText: { flex: 1, fontSize: 12, color: COLORS.secondary, marginLeft: 8, lineHeight: 18 },
  confirmBtn: { marginTop: 0 }
});


