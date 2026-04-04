import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { COLORS, SIZES } from '../../constants/theme';
import api from '../../services/api';

export const ResetPasswordScreen = ({ navigation, route }) => {
  const { email, code } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/reset-password', { email, code, newPassword });

      Alert.alert('Success ✨', 'Your password has been reset successfully. Please login with your new password.', [
        { text: 'Login Now', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      console.error('Reset password error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Logo size={300} style={styles.logo} />
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>
              Set a new secure password for your account.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="New Password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Input
              label="Confirm New Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              containerStyle={styles.formItem}
            />

            <Button
              title="Reset Password"
              onPress={handleReset}
              loading={loading}
              style={styles.button}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1, justifyContent: 'center' },
  content: { paddingHorizontal: SIZES.padding },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: SIZES.padding,
    paddingVertical: 10,
    zIndex: 10
  },
  backBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 16
  },
  header: {
    alignItems: 'center',
    marginBottom: 30
  },
  logo: { marginBottom: -100, marginTop: -100 },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center'
  },
  form: { width: '100%' },
  formItem: { marginTop: 10 },
  button: { marginTop: 25 },
});
