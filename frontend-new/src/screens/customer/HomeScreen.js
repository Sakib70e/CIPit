import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  ScrollView,
  StatusBar,
  Image,
  Modal,
  TextInput
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import api, { getImageUrl } from '../../services/api';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const OrderModal = ({ visible, item, onClose, onConfirm, userAddress }) => {
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState(userAddress || '');
  const [deliveryDate, setDeliveryDate] = useState('Today');
  const [loading, setLoading] = useState(false);

  const dates = ['Today', 'Tomorrow', 'Day After'];

  const handleConfirm = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please provide a delivery address.');
      return;
    }
    setLoading(true);
    await onConfirm({
      items: [{ itemId: item.id, quantity }],
      address,
      deliveryDate: deliveryDate === 'Today' ? new Date().toISOString() : 
                    deliveryDate === 'Tomorrow' ? new Date(Date.now() + 86400000).toISOString() :
                    new Date(Date.now() + 172800000).toISOString()
    });
    setLoading(false);
    onClose();
  };

  if (!item) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Place Order</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.modalItemInfo}>
              <View style={styles.modalItemImageContainer}>
                {item.imageUrl ? (
                  <Image source={{ uri: getImageUrl(item.imageUrl) }} style={styles.modalItemImage} />
                ) : (
                  <Ionicons name="water" size={40} color={COLORS.primary} />
                )}
              </View>
              <View>
                <Text style={styles.modalItemName}>{item.itemName}</Text>
                <Text style={styles.modalItemSize}>{item.size}</Text>
                <Text style={styles.modalItemPrice}>${item.price.toFixed(2)} / unit</Text>
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
              <Text style={styles.inputLabel}>Delivery Date</Text>
              <View style={styles.dateSelector}>
                {dates.map(date => (
                  <TouchableOpacity 
                    key={date}
                    onPress={() => setDeliveryDate(date)}
                    style={[
                      styles.dateOption,
                      deliveryDate === date && styles.dateOptionSelected
                    ]}
                  >
                    <Text style={[
                      styles.dateOptionText,
                      deliveryDate === date && styles.dateOptionTextSelected
                    ]}>{date}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Address</Text>
              <TextInput
                style={styles.addressInput}
                value={address}
                onChangeText={setAddress}
                multiline
                placeholder="Enter delivery address"
              />
            </View>

            <View style={styles.orderSummary}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryValue}>${(item.price * quantity).toFixed(2)}</Text>
            </View>
          </View>

          <Button 
            title="Confirm Order" 
            onPress={handleConfirm}
            loading={loading}
            style={styles.confirmBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

export const HomeScreen = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ activeOrders: 0, nextDelivery: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [inventoryRes, ordersRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/orders/me')
      ]);
      
      setItems(inventoryRes.data.data || []);
      
      const activeOrders = (ordersRes.data.data || []).filter(o => 
        ['PENDING', 'ASSIGNED', 'OUT_FOR_DELIVERY'].includes(o.status)
      ).length;
      
      setStats({
        activeOrders,
        nextDelivery: (ordersRes.data.data || []).find(o => o.status === 'ASSIGNED')?.deliveryDate || null
      });
    } catch (error) {
      console.error('Home data error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePlaceOrder = (item) => {
    setSelectedItem(item);
    setOrderModalVisible(true);
  };

  const onConfirmOrder = async (payload) => {
    try {
      await api.post('/orders', payload);
      Alert.alert('Success 🚀', 'Your order has been placed!');
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to place order');
    }
  };

  const renderProduct = ({ item }) => (
    <Card style={styles.productCard}>
      <View style={styles.productIconContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: getImageUrl(item.imageUrl) }} style={styles.productImage} />
        ) : (
          <Ionicons name="water" size={32} color={COLORS.primary} />
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.itemName}</Text>
        <Text style={styles.productSize}>{item.size}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
      </View>
      <Button 
        title="Order" 
        onPress={() => handlePlaceOrder(item)}
        style={styles.orderSmallBtn}
        textStyle={styles.orderSmallBtnText}
      />
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={COLORS.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Day, {user?.name?.split(' ')[0]}! 👋</Text>
            <Text style={styles.subGreeting}>Ready for some fresh water?</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Ionicons name="cart-outline" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.activeOrders}</Text>
            <Text style={styles.statLabel}>Active Orders</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>{stats.nextDelivery ? 'Scheduled' : 'None'}</Text>
            <Text style={styles.statLabel}>Next Delivery</Text>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Products</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          scrollEnabled={false}
          contentContainerStyle={styles.productList}
          ListEmptyComponent={
            !loading && <Text style={styles.empty}>No products available right now.</Text>
          }
        />

        <Card style={styles.promoCard}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Get Weekly Refills!</Text>
            <Text style={styles.promoSubtitle}>Subscribe now and save 15% on every delivery.</Text>
            <Button 
              title="View Subscriptions" 
              variant="outline" 
              style={styles.promoBtn}
              textStyle={{ color: COLORS.white }}
              onPress={() => navigation.navigate('Subscriptions')}
            />
          </View>
          <Ionicons name="star" size={80} color="rgba(255,255,255,0.2)" style={styles.promoIcon} />
        </Card>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <OrderModal 
        visible={orderModalVisible}
        item={selectedItem}
        userAddress={user?.address}
        onClose={() => setOrderModalVisible(false)}
        onConfirm={onConfirmOrder}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    paddingBottom: 20
  },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  subGreeting: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  profileBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: COLORS.light,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statsContainer: { 
    flexDirection: 'row', 
    padding: 16, 
    justifyContent: 'space-between' 
  },
  statCard: { 
    flex: 0.48, 
    alignItems: 'center', 
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)'
  },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.dark, marginVertical: 4 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    marginTop: 10,
    marginBottom: 10
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  seeAll: { color: COLORS.primary, fontWeight: '600' },
  productList: { paddingHorizontal: 16 },
  productCard: { 
    flexDirection: 'row', 
    alignItems: 'center',
    padding: 12,
    marginBottom: 12
  },
  productIconContainer: { 
    width: 60, 
    height: 60, 
    borderRadius: 12, 
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden'
  },
  productImage: { width: '100%', height: '100%' },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  productSize: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  productPrice: { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  orderSmallBtn: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    minHeight: 36, 
    marginVertical: 0 
  },
  orderSmallBtnText: { fontSize: 14 },
  empty: { textAlign: 'center', marginTop: 40, color: COLORS.textSecondary, fontSize: 15 },
  promoCard: { 
    margin: 16, 
    backgroundColor: COLORS.primary, 
    overflow: 'hidden',
    padding: 24,
    borderRadius: SIZES.radius
  },
  promoContent: { flex: 1, zIndex: 1 },
  promoTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  promoSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8, maxWidth: '70%' },
  promoBtn: { 
    marginTop: 16, 
    alignSelf: 'flex-start', 
    borderColor: COLORS.white,
    backgroundColor: 'rgba(255,255,255,0.2)',
    minHeight: 32,
    paddingVertical: 6
  },
  promoIcon: { position: 'absolute', right: -10, bottom: -10 },

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
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark
  },
  modalBody: {
    marginBottom: 24
  },
  modalItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24
  },
  modalItemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden'
  },
  modalItemImage: {
    width: '100%',
    height: '100%'
  },
  modalItemName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark
  },
  modalItemSize: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  modalItemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4
  },
  inputGroup: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 10
  },
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
  quantityValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  dateOption: {
    flex: 0.31,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.light,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  dateOptionSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary
  },
  dateOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  dateOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '700'
  },
  addressInput: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: COLORS.dark,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary
  },
  confirmBtn: {
    marginTop: 0
  }
});

