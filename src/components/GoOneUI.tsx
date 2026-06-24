/**
 * GoOne Shared UI Components
 * Reusable components matching the GoOne design system
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';

// ─── Brand Gradient Header ────────────────────────────────────────────────────
interface GradientHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
  color?: 'main' | 'blue' | 'purple' | 'green' | 'warm' | 'emergency';
  paddingBottom?: number;
}

const HEADER_COLORS: Record<string, string> = {
  main: '#1A6FD4',
  blue: '#1A6FD4',
  purple: '#7B2FBE',
  green: '#16A34A',
  warm: '#EA580C',
  emergency: '#DC2626',
};

const HEADER_COLORS_END: Record<string, string> = {
  main: '#9B1D6E',
  blue: '#4B9CF5',
  purple: '#C084FC',
  green: '#4ADE80',
  warm: '#D97706',
  emergency: '#C2296F',
};

export function GradientHeader({
  children,
  style,
  color = 'main',
  paddingBottom = 48,
}: GradientHeaderProps) {
  return (
    <View
      style={[
        styles.gradientHeader,
        { backgroundColor: HEADER_COLORS[color], paddingBottom },
        style,
      ]}
    >
      {/* Decorative circles */}
      <View style={[styles.headerCircle, { width: 200, height: 200, top: -60, right: -60 }]} />
      <View style={[styles.headerCircle, { width: 120, height: 120, bottom: 0, left: 40 }]} />
      <View style={[styles.headerCircle, { width: 80, height: 80, top: 20, left: -20 }]} />
      {children}
    </View>
  );
}

// ─── GoOne Primary Button ─────────────────────────────────────────────────────
interface GoOneButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'green' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export function GoOneButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  labelStyle,
}: GoOneButtonProps) {
  const btnStyle = [
    styles.button,
    styles[`btn_${size}`] as ViewStyle,
    styles[`btn_${variant}`] as ViewStyle,
    fullWidth && styles.btnFullWidth,
    (disabled || loading) && styles.btnDisabled,
    style,
  ];

  return (
    <TouchableOpacity
      style={btnStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'secondary' || variant === 'outline' ? Colors.bluePrimary : Colors.white} />
      ) : (
        <>
          {icon}
          <Text style={[styles.btnLabel, styles[`btnLabel_${variant}`] as TextStyle, labelStyle]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  value: string;
  label: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ value, label, trend, trendUp = true }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend && (
        <Text style={[styles.statTrend, { color: trendUp ? Colors.greenPrimary : Colors.redPrimary }]}>
          {trendUp ? '↑' : '↓'} {trend}
        </Text>
      )}
    </View>
  );
}

// ─── Voice Button ─────────────────────────────────────────────────────────────
interface VoiceButtonProps {
  onPress: () => void;
  size?: number;
}

export function VoiceButton({ onPress, size = 36 }: VoiceButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.voiceBtn, { width: size, height: size, borderRadius: size / 2 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={{ fontSize: size * 0.45 }}>🎙️</Text>
    </TouchableOpacity>
  );
}

// ─── Availability Badge ───────────────────────────────────────────────────────
interface AvailBadgeProps {
  status: 'available' | 'busy' | 'away';
  label?: string;
}

const AVAIL_COLORS = {
  available: Colors.greenPrimary,
  busy: Colors.redPrimary,
  away: Colors.amberPrimary,
};

export function AvailBadge({ status, label }: AvailBadgeProps) {
  const color = AVAIL_COLORS[status];
  const defaultLabel = status === 'available' ? 'Available Now' : status === 'busy' ? 'Busy' : 'Away';
  return (
    <View style={styles.availRow}>
      <View style={[styles.availDot, { backgroundColor: color }]} />
      <Text style={[styles.availText, { color }]}>{label || defaultLabel}</Text>
    </View>
  );
}

// ─── Status Chip ──────────────────────────────────────────────────────────────
interface StatusChipProps {
  label: string;
  type?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

const CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  blue: { bg: Colors.blueSoft, text: Colors.bluePrimary },
  green: { bg: Colors.greenSoft, text: Colors.greenPrimary },
  orange: { bg: Colors.orangeSoft, text: Colors.orangePrimary },
  red: { bg: Colors.redSoft, text: Colors.redPrimary },
  purple: { bg: Colors.purpleSoft, text: Colors.purplePrimary },
};

export function StatusChip({ label, type = 'blue' }: StatusChipProps) {
  const { bg, text } = CHIP_COLORS[type];
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color: text }]}>{label}</Text>
    </View>
  );
}

// ─── Pull Tab ─────────────────────────────────────────────────────────────────
export function PullTab({ color = Colors.border }: { color?: string }) {
  return (
    <View style={[styles.pullTab, { backgroundColor: color }]} />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Gradient header
  gradientHeader: {
    paddingTop: 0,
    paddingHorizontal: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Button base
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.full,
  },
  btn_sm: { paddingVertical: 8, paddingHorizontal: 16 },
  btn_md: { paddingVertical: 14, paddingHorizontal: 24 },
  btn_lg: { paddingVertical: 18, paddingHorizontal: 28 },
  btnFullWidth: { width: '100%' },
  btnDisabled: { opacity: 0.5 },

  btn_primary: { backgroundColor: Colors.bluePrimary },
  btn_secondary: { backgroundColor: Colors.blueSoft },
  btn_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.bluePrimary,
  },
  btn_danger: { backgroundColor: Colors.redPrimary },
  btn_green: { backgroundColor: Colors.greenPrimary },
  btn_ghost: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  btnLabel: { fontWeight: '700', fontSize: 14 },
  btnLabel_primary: { color: Colors.white },
  btnLabel_secondary: { color: Colors.bluePrimary },
  btnLabel_outline: { color: Colors.bluePrimary },
  btnLabel_danger: { color: Colors.white },
  btnLabel_green: { color: Colors.white },
  btnLabel_ghost: { color: Colors.white },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  sectionAction: { fontSize: 12, fontWeight: '700', color: Colors.bluePrimary },

  // Stat card
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#1A6FD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.textMuted, marginTop: 2 },
  statTrend: { fontSize: 10, fontWeight: '700', marginTop: 4 },

  // Voice button
  voiceBtn: {
    backgroundColor: Colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avail badge
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: 10, fontWeight: '700' },

  // Chip
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  chipText: { fontSize: 10, fontWeight: '700' },

  // Pull tab
  pullTab: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
});
