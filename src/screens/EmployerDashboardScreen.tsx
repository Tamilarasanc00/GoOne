import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { Text, Surface, useTheme, Avatar, IconButton, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { apiService } from '../services/apiService';
import { showToast } from '../utils/toast';

type EmployerDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const PRIMARY_COLOR = '#3F51B5'; // Indigo for job employer theme

export default function EmployerDashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation<EmployerDashboardNavigationProp>();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Record<string, any[]>>({});
  const [loadingApplicants, setLoadingApplicants] = useState<Record<string, boolean>>({});

  const loadJobs = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiService.jobs.listMyJobs();
      if (res && res.success) {
        setJobs(res.jobs || []);
      } else {
        setError(true);
      }
    } catch (err) {
      console.warn('Failed to load employer jobs:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [])
  );

  const handleToggleJobStatus = async (jobId: number, currentStatus: boolean, title: string) => {
    const actionText = currentStatus ? 'Close' : 'Re-open';
    Alert.alert(
      `${actionText} Job Post`,
      `Are you sure you want to ${actionText.toLowerCase()} "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText,
          style: currentStatus ? 'destructive' : 'default',
          onPress: async () => {
            showToast(`${currentStatus ? 'Closing' : 'Opening'} job...`);
            try {
              // Fetch details to preserve details but change status
              const detailRes = await apiService.jobs.getDetails(jobId);
              if (detailRes && detailRes.success && detailRes.job) {
                const payload = {
                  ...detailRes.job,
                  status: !currentStatus
                };
                const res = await apiService.jobs.update(jobId, payload);
                if (res && res.success) {
                  showToast(`Job ${currentStatus ? 'closed' : 'opened'} successfully`);
                  loadJobs();
                } else {
                  showToast('Failed to change status');
                }
              }
            } catch (err: any) {
              showToast(err.message || 'Error updating job status');
            }
          }
        }
      ]
    );
  };

  const handleDeleteJob = (jobId: number, title: string) => {
    Alert.alert(
      'Delete Job Post',
      `Are you sure you want to permanently delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            showToast('Deleting job post...');
            try {
              const res = await apiService.jobs.delete(jobId);
              if (res && res.success) {
                showToast('Job post deleted successfully');
                loadJobs();
              } else {
                showToast('Failed to delete job post');
              }
            } catch (err: any) {
              showToast(err.message || 'Error deleting job');
            }
          }
        }
      ]
    );
  };

  const loadJobApplications = async (jobId: string) => {
    setLoadingApplicants(prev => ({ ...prev, [jobId]: true }));
    try {
      const res = await apiService.jobs.getApplications(parseInt(jobId, 10));
      if (res && res.success) {
        setApplicants(prev => ({ ...prev, [jobId]: res.applications || [] }));
      }
    } catch (err) {
      console.warn('Failed to load applications:', err);
    } finally {
      setLoadingApplicants(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleToggleExpand = (jobId: string) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
      if (!applicants[jobId]) {
        loadJobApplications(jobId);
      }
    }
  };

  const handleCall = (name: string, phone: string) => {
    if (!phone) {
      showToast('Phone number not available');
      return;
    }
    showToast(`Calling ${name}...`);
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (name: string, phone: string) => {
    if (!phone) {
      showToast('WhatsApp number not available');
      return;
    }
    showToast(`Opening WhatsApp for ${name}...`);
    let cleanPhone = phone.replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.length === 10) {
        cleanPhone = `+91${cleanPhone}`;
      } else {
        cleanPhone = `+${cleanPhone}`;
      }
    }
    const url = `whatsapp://send?phone=${cleanPhone}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://wa.me/${cleanPhone.replace('+', '')}`);
      }
    });
  };

  // Metrics calculating
  const totalJobsCount = jobs.length;
  const activeJobsCount = jobs.filter(j => j.status === true || j.status === 'true').length;
  const closedJobsCount = totalJobsCount - activeJobsCount;
  
  // Total applications counting
  let totalCandidatesCount = 0;
  Object.values(applicants).forEach(arr => {
    totalCandidatesCount += arr.length;
  });

  const renderStatCard = (title: string, value: string, icon: string, color: string) => (
    <Surface style={styles.statCard} elevation={1}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <Text variant="headlineSmall" style={styles.statValue}>{value}</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{title}</Text>
    </Surface>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text variant="titleLarge" style={styles.headerTitle}>Employer Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Metric Cards Row */}
        <View style={styles.statsRow}>
          {renderStatCard('Active Jobs', String(activeJobsCount), 'briefcase-check-outline', '#4CAF50')}
          {renderStatCard('Closed Jobs', String(closedJobsCount), 'briefcase-off-outline', '#757575')}
        </View>

        {/* Quick actions */}
        <Surface style={styles.quickActionCard} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionHeader}>Manage Postings</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => navigation.navigate('AddJob')} 
              style={styles.actionCardWrapper}
            >
              <Surface style={styles.actionCard} elevation={2}>
                <MaterialCommunityIcons name="briefcase-plus-outline" size={32} color={PRIMARY_COLOR} style={{ marginBottom: 8 }} />
                <Text variant="titleMedium" style={{ fontWeight: 'bold', textAlign: 'center' }}>Post New Job</Text>
              </Surface>
            </TouchableOpacity>
          </View>
        </Surface>

        {/* Jobs list */}
        <View style={styles.listingsHeaderContainer}>
          <Text variant="titleLarge" style={styles.listingsHeader}>My Job Postings ({jobs.length})</Text>
          <IconButton icon="refresh" size={24} onPress={loadJobs} />
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={{ marginTop: 12 }}>Loading job posts...</Text>
          </View>
        ) : error ? (
          <Surface style={styles.errorCard} elevation={1}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#D32F2F" />
            <Text variant="titleMedium" style={{ marginTop: 8, fontWeight: 'bold' }}>Failed to Load Postings</Text>
            <Button mode="contained" onPress={loadJobs} style={{ marginTop: 12, backgroundColor: PRIMARY_COLOR }}>Retry</Button>
          </Surface>
        ) : jobs.length === 0 ? (
          <Surface style={styles.emptyCard} elevation={1}>
            <MaterialCommunityIcons name="briefcase-outline" size={64} color="#BDBDBD" />
            <Text variant="titleLarge" style={{ marginTop: 12, color: '#757575', fontWeight: 'bold' }}>No Jobs Posted Yet</Text>
            <Text variant="bodyMedium" style={{ color: '#9E9E9E', textAlign: 'center', marginTop: 4, paddingHorizontal: 16 }}>
              Act as an employer and hire daily wage helpers by posting your first job requirement.
            </Text>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('AddJob')} 
              style={{ marginTop: 16, backgroundColor: PRIMARY_COLOR }}
            >
              Post a Job Now
            </Button>
          </Surface>
        ) : (
          jobs.map((item) => {
            const isJobOpen = item.status === true || item.status === 'true';
            const isExpanded = expandedJobId === item.id;
            const jobApps = applicants[item.id] || [];
            const appsLoading = loadingApplicants[item.id] || false;

            return (
              <Surface key={item.id} style={styles.jobCard} elevation={1}>
                <View style={styles.jobHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={styles.jobTitle}>{item.title}</Text>
                    <View style={styles.locationRow}>
                      <MaterialCommunityIcons name="map-marker" size={16} color="#757575" />
                      <Text variant="bodyMedium" style={styles.locationText}>{item.location}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: isJobOpen ? '#E8F5E9' : '#ECEFF1' }]}>
                    <Text style={[styles.statusText, { color: isJobOpen ? '#2E7D32' : '#546E7A' }]}>
                      {isJobOpen ? 'OPEN' : 'CLOSED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={styles.detailLabel}>DAILY WAGE</Text>
                    <Text variant="titleMedium" style={styles.detailValue}>{item.wage}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text variant="bodySmall" style={styles.detailLabel}>POSTED DATE</Text>
                    <Text variant="titleMedium" style={styles.detailValue}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : 'Today'}
                    </Text>
                  </View>
                </View>

                {item.description && (
                  <Text variant="bodyMedium" style={styles.jobDescription}>{item.description}</Text>
                )}

                <Divider style={{ marginVertical: 12 }} />

                <View style={styles.cardActions}>
                  <IconButton
                    icon="pencil-outline"
                    mode="outlined"
                    iconColor={PRIMARY_COLOR}
                    size={22}
                    onPress={() => navigation.navigate('AddJob', { jobId: item.id })}
                    style={styles.actionBtn}
                  />
                  <IconButton
                    icon={isJobOpen ? 'briefcase-off-outline' : 'briefcase-check-outline'}
                    mode="outlined"
                    iconColor={isJobOpen ? '#757575' : '#4CAF50'}
                    size={22}
                    onPress={() => handleToggleJobStatus(parseInt(item.id, 10), isJobOpen, item.title)}
                    style={styles.actionBtn}
                  />
                  <IconButton
                    icon="trash-can-outline"
                    mode="outlined"
                    iconColor="#D32F2F"
                    size={22}
                    onPress={() => handleDeleteJob(parseInt(item.id, 10), item.title)}
                    style={styles.actionBtn}
                  />
                  
                  <Button
                    mode="contained"
                    style={{ flex: 1, marginLeft: 8, backgroundColor: PRIMARY_COLOR }}
                    onPress={() => handleToggleExpand(item.id)}
                    labelStyle={{ fontSize: 13 }}
                  >
                    {isExpanded ? 'Hide Applicants' : 'View Applicants'}
                  </Button>
                </View>

                {/* Applications section */}
                {isExpanded && (
                  <View style={styles.applicantsContainer}>
                    <Divider style={{ marginBottom: 12 }} />
                    <Text variant="titleMedium" style={styles.applicantsHeader}>
                      Applications Received ({appsLoading ? 'Loading...' : jobApps.length})
                    </Text>

                    {appsLoading ? (
                      <ActivityIndicator size="small" color={PRIMARY_COLOR} style={{ marginVertical: 12 }} />
                    ) : jobApps.length === 0 ? (
                      <Text style={styles.noApplicantsText}>No applications received for this job yet.</Text>
                    ) : (
                      jobApps.map((app) => (
                        <View key={app.id} style={styles.applicantRow}>
                          <Avatar.Image
                            size={40}
                            source={{ uri: app.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }}
                            style={{ backgroundColor: '#ECEFF1' }}
                          />
                          <View style={styles.applicantInfo}>
                            <Text variant="titleMedium" style={{ fontWeight: '500' }}>{app.name}</Text>
                            <Text variant="bodySmall" style={{ color: '#757575' }}>
                              Applied: {new Date(app.booking_date).toLocaleDateString('en-IN')}
                            </Text>
                          </View>
                          <View style={styles.applicantContactActions}>
                            <IconButton
                              icon="phone"
                              iconColor="#4CAF50"
                              mode="contained-tonal"
                              size={18}
                              onPress={() => handleCall(app.name, app.phone)}
                            />
                            <IconButton
                              icon="whatsapp"
                              iconColor="#25D366"
                              mode="contained-tonal"
                              size={18}
                              onPress={() => handleWhatsApp(app.name, app.phone)}
                            />
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </Surface>
            );
          })
        )}
      </ScrollView>
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    margin: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  statValue: {
    fontWeight: 'bold',
  },
  quickActionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
  },
  actionCardWrapper: {
    width: '100%',
  },
  actionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  listingsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listingsHeader: {
    fontWeight: 'bold',
  },
  loaderContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  jobCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  jobHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    paddingRight: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    color: '#757575',
    marginLeft: 4,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    color: '#757575',
    fontWeight: '500',
  },
  detailValue: {
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  jobDescription: {
    marginTop: 12,
    color: '#555',
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    margin: 0,
    marginRight: 8,
  },
  applicantsContainer: {
    marginTop: 12,
  },
  applicantsHeader: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  noApplicantsText: {
    color: '#9E9E9E',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  applicantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  applicantContactActions: {
    flexDirection: 'row',
  },
});
