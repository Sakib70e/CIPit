import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/useCartStore';
import { COLORS, SHADOWS } from '../../constants/theme';
import { getImageUrl } from '../../services/api';
import { Button } from '../../components/Button';

// Local Input component to maintain focus and prevent store-refresh jumps
const CartItemRow = ({ item, updateQuantity, setQuantity, removeItem }) => {
  const [localQty, setLocalQty] = useState(item.quantity.toString());

  const handleTextChange = (val) => {
    const clean = val.replace(/[^0-9]/g, '');
    setLocalQty(clean);
    // Update store immediately but without filtering (handled by store change)
    setQuantity(item.id, clean || '0');
  };

  return (
    <View style={styles.cartItem}>
      <View style={styles.itemImageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: getImageUrl(item.imageUrl) }} style={styles.itemImage} />
        ) : (
          <Ionicons name="water" size={30} color={COLORS.primary} />
        )}
      </View>
      
      <View style={styles.itemDetails}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>{item.itemName}</Text>
          <TouchableOpacity onPress={() => removeItem(item.id)}>
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemSize}>{item.size}</Text>
        
        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity 
              style={styles.qtyBtn} 
              onPress={() => {
                const next = Math.max(0, item.quantity - 1);
                setLocalQty(next.toString());
                updateQuantity(item.id, -1);
              }}
            >
              <Ionicons name="remove" size={16} color={COLORS.dark} />
            </TouchableOpacity>
            <TextInput 
              style={styles.qtyInput}
              value={localQty}
              onChangeText={handleTextChange}
              keyboardType="numeric"
              maxLength={6}
              onBlur={() => {
                if (!localQty || localQty === '0') {
                  setLocalQty('1');
                  setQuantity(item.id, '1');
                }
              }}
            />
            <TouchableOpacity 
              style={styles.qtyBtn} 
              onPress={() => {
                const next = item.quantity + 1;
                setLocalQty(next.toString());
                updateQuantity(item.id, 1);
              }}
            >
              <Ionicons name="add" size={16} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export const CartScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const rawItems = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const items = React.useMemo(() => rawItems, [rawItems]);
  const totalPrice = React.useMemo(() => items.reduce((sum, i) => sum + (i.price * i.quantity), 0), [items]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>My Cart</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <CartItemRow 
              item={item} 
              updateQuantity={updateQuantity} 
              setQuantity={setQuantity} 
              removeItem={removeItem} 
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: 250 }]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cart-outline" size={80} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Cart is empty</Text>
              <Button title="Shop Products" onPress={() => navigation.goBack()} style={styles.shopBtn} />
            </View>
          }
        />

        {items.length > 0 && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 120 }]}>
            <View style={styles.summaryContainer}>
               <View style={styles.priceRow}>
                 <Text style={styles.totalLabel}>Grand Total</Text>
                 <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
               </View>
               <Button 
                 title="Proceed to Checkout" 
                 onPress={() => navigation.navigate('Checkout')}
                 style={styles.checkoutBtn}
                 icon={<Ionicons name="arrow-forward" size={20} color={COLORS.white} />}
               />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.light, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.dark },
  list: { padding: 20 },
  cartItem: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 24, padding: 12, marginBottom: 16, ...SHADOWS.light, borderWidth: 1, borderColor: '#f8f8f8' },
  itemImageContainer: { width: 80, height: 80, backgroundColor: COLORS.light, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  itemImage: { width: '80%', height: '80%', resizeMode: 'contain' },
  itemDetails: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  itemSize: { fontSize: 13, color: COLORS.secondary, marginTop: 2 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  itemPrice: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  quantityControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.light, borderRadius: 12, padding: 4 },
  qtyBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', ...SHADOWS.light },
  qtyInput: { minWidth: 46, paddingHorizontal: 4, textAlign: 'center', fontSize: 16, fontWeight: '800', color: COLORS.dark },
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32,
    ...SHADOWS.medium,
    elevation: 20
  },
  summaryContainer: { padding: 24 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 18, fontWeight: '900', color: COLORS.dark },
  totalValue: { fontSize: 26, fontWeight: '900', color: COLORS.primary },
  checkoutBtn: { height: 64, borderRadius: 20 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.border, marginTop: 20 },
  shopBtn: { marginTop: 20, width: '60%' }
});
