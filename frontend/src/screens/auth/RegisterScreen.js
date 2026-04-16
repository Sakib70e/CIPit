import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView
} from 'react-native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { COLORS, SIZES } from '../../constants/theme';
import api from '../../services/api';

export const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.password || !form.email) {
      Alert.alert('Error', 'Name, Phone, Email and Password are required');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/register', form);

      Alert.alert('Success ✨', 'Account created! Now login to start ordering.', [
        { text: 'Login Now', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong');
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Logo size={350} style={styles.logo} />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Fill in your details to get started</Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              label="Full Name"
              placeholder="e.g. John Doe"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              containerStyle={styles.input}
            />
            <Input
              label="Phone Number"
              placeholder="e.g. 0123456789"
              value={form.phone}
              onChangeText={(v) => setForm({ ...form, phone: v })}
              keyboardType="phone-pad"
              containerStyle={styles.input}
            />
            <Input
              label="Email Address"
              placeholder="e.g. john@example.com"
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={styles.input}
            />
            <Input
              label="Delivery Address"
              placeholder="House no, Street, City"
              value={form.address}
              onChangeText={(v) => setForm({ ...form, address: v })}
              multiline
              containerStyle={styles.input}
            />
            <Input
              label="Password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              secureTextEntry
              containerStyle={styles.input}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkAction}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 40,
    paddingTop: 20
  },
  header: {
    alignItems: 'center',
    marginBottom: 20
  },
  logo: { marginBottom: -130, marginTop: -100 },
  title: {
    fontSize: SIZES.h2,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 2
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  formContainer: { width: '100%' },
  input: { marginBottom: 8 },
  button: { marginTop: 12 },
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14
  },
  linkAction: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});