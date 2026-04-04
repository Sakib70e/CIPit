import React, { useState } from 'react';
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
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { COLORS, SHADOWS } from '../../constants/theme';
import { Card } from '../../components/Card';
import api from '../../services/api';

export const ProfileScreen = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    name: user?.name || '', 
    address: user?.address || '',
    email: user?.email || '' 
  });
  const [supportModal, setSupportModal] = useState(false);

  // Configuration for support
  const SUPPORT_NODE = {
    phone: '+1234567890',
    email: 'support@cipit.com',
    whatsapp: '1234567890'
  };

  const handleUpdate = async () => {
     try {
       setLoading(true);
       const res = await api.put('/users/me', formData);
       updateUser(res.data.data);
       setEditing(false);
       Alert.alert('Success', 'Profile updated successfully.');
     } catch (err) {
       Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
     } finally {
       setLoading(false);
     }
  };

  const handleApplyDelivery = async () => {
    Alert.alert(
      'Apply as Delivery Partner',
      'Would you like to join our delivery team? Your request will be reviewed by an administrator.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply Now', 
          onPress: async () => {
            try {
              setLoading(true);
              await api.post('/users/apply-delivery');
              updateUser({ ...user, deliveryAppStatus: 'PENDING' });
              Alert.alert('Application Sent', 'We will review your profile shortly.');
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Application failed');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const contactMethod = (type) => {
    let url = '';
    switch(type) {
      case 'WHATSAPP': url = `whatsapp://send?phone=${SUPPORT_NODE.whatsapp}&text=Hello CIPit Support, my name is ${user.name}`; break;
      case 'CALL': url = `tel:${SUPPORT_NODE.phone}`; break;
      case 'MAIL': url = `mailto:${SUPPORT_NODE.email}?subject=Support Request`; break;
    }
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open communication app.'));
    setSupportModal(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.topCurve} />
        
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarMain}>
              <Text style={styles.avatarLetter}>{user?.name?.[0].toUpperCase()}</Text>
            </View>
            <View style={styles.statusBadge} />
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>{user?.role || 'Customer'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={styles.statVal}>Active</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionHeader}>Personal Information</Text>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="call" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.infoTexts}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{user?.phone}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
              </View>
              <View style={[styles.infoTexts, { flex: 1 }]}>
                <Text style={styles.infoLabel}>Delivery Address</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{user?.address || 'No address set.'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
              <Text style={styles.editBtnText}>EDIT PROFILE</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {user?.role === 'CUSTOMER' && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionHeader}>Partner Program</Text>
            {user?.deliveryAppStatus === 'NONE' ? (
              <TouchableOpacity style={styles.partnerBtn} onPress={handleApplyDelivery} disabled={loading}>
                <Ionicons name="bicycle" size={24} color={COLORS.white} />
                <Text style={styles.partnerBtnText}>Apply as Delivery Partner</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.partnerBtn, { backgroundColor: COLORS.light }]}>
                <Ionicons 
                  name={user?.deliveryAppStatus === 'PENDING' ? 'time' : 'checkmark-circle'} 
                  size={24} 
                  color={user?.deliveryAppStatus === 'PENDING' ? COLORS.warning : COLORS.success} 
                />
                <Text style={[styles.partnerBtnText, { color: COLORS.dark, marginLeft: 12 }]}>
                  Partner Status: {user?.deliveryAppStatus}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={[styles.infoSection, { marginBottom: 30 }]}>
          <Text style={styles.sectionHeader}>Account Settings</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setSupportModal(true)}>
            <View style={[styles.menuIcon, { backgroundColor: '#4E73DF20' }]}>
              <Ionicons name="headset" size={20} color="#4E73DF" />
            </View>
            <Text style={styles.menuText}>Support Center</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.border} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Security', 'Password reset feature currently restricted.')}>
            <View style={[styles.menuIcon, { backgroundColor: '#1CC88A20' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#1CC88A" />
            </View>
            <Text style={styles.menuText}>Security & Password</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.border} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={logout}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.danger + '20' }]}>
              <Ionicons name="power" size={20} color={COLORS.danger} />
            </View>
            <Text style={[styles.menuText, { color: COLORS.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal visible={editing} animationType="fade" transparent={true} onRequestClose={() => setEditing(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Profile</Text>
            <View style={styles.inputGroup}>
               <Text style={styles.label}>FULL NAME</Text>
               <TextInput 
                  style={styles.input} 
                  value={formData.name} 
                  onChangeText={(val) => setFormData({...formData, name: val})}
               />
            </View>
            <View style={styles.inputGroup}>
               <Text style={styles.label}>EMAIL ADDRESS</Text>
               <TextInput 
                  style={styles.input} 
                  value={formData.email} 
                  onChangeText={(val) => setFormData({...formData, email: val})}
                  keyboardType="email-address"
               />
            </View>
            <View style={styles.inputGroup}>
               <Text style={styles.label}>DELIVERY ADDRESS</Text>
               <TextInput 
                  style={[styles.input, { minHeight: 80 }]} 
                  value={formData.address} 
                  onChangeText={(val) => setFormData({...formData, address: val})}
                  multiline
               />
            </View>
            <View style={styles.modalActions}>
               <TouchableOpacity style={styles.cancelLink} onPress={() => setEditing(false)} disabled={loading}>
                  <Text style={styles.cancelLinkText}>ABORT</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading}>
                  {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>SAVE CHANGES</Text>}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Support Action Sheet */}
      <Modal visible={supportModal} animationType="slide" transparent={true} onRequestClose={() => setSupportModal(false)}>
        <View style={styles.modalOverlay}>
           <View style={styles.actionSheet}>
              <Text style={styles.sheetTitle}>Contact Support</Text>
              <TouchableOpacity style={styles.sheetBtn} onPress={() => contactMethod('WHATSAPP')}>
                 <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                 <Text style={styles.sheetBtnText}>WhatsApp Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetBtn} onPress={() => contactMethod('CALL')}>
                 <Ionicons name="call" size={24} color={COLORS.primary} />
                 <Text style={styles.sheetBtnText}>Voice Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetBtn} onPress={() => contactMethod('MAIL')}>
                 <Ionicons name="mail" size={24} color="#4E73DF" />
                 <Text style={styles.sheetBtnText}>Email Support</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetClose} onPress={() => setSupportModal(false)}>
                 <Text style={styles.sheetCloseText}>CLOSE</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  topCurve: { position: 'absolute', top: 0, left: 0, right: 0, height: 180, backgroundColor: COLORS.primary, borderBottomLeftRadius: 50, borderBottomRightRadius: 50 },
  profileHeader: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  avatarContainer: { marginBottom: 12 },
  avatarMain: { width: 100, height: 100, borderRadius: 34, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium },
  avatarLetter: { fontSize: 42, fontWeight: '900', color: COLORS.primary },
  statusBadge: { position: 'absolute', bottom: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.success, borderWidth: 4, borderColor: COLORS.white },
  userName: { fontSize: 22, fontWeight: '900', color: COLORS.white, marginBottom: 6, letterSpacing: -0.5 },
  roleTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  roleText: { color: COLORS.white, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 20, padding: 20, borderRadius: 24, ...SHADOWS.medium, marginBottom: 25 },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '900', color: COLORS.dark, marginTop: 2 },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  statDivider: { width: 1, backgroundColor: COLORS.border, height: '80%' },
  infoSection: { paddingHorizontal: 20, marginBottom: 25 },
  sectionHeader: { fontSize: 15, fontWeight: '900', color: COLORS.dark, marginBottom: 12, letterSpacing: -0.2 },
  infoCard: { padding: 20, borderRadius: 24, backgroundColor: COLORS.white, ...SHADOWS.light, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.light, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  infoTexts: { flex: 1 },
  infoLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '800', textTransform: 'uppercase' },
  infoValue: { fontSize: 14, color: COLORS.dark, fontWeight: '700', marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 18, opacity: 0.3 },
  editBtn: { marginTop: 20, backgroundColor: COLORS.dark, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  editBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  partnerBtn: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium },
  partnerBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800', marginLeft: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  menuIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.dark },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: COLORS.white, borderRadius: 32, padding: 24, ...SHADOWS.dark },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.dark, marginBottom: 20, textAlign: 'center' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '900', marginBottom: 8 },
  input: { backgroundColor: COLORS.light, borderRadius: 16, padding: 16, fontSize: 14, fontWeight: '700', color: COLORS.dark, minHeight: 50 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cancelLink: { padding: 12 },
  cancelLinkText: { color: COLORS.textSecondary, fontWeight: '900', fontSize: 13 },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, ...SHADOWS.medium, minWidth: 140, alignItems: 'center' },
  saveBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 13 },
  
  // Action Sheet
  actionSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheetTitle: { fontSize: 16, fontWeight: '900', color: COLORS.dark, marginBottom: 20, textAlign: 'center' },
  sheetBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: COLORS.light, borderRadius: 18, marginBottom: 12 },
  sheetBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginLeft: 15 },
  sheetClose: { padding: 12, alignItems: 'center', marginTop: 10 },
  sheetCloseText: { color: COLORS.textSecondary, fontWeight: '900' }
});
