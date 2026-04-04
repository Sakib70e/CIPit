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
        const target = activeTab === 'APPS' ? u.user : u;
        return (target?.name?.toLowerCase().includes(lowSearch)) || 
               (target?.phone?.includes(lowSearch));
      });
      setFilteredData(filtered);
    }
  }, [search, data, activeTab]);

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
    const user = activeTab === 'APPS' ? item.user : item;
    const canPromote = activeTab === 'APPS' || (item.application);

    return (
      <Card style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarTextMini}>{user?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.subInfoRow}>
              <Ionicons name="call" size={12} color={COLORS.textSecondary} />
              <Text style={styles.userPhone}>{user?.phone}</Text>
            </View>
            <View style={styles.subInfoRow}>
              <Ionicons name="location" size={12} color={COLORS.textSecondary} />
              <Text style={styles.userAddress} numberOfLines={1}>{user?.address || 'Location data not configured'}</Text>
            </View>
          </View>
          <Badge status={activeTab === 'APPS' ? item.status : user?.role} />
        </View>
        
        <View style={styles.actions}>
          {activeTab === 'USERS' ? (
            <>
              {user?.role === 'DELIVERY' && (
                <Button 
                  title="REVERT TO CUSTOMER" 
                  onPress={() => handleChangeRole(user.id, 'CUSTOMER')}
                  variant="outline"
                  size="small"
                  style={[styles.actionBtn, { borderColor: COLORS.warning }]}
                  textStyle={{ color: COLORS.warning }}
                  icon={<Ionicons name="arrow-down-circle" size={16} color={COLORS.warning} />}
                />
              )}
              {user?.role === 'CUSTOMER' && (
                <View style={styles.restrictedInfo}>
                   <Ionicons name="shield-checkmark" size={16} color={canPromote ? COLORS.success : COLORS.border} />
                   <Text style={[styles.restrictedText, { color: canPromote ? COLORS.success : COLORS.textSecondary }]}>
                     {canPromote ? 'Vetted for Logistics' : 'No Active Application'}
                   </Text>
                   {canPromote && (
                     <TouchableOpacity style={styles.forceLink} onPress={() => handleChangeRole(user.id, 'DELIVERY')}>
                        <Text style={styles.forceLinkText}>PROMOTE NOW</Text>
                     </TouchableOpacity>
                   )}
                </View>
              )}
            </>
          ) : (
            <View style={styles.appActions}>
              <Button 
                title="AUTHORIZE" 
                onPress={() => handleReviewApp(user.id, 'APPROVED')}
                variant="success"
                size="small"
                style={styles.actionBtn}
                icon={<Ionicons name="checkmark-circle" size={16} color={COLORS.white} />}
              />
              <Button 
                title="DECLINE" 
                onPress={() => handleReviewApp(user.id, 'REJECTED')}
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
            <Text style={styles.headerSubtitle}>Entity Management</Text>
            <Text style={styles.headerTitle}>Directories</Text>
          </View>
        ) : (
          <TextInput 
            style={styles.searchInput}
            placeholder="Identity scan..."
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
          {renderTab('USERS', 'Active Nodes')}
          {renderTab('APPS', 'Requests')}
        </View>

        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            !refreshing && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Ionicons name="search" size={80} color={COLORS.border} />
                </View>
                <Text style={styles.emptyTitle}>Zero Results</Text>
                <Text style={styles.emptySubtitle}>No records matching current filter.</Text>
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
  headerBar: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingVertical: 20, 
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.dark, letterSpacing: -0.5 },
  searchInput: { flex: 1, backgroundColor: COLORS.light, borderRadius: 12, paddingHorizontal: 16, height: 44, marginRight: 10, fontSize: 14, fontWeight: '700' },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: { flex: 1, backgroundColor: COLORS.background },
  tabsContainer: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.white, 
    padding: 6,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)'
  },
  tab: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center', 
    borderRadius: 12 
  },
  activeTab: { backgroundColor: COLORS.primary, ...SHADOWS.medium },
  tabText: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },
  activeTabText: { color: COLORS.white },
  list: { padding: 20, paddingBottom: 40 },
  userCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  userHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarMini: { 
    width: 54, 
    height: 54, 
    borderRadius: 18, 
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  avatarTextMini: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '900', color: COLORS.dark },
  subInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  userPhone: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '700', marginLeft: 6 },
  userAddress: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', marginLeft: 6, flex: 1 },
  actions: { 
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    opacity: 0.9,
    borderStyle: 'dashed'
  },
  appActions: { flexDirection: 'row' },
  actionBtn: { flex: 1, minHeight: 44, marginVertical: 0, borderRadius: 14 },
  restrictedInfo: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: COLORS.light, borderRadius: 12 },
  restrictedText: { fontSize: 13, fontWeight: '800', marginLeft: 10, flex: 1 },
  forceLink: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.primary, borderRadius: 8 },
  forceLinkText: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 80,
    paddingHorizontal: 40
  },
  emptyIconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: COLORS.dark },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, fontWeight: '600' }
});
