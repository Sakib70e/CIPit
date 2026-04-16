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

export const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your registered email address');
      return;
    }

    try {
      setLoading(true);
      // For now, we'll simulate the request. 
      // In a real app, this sends an email with a reset link.
      await api.post('/auth/forgot-password', { email });

      Alert.alert(
        'Code Sent 📧',
        'Please check your email for a 6-digit verification code.',
        [{ text: 'Enter Code', onPress: () => navigation.navigate('VerifyOTP', { email }) }]
      );
    } catch (error) {
      console.error('Forgot password error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong. Please try again later.');
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
            <Logo size={350} style={styles.logo} />
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a 6-digit code to reset your password.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="e.g. yourname@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Button
              title="Send Code"
              onPress={handleReset}
              loading={loading}
              style={styles.button}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView >
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
    textAlign: 'center',
    lineHeight: 22,
    marginHorizontal: 10
  },
  form: { width: '100%' },
  button: { marginTop: 20 },
});
