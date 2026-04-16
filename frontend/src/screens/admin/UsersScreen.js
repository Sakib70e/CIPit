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
  TextInput
} from 'react-native';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const UsersScreen = () => {
  const [activeTab, setActiveTab] = useState('USERS'); // 'USERS' or 'APPS'
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const endpoint = activeTab === 'USERS' ? '/admin/users' : '/users/applications';
      const res = await api.get(endpoint);
      const rawData = res.data.data || [];
      setData(rawData);
      setFilteredData(rawData);
    } catch (e) {
      console.log('Error fetching data', e);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!search) {
      setFilteredData(data);
    } else {
      const lowSearch = search.toLowerCase();
      const filtered = data.filter(u => {
        // Both endpoints return the user object directly or as the root item
        // /admin/users -> [User, User]
        // /users/applications -> [User, User] (where status=PENDING)
        return (u?.name?.toLowerCase().includes(lowSearch)) || 
               (u?.phone?.includes(lowSearch));
      });
      setFilteredData(filtered);
    }
  }, [search, data]);

  const handleReviewApp = async (userId, status) => {
    try {
      await api.put(`/users/applications/${userId}`, { status });
      Alert.alert('Protocol Updated', `Application status: ${status}`);
      fetchData();
    } catch (e) {
      Alert.alert('Protocol Error', e.response?.data?.message || 'Action failed');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      Alert.alert('Role Reassignment', `Subject role updated to: ${newRole}`);
      fetchData();
    } catch (e) {
      Alert.alert('Update Error', e.response?.data?.message || 'Failed to change role');
    }
  };

  const renderTab = (id, label) => (
    <TouchableOpacity 
      style={[styles.tab, activeTab === id && styles.activeTab]}
      onPress={() => {
        setActiveTab(id);
        setSearch('');
      }}
    >
      <Text style={[styles.tabText, activeTab === id && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderUser = ({ item }) => {
    return (
      <Card style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarTextMini}>{item?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item?.name}</Text>
            <View style={styles.subInfoRow}>
              <Ionicons name="call" size={12} color={COLORS.textSecondary} />
              <Text style={styles.userPhone}>{item?.phone}</Text>
            </View>
            <View style={styles.subInfoRow}>
              <Ionicons name="location" size={12} color={COLORS.textSecondary} />
              <Text style={styles.userAddress} numberOfLines={1}>{item?.address || 'No location set'}</Text>
            </View>
          </View>
          <Badge status={activeTab === 'APPS' ? 'PENDING' : item?.role} />
        </View>
        
        <View style={styles.actions}>
          {activeTab === 'USERS' ? (
            <View style={styles.idRow}>
               <Text style={styles.idLabel}>ID: #{item.id}</Text>
               <View style={styles.flex} />
               {item?.role === 'DELIVERY' ? (
                 <TouchableOpacity onPress={() => handleChangeRole(item.id, 'CUSTOMER')}>
                    <Text style={styles.demoteText}>REVERT TO GUEST</Text>
                 </TouchableOpacity>
               ) : item?.role === 'CUSTOMER' && (
                 <TouchableOpacity onPress={() => handleChangeRole(item.id, 'DELIVERY')}>
                    <Text style={styles.promoteText}>PROMOTE TO PARTNER</Text>
                 </TouchableOpacity>
               )}
            </View>
          ) : (
            <View style={styles.appActions}>
              <Button 
                title="AUTHORIZE SUBJECT" 
                onPress={() => handleReviewApp(item.id, 'APPROVED')}
                variant="success"
                size="small"
                style={styles.actionBtn}
                icon={<Ionicons name="checkmark-circle" size={16} color={COLORS.white} />}
              />
              <Button 
                title="DECLINE" 
                onPress={() => handleReviewApp(item.id, 'REJECTED')}
                variant="outline"
                size="small"
                style={[styles.actionBtn, { marginLeft: 10, borderColor: COLORS.danger }]}
                textStyle={{ color: COLORS.danger }}
                icon={<Ionicons name="close-circle" size={16} color={COLORS.danger} />}
              />
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerBar}>
        {!showSearch ? (
          <View>
            <Text style={styles.headerSubtitle}>ENTITY MANAGEMENT</Text>
            <Text style={styles.headerTitle}>Member Directory</Text>
          </View>
        ) : (
          <TextInput 
            style={styles.searchInput}
            placeholder="Search by name or phone..."
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        )}
        <TouchableOpacity style={styles.searchBtn} onPress={() => { setShowSearch(!showSearch); if(showSearch) setSearch(''); }}>
          <Ionicons name={showSearch ? "close" : "search"} size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.tabsContainer}>
          {renderTab('USERS', 'Active Members')}
          {renderTab('APPS', 'Partner Requests')}
        </View>

        <FlatList
          data={filteredData}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            !refreshing && (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={80} color={COLORS.border} />
                <Text style={styles.emptyTitle}>Empty Directory</Text>
                <Text style={styles.emptySubtitle}>No entries matching your criteria.</Text>
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerSubtitle: { fontSize: 11, color: COLORS.secondary, fontWeight: '900', letterSpacing: 1 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: COLORS.dark, letterSpacing: -0.5 },
  searchInput: { flex: 1, backgroundColor: COLORS.light, borderRadius: 14, paddingHorizontal: 16, height: 48, marginRight: 10, fontSize: 15, fontWeight: '700' },
  searchBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.light, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: COLORS.background },
  tabsContainer: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 6, marginHorizontal: 20, marginTop: 20, borderRadius: 18, ...SHADOWS.light },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  activeTab: { backgroundColor: COLORS.primary, ...SHADOWS.medium },
  tabText: { fontSize: 13, fontWeight: '800', color: COLORS.secondary },
  activeTabText: { color: COLORS.white },
  list: { padding: 20, paddingBottom: 60 },
  userCard: { padding: 20, marginBottom: 16, borderRadius: 28, backgroundColor: COLORS.white, ...SHADOWS.medium },
  userHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarMini: { width: 56, height: 56, borderRadius: 20, backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarTextMini: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '900', color: COLORS.dark },
  subInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  userPhone: { fontSize: 13, color: COLORS.secondary, fontWeight: '700', marginLeft: 6 },
  userAddress: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', marginLeft: 6, flex: 1 },
  actions: { marginTop: 20, paddingTop: 18, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  idRow: { flexDirection: 'row', alignItems: 'center' },
  idLabel: { fontSize: 11, fontWeight: '800', color: COLORS.secondary, opacity: 0.5 },
  flex: { flex: 1 },
  promoteText: { fontSize: 11, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5 },
  demoteText: { fontSize: 11, fontWeight: '900', color: COLORS.warning, letterSpacing: 0.5 },
  appActions: { flexDirection: 'row' },
  actionBtn: { flex: 1, minHeight: 46, borderRadius: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: COLORS.dark, marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 10, fontWeight: '600' }
});
