import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

export const Input = ({ label, error, style, containerStyle, ...props }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        error && styles.inputError,
        style
      ]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.textSecondary}
          {...props}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 4,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
});
