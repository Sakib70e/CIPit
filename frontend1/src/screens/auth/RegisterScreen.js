import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
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
    if (!form.name || !form.phone || !form.password) {
      Alert.alert('Error', 'Name, Phone and Password are required');
      return;
    }

    try {
      setLoading(true);
      // Backend automatically sets role to CUSTOMER
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Join CIPit 💧</Text>
        <Text style={styles.subtitle}>Get fresh water delivered today</Text>

        <View style={styles.formSpace}>
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={form.name}
            onChangeText={(v) => setForm({...form, name: v})}
          />
          <Input
            label="Phone Number"
            placeholder="0123456789"
            value={form.phone}
            onChangeText={(v) => setForm({...form, phone: v})}
            keyboardType="phone-pad"
          />
          <Input
            label="Email (Optional)"
            placeholder="john@example.com"
            value={form.email}
            onChangeText={(v) => setForm({...form, email: v})}
            keyboardType="email-address"
          />
          <Input
            label="Delivery Address"
            placeholder="House no, Street, City"
            value={form.address}
            onChangeText={(v) => setForm({...form, address: v})}
            multiline
          />
          <Input
            label="Password"
            placeholder="Min. 6 characters"
            value={form.password}
            onChangeText={(v) => setForm({...form, password: v})}
            secureTextEntry
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.button}
          />

          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            style={styles.link}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkAction}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, padding: 24, paddingVertical: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#003366', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8, textAlign: 'center', marginBottom: 30 },
  formSpace: { width: '100%' },
  button: { marginTop: 10 },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#666', fontSize: 15 },
  linkAction: { color: '#007BFF', fontWeight: 'bold' },
});
