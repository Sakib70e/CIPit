import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import api from '../../services/api';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export const ReorderScreen = ({ route, navigation }) => {
  const { previousOrder } = route.params;
  const [quantity, setQuantity] = useState(previousOrder.items?.[0]?.quantity?.toString() || '1');
  const [address, setAddress] = useState(previousOrder.address || '');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    const qtyInt = parseInt(quantity);
    if (isNaN(qtyInt) || qtyInt <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid number.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        address,
        deliveryDate: new Date().toISOString(), // Default to today for quick reorder
        items: [{ 
          itemId: previousOrder.items[0].itemId, 
          quantity: qtyInt 
        }]
      };

      await api.post('/orders', payload);
      Alert.alert('Success 🚀', 'Your order has been duplicated!');
      navigation.navigate('Orders');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const updateQty = (delta) => {
    const next = Math.max(1, (parseInt(quantity) || 0) + delta);
    setQuantity(next.toString());
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={26} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Replace Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>PREVIOUS ORDER DETAILS</Text>
        <Card style={styles.infoCard}>
          <Text style={styles.productName}>{previousOrder.items[0]?.inventory?.itemName || 'Pure Water'}</Text>
          <Text style={styles.productSize}>{previousOrder.items[0]?.inventory?.size}</Text>
          <Text style={styles.orderRef}>Ref: #{previousOrder.id.toString().slice(-6).toUpperCase()}</Text>
        </Card>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>QUANTITY</Text>
          <View style={styles.stepperContainer}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => updateQty(-1)}>
              <Ionicons name="remove" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TextInput 
              style={styles.qtyInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.stepBtn} onPress={() => updateQty(1)}>
              <Ionicons name="add" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>DELIVERY ADDRESS</Text>
          <TextInput 
            style={styles.addressInput}
            value={address}
            onChangeText={setAddress}
            multiline
            placeholder="Enter address"
          />
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Estimated Total</Text>
          <Text style={styles.summaryPrice}>
            ${((previousOrder.items[0]?.price || 0) * (parseInt(quantity) || 0)).toFixed(2)}
          </Text>
        </View>

        <Button 
          title="Place Order" 
          onPress={handlePlaceOrder}
          loading={loading}
          style={styles.placeBtn}
        />
      </ScrollView>
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
    backgroundColor: COLORS.white,
    ...SHADOWS.light
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  scroll: { padding: SIZES.padding },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: COLORS.secondary, marginBottom: 12, letterSpacing: 1 },
  infoCard: { padding: 20, marginBottom: 30, backgroundColor: COLORS.light, borderWidth: 0 },
  productName: { fontSize: 18, fontWeight: '900', color: COLORS.dark },
  productSize: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  orderRef: { fontSize: 12, color: COLORS.primary, marginTop: 8, fontWeight: '700' },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '800', color: COLORS.dark, marginBottom: 12 },
  stepperContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.light, 
    borderRadius: 20, 
    padding: 8,
    width: 180
  },
  stepBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 16, 
    backgroundColor: COLORS.white, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...SHADOWS.light 
  },
  qtyInput: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '900', color: COLORS.dark },
  addressInput: { 
    backgroundColor: COLORS.light, 
    borderRadius: 20, 
    padding: 20, 
    fontSize: 15, 
    color: COLORS.dark, 
    minHeight: 100, 
    textAlignVertical: 'top' 
  },
  summaryBox: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 20, 
    paddingTop: 20, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border 
  },
  summaryLabel: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
  summaryPrice: { fontSize: 28, fontWeight: '900', color: COLORS.primary },
  placeBtn: { marginTop: 40 }
});
