import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export const Badge = ({ label, status, style, textStyle }) => {
  const getStatusStyle = () => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return { bg: '#FFF3CD', text: '#856404' };
      case 'ASSIGNED':
        return { bg: '#D1ECF1', text: '#0C5460' };
      case 'OUT_FOR_DELIVERY':
        return { bg: '#CCE5FF', text: '#004085' };
      case 'DELIVERED':
        return { bg: '#D4EDDA', text: '#155724' };
      case 'CANCELLED':
        return { bg: '#F8D7DA', text: '#721C24' };
      case 'PAID':
        return { bg: COLORS.success + '20', text: COLORS.success };
      case 'UNPAID':
        return { bg: COLORS.danger + '20', text: COLORS.danger };
      default:
        return { bg: COLORS.light, text: COLORS.dark };
    }
  };

  const colors = getStatusStyle();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }, textStyle]}>
        {label || status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
