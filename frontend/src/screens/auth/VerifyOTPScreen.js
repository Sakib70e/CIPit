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

export const VerifyOTPScreen = ({ navigation, route }) => {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/verify-reset-code', { email, code });
      
      // Navigate to final reset screen
      navigation.navigate('ResetPassword', { email, code });
    } catch (error) {
      console.error('Verify OTP error:', error.response?.data || error.message);
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid or expired code');
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
            <Text style={styles.title}>Verify Code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to {email}
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Verification Code"
              placeholder="000000"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.otpInput}
            />

            <Button
              title="Verify Code"
              onPress={handleVerify}
              loading={loading}
              style={styles.button}
            />

            <TouchableOpacity 
              style={styles.resendBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.resendText}>Didn't receive code? Resend</Text>
            </TouchableOpacity>
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
    zIndex: 1
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
    marginHorizontal: 10
  },
  form: { width: '100%' },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 10,
    fontWeight: 'bold'
  },
  button: { marginTop: 20 },
  resendBtn: { 
    marginTop: 25, 
    alignItems: 'center' 
  },
  resendText: { 
    color: COLORS.primary, 
    fontWeight: '600',
    fontSize: 14 
  },
});
