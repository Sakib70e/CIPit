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
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const AssignAgentModal = ({ visible, onClose, onConfirm, agents, order }) => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedAgent) {
      Alert.alert('Error', 'Please select a delivery agent.');
      return;
    }
    setLoading(true);
    await onConfirm(order.id, selectedAgent.id);
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dispatch Assignment</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Select an agent for Order #{order?.id.toString().slice(-6).toUpperCase()}</Text>
          
          <ScrollView style={styles.agentList} showsVerticalScrollIndicator={false}>
            {agents.map(agent => (
              <TouchableOpacity 
                key={agent.id}
                onPress={() => setSelectedAgent(agent)}
                style={[
                  styles.agentOption,
                  selectedAgent?.id === agent.id && styles.agentOptionSelected
                ]}
              >
                <View style={styles.agentInfo}>
                  <Text style={[
                    styles.agentName,
                    selectedAgent?.id === agent.id && styles.agentTextSelected
                  ]}>{agent.name}</Text>
                  <Text style={styles.agentPhone}>{agent.phone}</Text>
                </View>
                {selectedAgent?.id === agent.id && (
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Button 
            title="Confirm Assignment" 
            onPress={handleConfirm}
            loading={loading}
            style={styles.confirmBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

export const AdminTasksScreen = () => {
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, ASSIGNED, DELIVERED
  const [filterToday, setFilterToday] = useState(false);
  const [assignModal, setAssignModal] = useState({ visible: false, order: null });

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [ordRes, agRes] = await Promise.all([
        api.get('/admin/orders'),
        api.get('/admin/agents')
      ]);
      setOrders(ordRes.data.data || []);
      setAgents(agRes.data.data || []);
    } catch (error) {
      console.error('Fetch admin orders error:', error.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = (orderId) => {
    Alert.alert(
      'Purge Record',
      'This will permanently remove the order and release reserved inventory. Proceed?',
      [
        { text: 'Abort', style: 'cancel' },
        { 
          text: 'Purge', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/orders/${orderId}`);
              Alert.alert('Success', 'Order purged from system.');
              fetchData();
            } catch (err) {
              Alert.alert('Error', 'Decommission failed.');
            }
          }
        }
      ]
    );
  };

  const handleAssign = async (orderId, agentId) => {
    try {
      await api.put(`/admin/orders/${orderId}/assign`, { agentId });
      Alert.alert('Success ✅', 'Order assigned successfully.');
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to assign agent.');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filter === 'ALL' || o.status === filter;
    const orderDate = new Date(o.deliveryDate || o.createdAt).toDateString();
    const matchesToday = !filterToday || orderDate === new Date().toDateString();
    return matchesStatus && matchesToday;
  });

  const renderOrder = ({ item }) => (
    <Card style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id.toString().slice(-6).toUpperCase()}</Text>
          <Text style={styles.orderDate}>
            Delivery: {new Date(item.deliveryDate || item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <View style={styles.badgeRow}>
           <Badge status={item.status} />
           <TouchableOpacity 
             style={styles.purgeBtnMini} 
             onPress={() => handleDelete(item.id)}
           >
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
           </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Customer</Text>
            <Text style={styles.infoValue}>{item.user?.name}</Text>
            <Text style={styles.infoSubValue}>{item.user?.phone}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Delivery Address</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{item.address}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="bicycle-outline" size={16} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Assigned Agent</Text>
            <Text style={[styles.infoValue, !item.deliveryAgent && { color: COLORS.danger }]}>
              {item.deliveryAgent?.name || 'Unassigned'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.itemBox}>
        {item.items?.map((orderItem, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemText}>{orderItem.quantity}x {orderItem.inventory?.itemName}</Text>
            <Text style={styles.itemPrice}>${(orderItem.price * orderItem.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalValue}>${(item.totalPrice || 0).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Button 
          title="Manual Assign" 
          variant="primary" 
          size="small"
          style={styles.actionBtn}
          onPress={() => setAssignModal({ visible: true, order: item })}
        />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
           <Text style={styles.title}>Dispatch Center</Text>
           <TouchableOpacity 
             style={[styles.todayToggle, filterToday && styles.todayToggleActive]}
             onPress={() => setFilterToday(!filterToday)}
           >
              <Ionicons name="calendar-outline" size={18} color={filterToday ? COLORS.white : COLORS.primary} />
              <Text style={[styles.todayText, filterToday && { color: COLORS.white }]}>Today</Text>
           </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {['ALL', 'PENDING', 'ASSIGNED', 'DELIVERED', 'CANCELLED'].map(f => (
            <TouchableOpacity 
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          !refreshing && (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={80} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySubtitle}>There are no orders matching your current filter.</Text>
            </View>
          )
        }
      />

      <AssignAgentModal 
        visible={assignModal.visible}
        order={assignModal.order}
        agents={agents}
        onClose={() => setAssignModal({ visible: false, order: null })}
        onConfirm={handleAssign}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.dark },
  todayToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: COLORS.light, borderWidth: 1, borderColor: COLORS.primary },
  todayToggleActive: { backgroundColor: COLORS.primary },
  todayText: { fontSize: 13, fontWeight: '800', color: COLORS.primary, marginLeft: 8 },
  filterBar: { flexDirection: 'row' },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: COLORS.light, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterTabText: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary },
  filterTabTextActive: { color: COLORS.white },
  list: { padding: 16, backgroundColor: COLORS.background, paddingBottom: 40 },
  orderCard: { padding: 16, marginBottom: 16, borderRadius: 20, backgroundColor: COLORS.white, ...SHADOWS.medium },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  purgeBtnMini: { marginLeft: 10, width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.danger + '15', alignItems: 'center', justifyContent: 'center' },
  orderId: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  date: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12, opacity: 0.5 },
  section: { marginBottom: 16 },
  infoRow: { flexDirection: 'row', marginBottom: 12 },
  infoContent: { marginLeft: 12, flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase' },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginTop: 2 },
  infoSubValue: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  itemBox: { backgroundColor: COLORS.light, borderRadius: 16, padding: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemText: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  itemPrice: { fontSize: 13, color: COLORS.textSecondary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, borderStyle: 'dashed' },
  totalLabel: { fontSize: 14, fontWeight: '800', color: COLORS.dark },
  totalValue: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  cardActions: { flexDirection: 'row', marginTop: 16 },
  actionBtn: { flex: 1, minHeight: 40, marginVertical: 0 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.dark, marginTop: 20 },
  emptySubtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.dark },
  modalSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
  agentList: { marginBottom: 20 },
  agentOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.light, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
  agentOptionSelected: { backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary },
  agentName: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  agentTextSelected: { color: COLORS.primary },
  agentPhone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  confirmBtn: { marginTop: 0 }
});
