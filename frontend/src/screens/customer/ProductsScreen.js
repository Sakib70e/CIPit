import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  RefreshControl,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api, { getImageUrl } from '../../services/api';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';
import { Card } from '../../components/Card';
import { useCartStore } from '../../store/useCartStore';

export const ProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  
  const totalItems = React.useMemo(() => cartItems.filter(i => i.quantity > 0).reduce((sum, i) => sum + i.quantity, 0), [cartItems]);
  const totalPrice = React.useMemo(() => cartItems.filter(i => i.quantity > 0).reduce((sum, i) => sum + (i.price * i.quantity), 0), [cartItems]);

  const fetchProducts = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/inventory');
      setProducts(res.data.data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const renderProduct = ({ item }) => {
    const cartItem = cartItems.find(i => i.id === item.id);
    const qty = cartItem ? cartItem.quantity : 0;

    return (
      <Card style={styles.productCard}>
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: getImageUrl(item.imageUrl) }} style={styles.image} />
          ) : (
            <Ionicons name="water" size={50} color={COLORS.primary} />
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.itemName}</Text>
          <Text style={styles.size}>{item.size}</Text>
          
          <View style={styles.footer}>
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            <TouchableOpacity 
              style={[styles.addBtn, qty > 0 && styles.activeAddBtn]} 
              onPress={() => addItem(item)}
            >
              {qty > 0 ? (
                <View style={styles.qtyBadge}><Text style={styles.qtyText}>{qty}</Text></View>
              ) : (
                <Ionicons name="add" size={24} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Shop</Text>
          <Text style={styles.subtitle}>Select items for delivery</Text>
        </View>
        <TouchableOpacity 
          style={styles.cartBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart-outline" size={28} color={COLORS.dark} />
          {totalItems > 0 && (
            <View style={styles.mainBadge}><Text style={styles.mainBadgeText}>{totalItems}</Text></View>
          )}
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        numColumns={2}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchProducts} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No products available.</Text>
        }
      />

      {totalItems > 0 && (
        <TouchableOpacity 
          style={styles.floatingCart}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.floatingCartText}>Checkout • ${totalPrice.toFixed(2)}</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.dark },
  subtitle: { fontSize: 13, color: COLORS.secondary, marginTop: 2 },
  cartBtn: { width: 50, height: 50, borderRadius: 16, backgroundColor: COLORS.light, justifyContent: 'center', alignItems: 'center' },
  mainBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: COLORS.primary, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.white },
  mainBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
  list: { padding: 12, paddingBottom: 150 },
  productCard: { flex: 0.5, margin: 8, padding: 12, borderRadius: 24, backgroundColor: COLORS.white, ...SHADOWS.light },
  imageContainer: { width: '100%', height: 120, backgroundColor: COLORS.background, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  image: { width: '80%', height: '80%', resizeMode: 'contain' },
  info: { paddingHorizontal: 4 },
  name: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  size: { fontSize: 12, color: COLORS.secondary, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  price: { fontSize: 18, fontWeight: '900', color: COLORS.dark },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  activeAddBtn: { backgroundColor: COLORS.primary },
  qtyBadge: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  qtyText: { color: COLORS.white, fontSize: 15, fontWeight: '900' },
  emptyText: { textAlign: 'center', marginTop: 100, color: COLORS.secondary },
  floatingCart: {
    position: 'absolute', bottom: 120, left: 20, right: 20, height: 64, borderRadius: 20, backgroundColor: COLORS.dark,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, ...SHADOWS.dark
  },
  floatingCartText: { color: COLORS.white, fontSize: 17, fontWeight: '800' }
});
