import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SHADOWS } from '../../constants/theme';
import { Button } from '../../components/Button';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';

export const CheckoutScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const rawItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);

  // NO FILTERING HERE - Items stay visible even if 0
  const cartItems = React.useMemo(() => rawItems, [rawItems]);
  const totalPrice = React.useMemo(() => cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0), [cartItems]);

  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const getSelectedDateLabel = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(deliveryDate);
    selected.setHours(0, 0, 0, 0);

    if (selected.getTime() === today.getTime()) return 'Deliver Today';
    if (selected.getTime() === today.getTime() + 86400000) return 'Deliver Tomorrow';
    return selected.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
  };

  const handlePlaceOrder = async () => {
    // ONLY FILTER VALID ITEMS AT THE POINT OF SUBMISSION
    const validItems = cartItems.filter(i => i.quantity > 0);
    
    if (validItems.length === 0) {
      Alert.alert('Empty Order', 'Please set a quantity for at least one item.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        items: validItems.map(i => ({ itemId: i.id, quantity: i.quantity })),
        address: address.trim() || undefined,
        deliveryDate: deliveryDate.toISOString()
      };

      await api.post('/orders', payload);
      
      clearCart();
      
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { name: 'Home' },
            { name: 'Orders' }
          ],
        })
      );

      Alert.alert('Success! ✅', 'Your order is being processed.');
    } catch (err) {
      Alert.alert('Checkout Failed', err.response?.data?.message || 'Could not place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Review & Confirm</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 300 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review Selection</Text>
          <View style={styles.itemsCard}>
            {cartItems.map((item, idx) => (
              <View key={item.id} style={[styles.itemRow, idx === cartItems.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemSub}>{item.size} • Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Date</Text>
          <TouchableOpacity 
            style={styles.selectorCard} 
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <View style={styles.selectorInfo}>
              <Text style={styles.selectorValue}>{getSelectedDateLabel()}</Text>
            </View>
            <Ionicons name="create-outline" size={18} color={COLORS.border} />
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ship To</Text>
          <View style={styles.addressCard}>
            <TextInput
              style={styles.addressInput}
              value={address}
              onChangeText={setAddress}
              multiline
              placeholder={user?.address ? `Default: ${user.address}` : "Enter delivery address..."}
              placeholderTextColor={COLORS.secondary}
            />
            {user?.address && !address && (
              <Text style={styles.hintText}>✓ Using your saved profile address.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 110 }]}>
          <View style={styles.summaryBox}>
            <View style={styles.totalRow}>
              <Text style={styles.finalTotalLabel}>Grand Total</Text>
              <Text style={styles.finalTotalVal}>${totalPrice.toFixed(2)}</Text>
            </View>
            <Button 
              title="Confirm Order" 
              onPress={handlePlaceOrder}
              loading={loading}
              style={styles.placeBtn}
              icon={<Ionicons name="shield-checkmark" size={20} color={COLORS.white} />}
            />
          </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.light, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.dark },
  scroll: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: COLORS.secondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  itemsCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 16, ...SHADOWS.light, borderWeight: 1, borderColor: '#f0f0f0' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  itemSub: { fontSize: 13, color: COLORS.secondary, marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '900', color: COLORS.dark },
  selectorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 24, padding: 16, ...SHADOWS.light },
  selectorInfo: { flex: 1, marginLeft: 16 },
  selectorValue: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  addressCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 16, ...SHADOWS.light },
  addressInput: { backgroundColor: COLORS.light, borderRadius: 16, padding: 16, fontSize: 14, fontWeight: '600', color: COLORS.dark, minHeight: 80, textAlignVertical: 'top' },
  hintText: { fontSize: 11, color: COLORS.success, fontWeight: '700', marginTop: 10, marginLeft: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, ...SHADOWS.medium, elevation: 30 },
  summaryBox: { padding: 24 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  finalTotalLabel: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  finalTotalVal: { fontSize: 28, fontWeight: '900', color: COLORS.primary },
  placeBtn: { height: 64, borderRadius: 22, ...SHADOWS.medium }
});
