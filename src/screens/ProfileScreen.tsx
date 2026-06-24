import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, StatusBar, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { storage, StorageKeys } from '../services/storage';
import { showToast } from '../utils/toast';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { resetProfile } from '../redux/slices/profileSlice';
import { setRole } from '../redux/slices/appSlice';
import Colors from '../constants/colors';
import { Radius, Spacing } from '../constants/spacing';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ROLE_EMOJI: Record<string, string> = {
  retail_shop: '🏪',
  farmer: '🌾',
  service_worker: '🔧',
  rental_owner: '🚜',
  customer: '🛒',
};

interface MenuItemProps {
  emoji: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  rightEl?: React.ReactNode;
}

function MenuItem({ emoji, title, subtitle, onPress, danger, rightEl }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && { backgroundColor: Colors.redSoft }]}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, danger && { color: Colors.redPrimary }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      {rightEl || <Text style={styles.menuArrow}>›</Text>}
    </TouchableOpacity>
  );
}

const getNormalizedRole = (role: string | null): string => {
  if (!role) return 'customer';
  const lower = role.toLowerCase().replace(' ', '_');
  if (lower === 'retailer') return 'retail_shop';
  return lower;
};

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.profile.user);
  const role = useAppSelector((state: any) => state.profile.role);
  const profile = useAppSelector((state: any) => state.profile.profile);
  const [darkMode, setDarkMode] = useState(false);
  const [notifs, setNotifs] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: () => {
          storage.remove('APP_JWT_TOKEN');
          storage.remove(StorageKeys.USER_ROLE);
          storage.remove(StorageKeys.USER_PROFILE);
          dispatch(resetProfile());
          dispatch(setRole(null));
          showToast('Logged out successfully');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  };

  const userName = user?.name || 'GoOne User';
  const firstName = userName.split(' ')[0];
  const normalizedRole = getNormalizedRole(role);
  const roleEmoji = ROLE_EMOJI[normalizedRole] || '👤';
  const roleLabel = role ? role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Customer';

  const goToDashboard = () => {
    const screens: Record<string, string> = {
      retail_shop: 'RetailerDashboard',
      farmer: 'FarmerDashboard',
      service_worker: 'WorkerDashboard',
      rental_owner: 'RentalDashboard',
    };
    const screen = screens[normalizedRole];
    if (screen) navigation.navigate(screen as any);
    else showToast('Dashboard only available for providers');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.purplePrimary} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.circle, { width: 200, height: 200, top: -60, right: -60 }]} />
          <View style={[styles.circle, { width: 120, height: 120, bottom: -10, left: 30 }]} />

          {navigation.canGoBack() && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonTxt}>← Go Back</Text>
            </TouchableOpacity>
          )}

          <View style={styles.headerContent}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              {user?.avatar && user.avatar.startsWith('data:image') ? (
                <Image source={{ uri: user.avatar }} style={{ width: 82, height: 82, borderRadius: 41 }} />
              ) : (
                <Text style={styles.avatarTxt}>{firstName[0]}</Text>
              )}
              <View style={styles.roleEmojiBadge}><Text style={{ fontSize: 14 }}>{roleEmoji}</Text></View>
            </View>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userPhone}>{user?.phone_number || '+91 98765 43210'}</Text>
            {/* Role badge */}
            <View style={styles.roleBadge}>
              <Text style={styles.roleLabel}>{roleEmoji} {roleLabel}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[{ v: '12', l: 'Orders' }, { v: '4.8⭐', l: 'Rating' }, { v: '3', l: 'Bookings' }].map(s => (
              <View key={s.l} style={styles.statItem}>
                <Text style={styles.statVal}>{s.v}</Text>
                <Text style={styles.statLbl}>{s.l}</Text>
              </View>
            ))}
          </View>

          {/* Edit button */}
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate('CreateProfile', { isEdit: true })}>
            <Text style={styles.editProfileTxt}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu sections */}
        <View style={styles.body}>
          {/* Account */}
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.menuGroup}>
            <MenuItem emoji="✏️" title="Edit Profile" subtitle="Update your details" onPress={() => navigation.navigate('CreateProfile', { isEdit: true })} />
            {normalizedRole === 'retail_shop' && profile?.id && (
              <>
                <View style={styles.divider} />
                <MenuItem 
                  emoji="🏪" 
                  title="View Public Shop" 
                  subtitle="See how customers view your shop" 
                  onPress={() => navigation.navigate('ShopDetails', { shopId: String(profile.id), shopName: profile.name })} 
                />
              </>
            )}
            {normalizedRole === 'service_worker' && profile?.id && (
              <>
                <View style={styles.divider} />
                <MenuItem 
                  emoji="🔧" 
                  title="View Public Profile" 
                  subtitle="See how customers view your profile" 
                  onPress={() => navigation.navigate('WorkerDetails', { workerId: String(profile.id), workerName: user?.name || 'Worker' })} 
                />
              </>
            )}
            <View style={styles.divider} />
            <MenuItem emoji="🌐" title="Language" subtitle="தமிழ் · Tamil" onPress={() => navigation.navigate('LanguageSelection')} />
          </View>

          {/* Activity */}
          {normalizedRole === 'customer' ? (
            <>
              <Text style={styles.sectionTitle}>MY ACTIVITY</Text>
              <View style={styles.menuGroup}>
                <MenuItem emoji="💼" title="Job Postings" subtitle="Hire workers & manage jobs" onPress={() => navigation.navigate('EmployerDashboard')} />
                <View style={styles.divider} />
                <MenuItem emoji="📅" title="My Bookings" subtitle="Active and past bookings" onPress={() => navigation.navigate('MainTabs')} />
                <View style={styles.divider} />
                <MenuItem emoji="❤️" title="Saved" subtitle="Favorites shops & workers" onPress={() => showToast('Coming soon!')} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>MY ACTIVITY</Text>
              <View style={styles.menuGroup}>
                <MenuItem emoji={roleEmoji} title="My Dashboard" subtitle={`${roleLabel} dashboard`} onPress={goToDashboard} />
              </View>
            </>
          )}

          {/* Preferences */}
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              emoji="🌙"
              title="Dark Mode"
              subtitle={darkMode ? 'Enabled' : 'Disabled'}
              onPress={() => setDarkMode(d => !d)}
              rightEl={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  thumbColor={Colors.white}
                  trackColor={{ false: Colors.border, true: Colors.purplePrimary }}
                />
              }
            />
            <View style={styles.divider} />
            <MenuItem
              emoji="🔔"
              title="Notifications"
              subtitle={notifs ? 'Enabled' : 'Disabled'}
              onPress={() => setNotifs(n => !n)}
              rightEl={
                <Switch
                  value={notifs}
                  onValueChange={setNotifs}
                  thumbColor={Colors.white}
                  trackColor={{ false: Colors.border, true: Colors.bluePrimary }}
                />
              }
            />
            <View style={styles.divider} />
            <MenuItem emoji="🔒" title="Privacy" subtitle="Data & permissions" onPress={() => showToast('Privacy settings coming soon')} />
          </View>

          {/* Support */}
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <View style={styles.menuGroup}>
            <MenuItem emoji="❓" title="Help & Support" subtitle="FAQs & Customer Care" onPress={() => showToast('Help center coming soon')} />
            <View style={styles.divider} />
            <MenuItem emoji="⭐" title="Rate GoOne" subtitle="Love the app? Rate us" onPress={() => showToast('Thanks! Rating feature coming soon')} />
            <View style={styles.divider} />
            <MenuItem emoji="ℹ️" title="About GoOne" subtitle="Version 1.0.0" onPress={() => showToast('GoOne v1.0.0 — Home & Community Hub')} />
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutTxt}>🚪 Log Out</Text>
          </TouchableOpacity>

          <Text style={styles.versionTxt}>GoOne v1.0.0 · Made with ❤️ for Rural India</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    backgroundColor: Colors.purplePrimary,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md + 24, // Add spacing for back button at top
    paddingBottom: Spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  backButtonTxt: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
  headerContent: { alignItems: 'center', zIndex: 1, width: '100%' },
  avatarWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, position: 'relative',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarTxt: { fontSize: 36, fontWeight: '800', color: Colors.white },
  roleEmojiBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 4,
  },
  userName: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  userPhone: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 6, marginBottom: Spacing.md,
  },
  roleLabel: { fontSize: 12, fontWeight: '800', color: Colors.white },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.lg, padding: Spacing.md,
    justifyContent: 'space-around',
    width: '100%', zIndex: 1, marginBottom: Spacing.md,
  },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '900', color: Colors.white },
  statLbl: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  editProfileBtn: {
    backgroundColor: Colors.white, borderRadius: Radius.full,
    paddingHorizontal: 20, paddingVertical: 10, zIndex: 1,
  },
  editProfileTxt: { fontSize: 13, fontWeight: '700', color: Colors.purplePrimary },

  body: { padding: Spacing.md, paddingBottom: Spacing.xl },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: Colors.textMuted,
    letterSpacing: 1.2, marginTop: 20, marginBottom: 8, marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 2,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  menuIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bgLight, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  menuSub: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  menuArrow: { fontSize: 20, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 64 },

  logoutBtn: {
    marginTop: Spacing.lg, backgroundColor: Colors.redSoft,
    borderRadius: Radius.lg, padding: Spacing.md + 4, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.redPrimary + '40',
  },
  logoutTxt: { fontSize: 15, fontWeight: '800', color: Colors.redPrimary },

  versionTxt: { textAlign: 'center', fontSize: 11, color: Colors.textMuted, marginTop: Spacing.md },
});
