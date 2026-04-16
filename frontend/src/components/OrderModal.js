import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Button } from './Button';
import DateTimePicker from '@react-native-community/datetimepicker';

export const OrderModal = ({ 
  visible, 
  item, 
  onClose, 
  onConfirm, 
  userAddress,
  initialData 
}) => {
  const [quantity, setQuantity] = useState('1');
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setQuantity(initialData.quantity?.toString() || '1');
        setAddress(initialData.address || ''); // Leave empty if same as profile
        setDeliveryDate(initialData.deliveryDate ? new Date(initialData.deliveryDate) : new Date());
      } else {
        setQuantity('1');
        setAddress(''); // Default to empty (use profile)
        setDeliveryDate(new Date());
      }
      setStep(1);
    }
  }, [visible, initialData]);

  const getSelectedLabel = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(deliveryDate);
    selected.setHours(0, 0, 0, 0);

    if (selected.getTime() === today.getTime()) return 'Today';
    if (selected.getTime() === today.getTime() + 86400000) return 'Tomorrow';
    return selected.toLocaleDateString();
  };

  const handleConfirm = async () => {
    const qtyInt = parseInt(quantity);
    if (isNaN(qtyInt) || qtyInt <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive number.');
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    // If address is empty, it will fallback to user address in the backend
    await onConfirm({
      items: [{ itemId: item.id, quantity: qtyInt }],
      address: address.trim() || undefined,
      deliveryDate: deliveryDate.toISOString()
    });
    setLoading(false);
    onClose();
  };

  const updateQty = (delta) => {
    const current = parseInt(quantity) || 0;
    const next = Math.max(1, current + delta);
    setQuantity(next.toString());
  };

  if (!item) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>
                {initialData ? 'Update Order' : (step === 1 ? 'Configure Delivery' : 'Final Review')}
              </Text>
              <Text style={styles.modalSubtitle}>{item.itemName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {step === 1 ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>QUANTITY (UNITS)</Text>
                  <View style={styles.qtyContainer}>
                    <TouchableOpacity style={styles.qtyStep} onPress={() => updateQty(-1)}>
                      <Ionicons name="remove" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.qtyInput}
                      value={quantity}
                      onChangeText={(val) => setQuantity(val.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      placeholder="e.g. 5000"
                    />
                    <TouchableOpacity style={styles.qtyStep} onPress={() => updateQty(1)}>
                      <Ionicons name="add" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>DELIVERY DATE</Text>
                  <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.dateValue}>{getSelectedLabel()}</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.secondary} />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={deliveryDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      minimumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (selectedDate) setDeliveryDate(selectedDate);
                      }}
                    />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>DELIVERY ADDRESS (OPTIONAL OVERRIDE)</Text>
                  <TextInput
                    style={styles.textArea}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    placeholder={userAddress ? `Default: ${userAddress}` : "Enter delivery address..."}
                  />
                  {userAddress && !address && (
                    <Text style={styles.hint}>Using your saved profile address.</Text>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.recapCard}>
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>Item</Text>
                  <Text style={styles.recapVal}>{item.itemName} ({item.size})</Text>
                </View>
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>Qty</Text>
                  <Text style={styles.recapVal}>{quantity} Units</Text>
                </View>
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>Delivery</Text>
                  <Text style={styles.recapVal}>{getSelectedLabel()}</Text>
                </View>
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>Address</Text>
                  <Text style={styles.recapVal} numberOfLines={2}>
                    {address.trim() || userAddress || 'Address not set'}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Amount Due</Text>
                  <Text style={styles.totalVal}>${(item.price * (parseInt(quantity)||0)).toFixed(2)}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <Button
            title={step === 1 ? "Review Order" : (initialData ? "Save Changes" : "Confirm Order")}
            onPress={handleConfirm}
            loading={loading}
            style={styles.actionBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', padding: 20 },
  content: { 
    backgroundColor: COLORS.white, 
    borderRadius: 32, 
    padding: 24, 
    maxHeight: '85%',
    ...SHADOWS.medium 
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.dark },
  modalSubtitle: { fontSize: 14, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  closeBtn: { padding: 4 },
  body: { marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: COLORS.secondary, marginBottom: 8, letterSpacing: 0.5 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.light, borderRadius: 18, padding: 6 },
  qtyStep: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', ...SHADOWS.light },
  qtyInput: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: COLORS.dark },
  dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.light, borderRadius: 18, padding: 16 },
  dateValue: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: COLORS.dark },
  textArea: { backgroundColor: COLORS.light, borderRadius: 18, padding: 16, fontSize: 15, color: COLORS.dark, minHeight: 80, textAlignVertical: 'top' },
  hint: { fontSize: 11, color: COLORS.success, marginTop: 6, fontWeight: '600' },
  actionBtn: { marginTop: 10 },
  recapCard: { padding: 12 },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  recapLabel: { fontSize: 14, color: COLORS.secondary, fontWeight: '600' },
  recapVal: { fontSize: 14, fontWeight: '700', color: COLORS.dark, flex: 1, textAlign: 'right', marginLeft: 20 },
  divider: { height: 1, backgroundColor: COLORS.border + '50', marginVertical: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  totalVal: { fontSize: 24, fontWeight: '900', color: COLORS.primary }
});
