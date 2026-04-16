import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Linking, 
  Modal, 
  TextInput,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, SHADOWS } from '../../constants/theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import api from '../../services/api';

export const ProfileScreen = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    address: ''
  });
  const [supportModal, setSupportModal] = useState(false);

  const fetchLatestProfile = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/me');
      updateUser(res.data.data);
    } catch (error) {
      console.error('Fetch profile error:', error.message);
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    fetchLatestProfile();
  }, [fetchLatestProfile]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const SUPPORT_NODE = {
    phone: '+1234567890',
    email: 'support@cipit.com',
    whatsapp: '1234567890'
  };

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.put('/users/me', formData);
      updateUser(res.data.data);
      setEditing(false);
      Alert.alert('Success ✨', 'Profile details updated.');
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Check your connection');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDelivery = async () => {
    Alert.alert(
      'Apply as Partner',
      'Send a request to become a delivery agent?',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Apply Now', onPress: async () => {
          try {
            setLoading(true);
            await api.post('/users/apply-delivery');
            updateUser({ ...user, deliveryAppStatus: 'PENDING' });
            Alert.alert('Sent! 🚀', 'Admin will review your request.');
          } catch (err) { Alert.alert('Error', 'Application failed'); }
          finally { setLoading(false); }
        }}
      ]
    );
  };

  const contactMethod = (type) => {
    let url = '';
    const name = user?.name || 'Customer';
    switch(type) {
      case 'WHATSAPP': url = `whatsapp://send?phone=${SUPPORT_NODE.whatsapp}&text=Hello CIPit Support, my name is ${name}`; break;
      case 'CALL': url = `tel:${SUPPORT_NODE.phone}`; break;
      case 'MAIL': url = `mailto:${SUPPORT_NODE.email}?subject=Support Request`; break;
    }
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open communication app.'));
    setSupportModal(false);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerDecoration} />
        
        <View style={styles.topSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.nameText}>{user.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user.role}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <Card style={styles.card}>
            <View style={styles.item}>
              <View style={styles.iconBox}><Ionicons name="call" size={20} color={COLORS.primary} /></View>
              <View>
                <Text style={styles.itemLabel}>PHONE NUMBER</Text>
                <Text style={styles.itemValue}>{user.phone}</Text>
              </View>
            </View>
            <View style={styles.sep} />
            <View style={styles.item}>
              <View style={styles.iconBox}><Ionicons name="location" size={20} color={COLORS.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemLabel}>DEFAULT DELIVERY ADDRESS</Text>
                <Text style={styles.itemValue} numberOfLines={3}>
                  {user.address || 'Address not configured.'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
              <Text style={styles.editBtnText}>EDIT PROFILE</Text>
            </TouchableOpacity>
          </Card>

          {user.role === 'CUSTOMER' && (
            <>
              <Text style={styles.sectionTitle}>Join the Team</Text>
              {user.deliveryAppStatus === 'NONE' ? (
                <TouchableOpacity style={styles.partnerAction} onPress={handleApplyDelivery}>
                  <Ionicons name="bicycle" size={24} color={COLORS.white} />
                  <Text style={styles.partnerActionText}>Become a Delivery Partner</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.pendingCard}>
                   <Ionicons name="time" size={24} color={COLORS.warning} />
                   <Text style={styles.pendingText}>Application Status: {user.deliveryAppStatus}</Text>
                </View>
              )}
            </>
          )}

          <Text style={styles.sectionTitle}>Help & Support</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setSupportModal(true)}>
            <Ionicons name="headset-outline" size={22} color={COLORS.dark} />
            <Text style={styles.menuText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
            <Text style={[styles.menuText, { color: COLORS.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={editing} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profile</Text>
              <TouchableOpacity onPress={() => setEditing(false)}><Ionicons name="close" size={24} /></TouchableOpacity>
            </View>
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <TextInput style={styles.input} value={formData.name} onChangeText={t => setFormData({...formData, name: t})} />
            </View>
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>DELIVERY ADDRESS</Text>
              <TextInput 
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                value={formData.address} 
                onChangeText={t => setFormData({...formData, address: t})} 
                multiline
                placeholder="Where should we deliver your water?"
              />
            </View>

            <Button title="Save Changes" onPress={handleUpdate} loading={loading} style={styles.saveAction} />
          </View>
        </View>
      </Modal>

      <Modal visible={supportModal} animationType="fade" transparent>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setSupportModal(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Get in Touch</Text>
            <TouchableOpacity style={styles.sheetBtn} onPress={() => contactMethod('WHATSAPP')}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={styles.sheetBtnText}>WhatsApp Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetBtn} onPress={() => contactMethod('CALL')}>
              <Ionicons name="call" size={24} color={COLORS.primary} />
              <Text style={styles.sheetBtnText}>Voice Call</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flexGrow: 1, paddingBottom: 100 },
  headerDecoration: { position: 'absolute', top: 0, left: 0, right: 0, height: 220, backgroundColor: COLORS.primary, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  topSection: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  avatar: { width: 90, height: 90, borderRadius: 30, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium, marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: '900', color: COLORS.primary },
  nameText: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8 },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  content: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: COLORS.secondary, marginBottom: 12, marginTop: 10, letterSpacing: 1, textTransform: 'uppercase' },
  card: { padding: 20, borderRadius: 28, backgroundColor: COLORS.white, ...SHADOWS.light, marginBottom: 20, borderWeight: 1, borderColor: '#f0f0f0' },
  item: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.light, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  itemLabel: { fontSize: 10, fontWeight: '800', color: COLORS.secondary, letterSpacing: 0.5 },
  itemValue: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginTop: 2 },
  sep: { height: 1, backgroundColor: COLORS.light, marginVertical: 16 },
  editBtn: { backgroundColor: COLORS.dark, paddingVertical: 15, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  editBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  partnerAction: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium, marginBottom: 20 },
  partnerActionText: { color: COLORS.white, fontSize: 16, fontWeight: '800', marginLeft: 12 },
  pendingCard: { backgroundColor: COLORS.light, padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  pendingText: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginLeft: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: COLORS.white, borderRadius: 24, marginBottom: 12, ...SHADOWS.light },
  menuText: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.dark, marginLeft: 15 },
  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: COLORS.white, borderRadius: 32, padding: 24, ...SHADOWS.dark },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.dark },
  field: { marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: COLORS.secondary, marginBottom: 8 },
  input: { backgroundColor: COLORS.light, borderRadius: 16, padding: 16, fontSize: 15, fontWeight: '700', color: COLORS.dark },
  saveAction: { marginTop: 10 },
  // Sheet
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: COLORS.dark, marginBottom: 24, textAlign: 'center' },
  sheetBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: COLORS.light, borderRadius: 20, marginBottom: 12 },
  sheetBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginLeft: 15 }
});
