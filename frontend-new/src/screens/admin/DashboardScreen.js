import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Image,
  Modal
} from 'react-native';
import api from '../../services/api';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const StatCard = ({ title, value, icon, color, trend }) => (
  <Card style={[styles.statCard]}>
    <View style={styles.statHeader}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      {trend && (
        <View style={styles.trendRow}>
          <Ionicons name={trend > 0 ? 'trending-up' : 'trending-down'} size={14} color={trend > 0 ? COLORS.success : COLORS.danger} />
          <Text style={[styles.trendValue, { color: trend > 0 ? COLORS.success : COLORS.danger }]}>{Math.abs(trend)}%</Text>
        </View>
      )}
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </View>
  </Card>
);

export const DashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [systemHealth, setSystemHealth] = useState({
    api: 'connecting',
    db: 'connecting',
    fcm: 'connecting'
  });

  const fetchStats = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/admin/dashboard');
      setStats(res.data.data);
      setSystemHealth({
        api: 'operational',
        db: res.data.data?.system?.dbStatus === 'CONNECTED' ? 'healthy' : 'error',
        fcm: 'ready'
      });
    } catch (err) {
      console.error('Fetch stats error:', err.message);
      setSystemHealth({ api: 'unstable', db: 'error', fcm: 'unknown' });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Auto-refresh every minute
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topLogoBar}>
        <Image 
          source={require('../../../assets/CIPITLOGO_Circle.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.topLogoInfo}>
           <Text style={styles.appName}>Portal</Text>
           <Text style={styles.appTag}>Administrative Hub</Text>
        </View>
        <TouchableOpacity style={styles.topProfileBtn} onPress={() => navigation.navigate('Profile')}>
           <Ionicons name="person-circle" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchStats} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Operational Control 👋</Text>
            <Text style={styles.adminTitle}>System Status</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn} onPress={() => setShowNotifications(true)}>
            <Ionicons name="notifications" size={24} color={COLORS.primary} />
            {(stats?.pendingOrdersCount > 0) && <View style={styles.badge} />}
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <StatCard 
            title="Total Revenue" 
            value={`$${stats?.revenue?.toFixed(0) || '0'}`} 
            icon="cash" 
            color="#1CC88A" 
          />
          <StatCard 
            title="Active Subs" 
            value={stats?.activeSubscriptions || '0'} 
            icon="repeat" 
            color="#4E73DF"
          />
          <StatCard 
            title="Total Cust." 
            value={stats?.totalCustomers || '0'} 
            icon="people" 
            color="#36B9CC" 
          />
          <StatCard 
            title="Pending Jobs" 
            value={stats?.pendingOrdersCount || '0'} 
            icon="alert-circle" 
            color="#F6C23E" 
          />
          <StatCard 
            title="Total Stock" 
            value={stats?.inventory?.totalStock || '0'} 
            icon="cube" 
            color="#858796" 
          />
          <StatCard 
            title="Reserved" 
            value={stats?.inventory?.reservedStock || '0'} 
            icon="lock-closed" 
            color="#E74A3B" 
          />
          <StatCard 
            title="Delivered (TD)" 
            value={stats?.deliveredToday || '0'} 
            icon="checkmark-done" 
            color="#1CC88A" 
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>System Integrity</Text>
            <TouchableOpacity onPress={fetchStats}>
              <Ionicons name="refresh" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Card style={styles.healthCard}>
            <View style={styles.healthRow}>
              <View style={[styles.statusDot, { backgroundColor: systemHealth.api === 'operational' ? COLORS.success : COLORS.warning }]} />
              <Text style={styles.healthLabel}>API Node (Elysia v1.0)</Text>
              <Badge status={systemHealth.api === 'operational' ? 'ACTIVE' : 'ERROR'} label={systemHealth.api} />
            </View>
            <View style={styles.divider} />
            <View style={styles.healthRow}>
              <View style={[styles.statusDot, { backgroundColor: systemHealth.db === 'healthy' ? COLORS.success : COLORS.danger }]} />
              <Text style={styles.healthLabel}>PostgreSQL Database</Text>
              <Badge status={systemHealth.db === 'healthy' ? 'ACTIVE' : 'ERROR'} label={systemHealth.db === 'healthy' ? 'CONNECTED' : 'FAIL'} />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management Modules</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionBtn, { borderColor: '#4E73DF' }]}
              onPress={() => navigation.navigate('Inventory')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#4E73DF15' }]}>
                <Ionicons name="cube" size={24} color="#4E73DF" />
              </View>
              <Text style={styles.actionBtnText}>Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, { borderColor: '#1CC88A' }]}
              onPress={() => navigation.navigate('Orders')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#1CC88A15' }]}>
                <Ionicons name="bicycle" size={24} color="#1CC88A" />
              </View>
              <Text style={styles.actionBtnText}>Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, { borderColor: '#36B9CC' }]}
              onPress={() => navigation.navigate('Users')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#36B9CC15' }]}>
                <Ionicons name="people" size={24} color="#36B9CC" />
              </View>
              <Text style={styles.actionBtnText}>Users</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentPane}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>In-flow Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close-circle" size={28} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {(stats?.pendingOrdersCount > 0) ? (
                <View style={styles.notifItem}>
                  <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
                  <View style={styles.notifBody}>
                     <Text style={styles.notifTitle}>Pending Orders Awaiting</Text>
                     <Text style={styles.notifDesc}>{stats?.pendingOrdersCount} new orders require manual assignment.</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyNotifs}>
                  <Ionicons name="notifications-off-outline" size={50} color={COLORS.border} />
                  <Text style={styles.emptyNotifText}>Zero active alerts at this time.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  topLogoBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth:1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  logo: { width: 42, height: 42 },
  topLogoInfo: { marginLeft: 12, flex: 1 },
  appName: { fontSize: 18, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5 },
  appTag: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', marginTop: -2 },
  topProfileBtn: { padding: 4 },
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 10 },
  header: { 
    marginBottom: 20, 
    marginTop: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  welcome: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '700' },
  adminTitle: { fontSize: 24, fontWeight: '900', color: COLORS.dark, marginTop: 2, letterSpacing: -0.5 },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: COLORS.white
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    padding: 16,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  iconBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center'
  },
  statContent: { width: '100%' },
  statValue: { fontSize: 22, fontWeight: '900', color: COLORS.dark },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '700', marginTop: 2 },
  section: { marginTop: 15, marginBottom: 15 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  refreshLink: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  healthCard: { 
    padding: 0, 
    borderRadius: 20,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    backgroundColor: COLORS.white
  },
  healthRow: { 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  statusDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    marginRight: 12 
  },
  healthLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.dark },
  healthStatus: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '900' },
  divider: { height: 1, backgroundColor: COLORS.border, opacity: 0.3 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { 
    width: '31%', 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    paddingVertical: 15, 
    alignItems: 'center', 
    justifyContent: 'center',
    ...SHADOWS.medium,
    borderWidth: 1.5
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  actionBtnText: { fontSize: 12, fontWeight: '900', color: COLORS.dark },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContentPane: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, minHeight: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.dark },
  modalList: { flex: 1 },
  notifItem: { flexDirection: 'row', padding: 16, backgroundColor: COLORS.light, borderRadius: 16, marginBottom: 12 },
  notifBody: { marginLeft: 12, flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '800', color: COLORS.dark },
  notifDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },
  emptyNotifs: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyNotifText: { color: COLORS.textSecondary, fontWeight: '700', marginTop: 12 }
});

