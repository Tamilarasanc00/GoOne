import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

export default function OfflineBanner() {
  const { t } = useTranslation();
  const isConnected = useNetworkStatus();
  const theme = useTheme();

  if (isConnected) return null;

  return (
    <Surface style={[styles.banner, { backgroundColor: theme.colors.error }]} elevation={2}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="cloud-off-outline" size={18} color="#FFF" />
        <Text style={styles.text}>{t('common.offlineMode', 'Offline Mode - Showing Cached Data')}</Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
