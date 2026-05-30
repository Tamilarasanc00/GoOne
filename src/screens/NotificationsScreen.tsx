import React from 'react';
import { View, StyleSheet, SectionList } from 'react-native';
import { Text, Surface, useTheme, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Types: Booking Updates, Nearby Requests, Offers, Messages
const NOTIFICATIONS = [
  {
    title: 'Today',
    data: [
      {
        id: '1',
        type: 'booking',
        title: 'Booking Confirmed',
        message: 'Your request for Electrician Muthu Kumar is confirmed for 2:00 PM today.',
        time: '10:30 AM',
        isRead: false,
      },
      {
        id: '2',
        type: 'nearby',
        title: 'Emergency: Need Tractor',
        message: 'A farmer 2km away requested a tractor for urgent plowing.',
        time: '08:15 AM',
        isRead: false,
      },
    ],
  },
  {
    title: 'Yesterday',
    data: [
      {
        id: '3',
        type: 'offer',
        title: 'Festival Offer on Rentals!',
        message: 'Get 20% off on all tractor and JCB rentals this weekend.',
        time: '04:00 PM',
        isRead: true,
      },
      {
        id: '4',
        type: 'message',
        title: 'New Message from Ramu',
        message: 'Are the organic tomatoes still available?',
        time: '11:45 AM',
        isRead: true,
      },
      {
        id: '5',
        type: 'booking',
        title: 'Job Applied',
        message: 'You have successfully applied for the Construction Worker role at L&T Sites.',
        time: '09:00 AM',
        isRead: true,
      },
    ],
  },
];

export default function NotificationsScreen() {
  const theme = useTheme();

  const getIconData = (type: string) => {
    switch (type) {
      case 'booking':
        return { icon: 'calendar-check', color: '#4CAF50', bg: '#E8F5E9' };
      case 'nearby':
        return { icon: 'alert-circle-outline', color: '#F44336', bg: '#FFEBEE' };
      case 'offer':
        return { icon: 'brightness-percent', color: '#FF9800', bg: '#FFF3E0' };
      case 'message':
        return { icon: 'message-text-outline', color: '#2196F3', bg: '#E3F2FD' };
      default:
        return { icon: 'bell-outline', color: '#757575', bg: '#F5F5F5' };
    }
  };

  const renderNotification = ({ item }: { item: typeof NOTIFICATIONS[0]['data'][0] }) => {
    const { icon, color, bg } = getIconData(item.type);

    return (
      <Surface 
        style={[styles.notificationCard, { backgroundColor: item.isRead ? theme.colors.surface : '#F0F8FF' }]} 
        elevation={0}
      >
        <View style={[styles.iconContainer, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        
        <View style={styles.textContainer}>
          <Text variant="titleMedium" style={[styles.title, !item.isRead && { fontWeight: 'bold' }]}>
            {item.title}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={2}>
            {item.message}
          </Text>
          <Text variant="labelSmall" style={styles.timeText}>
            {item.time}
          </Text>
        </View>

        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />}
      </Surface>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <Text variant="titleMedium" style={styles.sectionHeader}>
      {title}
    </Text>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Notifications</Text>
        <MaterialCommunityIcons name="bell-ring-outline" size={28} color={theme.colors.primary} />
      </View>

      <SectionList
        sections={NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 24,
  },
  sectionHeader: {
    fontWeight: 'bold',
    color: '#757575',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 4,
  },
  timeText: {
    marginTop: 8,
    color: '#9E9E9E',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginLeft: 8,
  },
});
