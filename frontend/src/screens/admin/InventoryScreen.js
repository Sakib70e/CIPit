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
  Image,
  TextInput,
  Modal,
  StatusBar,
  ScrollView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api, { getImageUrl } from '../../services/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const InventoryScreen = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Adjust Modal State
  const [adjustModal, setAdjustModal] = useState({ 
    visible: false, 
    item: null, 
    manualAmount: '', 
    newThreshold: '',
    mode: 'ADD' // 'ADD' or 'SUB'
  });

  // Add Item Modal State
  const [addItemModal, setAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({ 
    itemName: '', 
    size: '', 
    price: '', 
    totalStock: '',
    lowStockThreshold: '10',
    imageUri: null 
  });

  const fetchInventory = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/inventory');
      setData(res.data.data || []);
      setFilteredData(res.data.data || []);
    } catch (e) {
      console.log('Sync Error', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    if (!search) {
      setFilteredData(data);
    } else {
      const low = search.toLowerCase();
      setFilteredData(data.filter(i => i.itemName.toLowerCase().includes(low) || i.size.toLowerCase().includes(low)));
    }
  }, [search, data]);

  const handleAdjustStock = async () => {
    const num = parseInt(adjustModal.manualAmount) || 0;
    const threshold = parseInt(adjustModal.newThreshold);
    
    try {
      // Update Stock if amount > 0
      if (num > 0) {
        const finalDelta = adjustModal.mode === 'ADD' ? num : -num;
        await api.put(`/inventory/${adjustModal.item.id}/adjust`, { amount: finalDelta });
      }

      // Update Threshold always if changed
      if (!isNaN(threshold)) {
        await api.put(`/inventory/${adjustModal.item.id}`, { 
          lowStockThreshold: String(threshold) 
        });
      }

      setAdjustModal({ ...adjustModal, visible: false, manualAmount: '', newThreshold: '' });
      fetchInventory();
    } catch (err) {
      Alert.alert('Protocol Error', err.response?.data?.message || 'Update rejected.');
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewItem({ ...newItem, imageUri: result.assets[0].uri });
    }
  };

  const handleAddItem = async () => {
    if (!newItem.itemName || !newItem.size || !newItem.price) {
      Alert.alert('Incomplete Data', 'Please fill all required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('itemName', newItem.itemName);
    formData.append('size', newItem.size);
    formData.append('price', newItem.price);
    formData.append('totalStock', newItem.totalStock || '0');
    formData.append('lowStockThreshold', newItem.lowStockThreshold || '10');

    if (newItem.imageUri) {
      const uri = newItem.imageUri;
      const name = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(name);
      const type = match ? `image/${match[1]}` : `image`;
      
      formData.append('image', { uri, name, type });
    }

    try {
      await api.post('/inventory', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAddItemModal(false);
      setNewItem({ itemName: '', size: '', price: '', totalStock: '', lowStockThreshold: '10', imageUri: null });
      fetchInventory();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add item.');
    }
  };

  const renderItem = ({ item }) => {
    const threshold = item.lowStockThreshold !== undefined && item.lowStockThreshold !== null 
      ? item.lowStockThreshold 
      : 10;
    const isLowStock = item.availableStock <= threshold;
    return (
      <Card style={styles.productCard}>
        <View style={styles.cardHeader}>
           <Image 
             source={item.imageUrl ? { uri: getImageUrl(item.imageUrl) } : require('../../../assets/CIPITLOGO_Square.png')} 
             style={styles.productImage} 
             defaultSource={require('../../../assets/CIPITLOGO_Square.png')}
           />
           {isLowStock && <View style={styles.hazardBadge}><Text style={styles.hazardText}>LOW STOCK</Text></View>}
        </View>
        <View style={styles.cardBody}>
           <View style={styles.idRow}>
              <Text style={styles.productCategory}>{item.size}</Text>
              <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
           </View>
           <Text style={styles.productName}>{item.itemName}</Text>
           
           <View style={styles.stockPanel}>
              <View style={styles.stockCol}>
                 <Text style={styles.stockLabel}>WAREHOUSE</Text>
                 <Text style={styles.stockVal}>{item.totalStock}</Text>
              </View>
              <View style={styles.stockCol}>
                 <Text style={styles.stockLabel}>THRESHOLD</Text>
                 <Text style={[styles.stockVal, { color: COLORS.secondary }]}>{item.lowStockThreshold || 10}</Text>
              </View>
              <View style={styles.stockCol}>
                 <Text style={styles.stockLabel}>MARKET</Text>
                 <Text style={[styles.stockVal, { color: isLowStock ? COLORS.danger : COLORS.success }]}>{item.availableStock}</Text>
              </View>
           </View>

           <View style={styles.cardActions}>
              <TouchableOpacity style={styles.adjustBtn} onPress={() => setAdjustModal({ visible: true, item, manualAmount: '', newThreshold: String(item.lowStockThreshold || 10), mode: 'ADD' })}>
                 <Ionicons name="settings-outline" size={18} color={COLORS.primary} />
                 <Text style={styles.adjustBtnText}>MANAGE STOCK</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => {
                Alert.alert('Erase Entity?', `Decommission ${item.itemName} from catalog?`, [
                  { text: 'ABORT', style: 'cancel' },
                  { text: 'ERASE', onPress: async () => { 
                    try {
                      await api.delete(`/inventory/${item.id}`); 
                      fetchInventory(); 
                    } catch(e) {
                      Alert.alert('Error', 'Deletion failed.');
                    }
                  } }
                ]);
              }}>
                 <Ionicons name="trash" size={18} color={COLORS.danger} />
              </TouchableOpacity>
           </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <View>
          <Text style={styles.subtitle}>Logistics Tracking</Text>
          <Text style={styles.title}>Inventory Catalog</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddItemModal(true)}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Filter catalog identities..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        numColumns={1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchInventory} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          !refreshing && (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={80} color={COLORS.border} />
              <Text style={styles.emptyText}>Zero Identities in Grid</Text>
            </View>
          )
        }
      />

      {/* Adjust Stock Modal */}
      <Modal visible={adjustModal.visible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>LOGISTICS UPDATE</Text>
            <Text style={styles.itemRef}>{adjustModal.item?.itemName} ({adjustModal.item?.size})</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.manualInputGroup}>
                 <Text style={styles.label}>ADJUST QUANTITY</Text>
                 <TextInput 
                    style={styles.manualInput}
                    keyboardType="numeric"
                    placeholder="0"
                    value={adjustModal.manualAmount}
                    onChangeText={(val) => setAdjustModal({...adjustModal, manualAmount: val})}
                 />
              </View>

              <View style={styles.modeControlRow}>
                 <TouchableOpacity 
                    style={[styles.modeBtn, adjustModal.mode === 'ADD' && styles.modeBtnActiveAdd]}
                    onPress={() => setAdjustModal({...adjustModal, mode: 'ADD'})}
                 >
                    <Ionicons name="add-circle" size={20} color={adjustModal.mode === 'ADD' ? COLORS.white : COLORS.success} />
                    <Text style={[styles.modeBtnText, adjustModal.mode === 'ADD' && styles.modeBtnTextActive]}>RESTOCK</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                    style={[styles.modeBtn, adjustModal.mode === 'SUB' && styles.modeBtnActiveSub]}
                    onPress={() => setAdjustModal({...adjustModal, mode: 'SUB'})}
                 >
                    <Ionicons name="remove-circle" size={20} color={adjustModal.mode === 'SUB' ? COLORS.white : COLORS.danger} />
                    <Text style={[styles.modeBtnText, adjustModal.mode === 'SUB' && styles.modeBtnTextActive]}>REMOVE</Text>
                 </TouchableOpacity>
              </View>

              <View style={styles.manualInputGroup}>
                 <Text style={styles.label}>LOW STOCK THRESHOLD</Text>
                 <TextInput 
                    style={styles.thresholdInput}
                    keyboardType="numeric"
                    placeholder="10"
                    value={adjustModal.newThreshold}
                    onChangeText={(val) => setAdjustModal({...adjustModal, newThreshold: val})}
                 />
                 <Text style={styles.hintText}>App will alert when stock falls below this unit count.</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
               <TouchableOpacity style={styles.modalAbort} onPress={() => setAdjustModal({...adjustModal, visible: false})}>
                  <Text style={styles.abortText}>CANCEL</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.modalCommit} onPress={handleAdjustStock}>
                  <Text style={styles.commitText}>APPLY CHANGES</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal visible={addItemModal} transparent={true} animationType="slide">
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>ADD NEW ENTITY</Text>
               
               <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
                  {newItem.imageUri ? (
                     <Image source={{ uri: newItem.imageUri }} style={styles.pickedImage} />
                  ) : (
                     <View style={styles.imagePlaceholder}>
                        <Ionicons name="camera" size={40} color={COLORS.textSecondary} />
                        <Text style={styles.imagePlaceholderText}>UPLOAD BOTTLE IMAGE</Text>
                     </View>
                  )}
               </TouchableOpacity>

               <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                  <View style={styles.inputGroup}>
                     <Text style={styles.label}>ITEM NAME</Text>
                     <TextInput 
                        style={styles.input} 
                        placeholder="e.g. Mineral Water"
                        value={newItem.itemName}
                        onChangeText={(val) => setNewItem({...newItem, itemName: val})}
                     />
                  </View>
                  <View style={styles.inputGroup}>
                     <Text style={styles.label}>SIZE / SPEC</Text>
                     <TextInput 
                        style={styles.input} 
                        placeholder="e.g. 500ml or 2L"
                        value={newItem.size}
                        onChangeText={(val) => setNewItem({...newItem, size: val})}
                     />
                  </View>
                  <View style={styles.inputRow}>
                     <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.label}>PRICE ($)</Text>
                        <TextInput 
                           style={styles.input} 
                           placeholder="0.00"
                           keyboardType="numeric"
                           value={newItem.price}
                           onChangeText={(val) => setNewItem({...newItem, price: val})}
                        />
                     </View>
                     <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>INIT STOCK</Text>
                        <TextInput 
                           style={styles.input} 
                           placeholder="0"
                           keyboardType="numeric"
                           value={newItem.totalStock}
                           onChangeText={(val) => setNewItem({...newItem, totalStock: val})}
                        />
                     </View>
                  </View>
                  <View style={styles.inputGroup}>
                     <Text style={styles.label}>LOW STOCK THRESHOLD</Text>
                     <TextInput 
                        style={styles.input} 
                        placeholder="10"
                        keyboardType="numeric"
                        value={newItem.lowStockThreshold}
                        onChangeText={(val) => setNewItem({...newItem, lowStockThreshold: val})}
                     />
                  </View>
               </ScrollView>

               <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalAbort} onPress={() => setAddItemModal(false)}>
                     <Text style={styles.abortText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalCommit} onPress={handleAddItem}>
                     <Text style={styles.commitText}>SAVE ENTITY</Text>
                  </TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.dark, letterSpacing: -0.5 },
  addBtn: { width: 50, height: 50, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium },
  searchContainer: { marginHorizontal: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.light, borderRadius: 16, paddingHorizontal: 16 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, fontSize: 14, fontWeight: '700', color: COLORS.dark },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  productCard: { padding: 0, overflow: 'hidden', borderRadius: 28, backgroundColor: COLORS.white, ...SHADOWS.medium, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  cardHeader: { height: 160, backgroundColor: COLORS.light },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  hazardBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.danger, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  hazardText: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
  cardBody: { padding: 20 },
  idRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  productCategory: { fontSize: 12, color: COLORS.primary, fontWeight: '800', textTransform: 'uppercase' },
  productPrice: { fontSize: 18, fontWeight: '900', color: COLORS.dark },
  productName: { fontSize: 20, fontWeight: '900', color: COLORS.dark, marginBottom: 15 },
  stockPanel: { flexDirection: 'row', backgroundColor: COLORS.light, borderRadius: 18, padding: 15, marginBottom: 20 },
  stockCol: { flex: 1, alignItems: 'center' },
  stockLabel: { fontSize: 9, color: COLORS.textSecondary, fontWeight: '800', marginBottom: 4 },
  stockVal: { fontSize: 15, fontWeight: '900', color: COLORS.dark },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  adjustBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.primary + '30', height: 48, borderRadius: 14, marginRight: 12 },
  adjustBtnText: { marginLeft: 8, fontSize: 12, fontWeight: '900', color: COLORS.primary },
  deleteBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.danger + '10', alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 32, padding: 24, ...SHADOWS.dark, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.dark, textAlign: 'center', marginBottom: 12 },
  itemRef: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  manualInputGroup: { marginBottom: 20 },
  manualInput: { backgroundColor: COLORS.light, borderRadius: 16, height: 50, textAlign: 'center', fontSize: 24, fontWeight: '900', color: COLORS.dark },
  thresholdInput: { backgroundColor: COLORS.light, borderRadius: 16, height: 50, textAlign: 'center', fontSize: 18, fontWeight: '900', color: COLORS.primary },
  hintText: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, fontWeight: '600' },
  modeControlRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.light, paddingVertical: 10, borderRadius: 14, marginHorizontal: 5 },
  modeBtnActiveAdd: { backgroundColor: COLORS.success },
  modeBtnActiveSub: { backgroundColor: COLORS.danger },
  modeBtnText: { fontSize: 11, fontWeight: '900', marginLeft: 8, color: COLORS.dark },
  modeBtnTextActive: { color: COLORS.white },
  imagePickerBtn: { width: '100%', height: 180, backgroundColor: COLORS.light, borderRadius: 24, overflow: 'hidden', marginBottom: 20, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.border },
  pickedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { fontSize: 10, fontWeight: '900', color: COLORS.textSecondary, marginTop: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  modalAbort: { padding: 12 },
  abortText: { fontSize: 13, fontWeight: '900', color: COLORS.textSecondary },
  modalCommit: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, ...SHADOWS.medium },
  commitText: { color: COLORS.white, fontSize: 13, fontWeight: '900' },
  inputGroup: { marginBottom: 18 },
  inputRow: { flexDirection: 'row' },
  label: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '900', marginBottom: 8 },
  input: { backgroundColor: COLORS.light, borderRadius: 16, padding: 16, fontSize: 14, fontWeight: '700', color: COLORS.dark, minHeight: 50 }
});
