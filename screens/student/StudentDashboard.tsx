import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  ActivityIndicator,
  ProgressBar,
  Modal,
} from 'react-native-paper';
import { useAuth } from '../../contexts/MongoDBAuthContext';
import { mongoService, Complaint } from '../../services/MongoDBService';

const StudentDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyComplaintCount, setWeeklyComplaintCount] = useState(0);
  const [scheduledMeeting, setScheduledMeeting] = useState<Complaint | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const MAX_WEEKLY_COMPLAINTS = 10;

  const loadComplaints = useCallback(async () => {
    if (!userProfile) return;

    try {
      // Show loading indicator only for initial load
      const showLoading = complaints.length === 0;
      if (showLoading) {
        setLoading(true);
      }

      // Use Promise.all to fetch complaints and count in parallel
      const [studentComplaints, count] = await Promise.all([
        mongoService.getComplaintsByStudent(userProfile.id),
        mongoService.getWeeklyComplaintCount(userProfile.id)
      ]);
      
      setComplaints(studentComplaints);
      setWeeklyComplaintCount(count);
      
      // Check for scheduled meetings only when data changes significantly
      if (studentComplaints.length > 0 && complaints.length !== studentComplaints.length) {
        const meetingRequest = studentComplaints.find(complaint => 
          complaint.topic?.startsWith('[MEETING REQUEST]') && 
          complaint.replies?.some(reply => reply.message?.includes('MEETING SCHEDULED'))
        );
        
        if (meetingRequest) {
          setScheduledMeeting(meetingRequest);
          setShowMeetingModal(true);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userProfile, complaints.length]);

  useEffect(() => {
    loadComplaints();
    
    // Set up interval to periodically refresh complaints
    // Increased from 30 seconds to 300 seconds (5 minutes) to reduce API calls and improve performance
    // Further increased to 600 seconds (10 minutes) for even better performance
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        loadComplaints();
      }
    }, 600000); // Refresh every 10 minutes instead of 5 minutes for better performance
    
    return () => clearInterval(interval);
  }, [loadComplaints, loading, refreshing]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadComplaints();
  }, [loadComplaints]);

  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return '#2196f3';
      case 'pending':
        return '#ff9800';
      case 'in progress':
        return '#9c27b0';
      case 'solved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#666';
    }
  }, []);

  const renderComplaint = useCallback(({ item }: { item: Complaint }) => {
    // Add safety checks for all item properties
    const topic = item.topic && typeof item.topic === 'string' ? item.topic : 'Untitled Complaint';
    const description = item.description && typeof item.description === 'string' ? item.description : 'No description';
    const course = item.course && typeof item.course === 'string' ? item.course : 'Unknown Course';
    const status = item.status && typeof item.status === 'string' ? item.status : 'submitted';
    const assignedProfessorName = item.assignedProfessorName && typeof item.assignedProfessorName === 'string' ? item.assignedProfessorName : '';
    const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
    
    return (
      <Card style={styles.complaintCard} onPress={() => navigation.navigate('ComplaintDetails', { complaint: item })}>
        <Card.Content>
          <View style={styles.complaintHeader}>
            <Title style={styles.complaintTitle}>{topic}</Title>
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(status) }]}
              textStyle={styles.statusText}
            >
              {status.replace('_', ' ').toUpperCase()}
            </Chip>
          </View>
          <Paragraph style={styles.complaintDescription} numberOfLines={2}>
            {description}
          </Paragraph>
          <View style={styles.complaintMeta}>
            <Text style={styles.metaText}>Course: {course}</Text>
            <Text style={styles.metaText}>
              {createdAt.toLocaleDateString()}
            </Text>
          </View>
          {assignedProfessorName && (
            <Text style={styles.assignedText}>
              Assigned to: {assignedProfessorName}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  }, [navigation, getStatusColor]);

  // Memoize the welcome message to prevent unnecessary re-renders
  const welcomeMessage = useMemo(() => {
    return userProfile?.fullName ? `Welcome, ${userProfile.fullName}` : 'Welcome';
  }, [userProfile?.fullName]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading complaints...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.welcomeText}>
          {welcomeMessage}
        </Title>
        <Text style={styles.subtitleText}>
          Manage your complaints and track their status
        </Text>
      </View>

      {/* Weekly Complaint Limit Section */}
      <View style={styles.limitContainer}>
        <View style={styles.limitHeader}>
          <Text style={styles.limitTitle}>Weekly Complaint Limit</Text>
          <Text style={styles.limitCount}>{weeklyComplaintCount}/{MAX_WEEKLY_COMPLAINTS}</Text>
        </View>
        <ProgressBar 
          progress={weeklyComplaintCount / MAX_WEEKLY_COMPLAINTS} 
          color={weeklyComplaintCount >= MAX_WEEKLY_COMPLAINTS ? '#f44336' : '#2196f3'} 
          style={styles.progressBar}
        />
        <Text style={styles.limitInfo}>
          {weeklyComplaintCount >= MAX_WEEKLY_COMPLAINTS 
            ? "You've reached your weekly complaint limit. Please schedule a meeting with an admin for additional complaints."
            : `You can submit ${MAX_WEEKLY_COMPLAINTS - weeklyComplaintCount} more complaints this week.`}
        </Text>
      </View>

      <FlatList
        data={complaints}
        renderItem={renderComplaint}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No complaints yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to submit your first complaint
            </Text>
          </View>
        }
        // Performance optimizations
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
        // Add extra performance optimizations
        scrollEventThrottle={16} // Limit scroll events to 60fps
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          if (weeklyComplaintCount >= MAX_WEEKLY_COMPLAINTS) {
            Alert.alert(
              'Weekly Limit Reached',
              'You have reached your weekly complaint limit of 10 complaints. Please schedule a meeting with an admin for additional complaints.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Schedule Meeting', onPress: () => navigation.navigate('ScheduleMeeting') }
              ]
            );
          } else {
            navigation.navigate('AddComplaint');
          }
        }}
        label="New Complaint"
        disabled={weeklyComplaintCount >= MAX_WEEKLY_COMPLAINTS}
      />
      
      {/* Meeting Scheduled Modal */}
      <Modal
        visible={showMeetingModal}
        onDismiss={() => setShowMeetingModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        {scheduledMeeting && (
          <Card style={styles.modalCard}>
            <Card.Content>
              <Title style={styles.modalTitle}>Meeting Scheduled!</Title>
              <Paragraph style={styles.modalText}>
                An admin has scheduled a meeting with you regarding your request.
              </Paragraph>
              
              {/* Extract meeting details from the latest reply */}
              {scheduledMeeting.replies && scheduledMeeting.replies.length > 0 && (
                <>
                  {(() => {
                    const latestReply = scheduledMeeting.replies[scheduledMeeting.replies.length - 1];
                    const lines = latestReply.message?.split('\n') || [];
                    const meetingDetails = lines.filter(line => line.includes(':')).reduce((acc, line) => {
                      const [key, value] = line.split(':').map(str => str.trim());
                      if (key && value) {
                        acc[key] = value;
                      }
                      return acc;
                    }, {} as Record<string, string>);
                    
                    // Ensure all values are valid strings before rendering
                    const date = meetingDetails.Date && typeof meetingDetails.Date === 'string' ? meetingDetails.Date : '';
                    const time = meetingDetails.Time && typeof meetingDetails.Time === 'string' ? meetingDetails.Time : '';
                    const location = meetingDetails.Location && typeof meetingDetails.Location === 'string' ? meetingDetails.Location : '';
                    const scheduledBy = meetingDetails.Scheduled && typeof meetingDetails.Scheduled === 'string' ? meetingDetails.Scheduled : '';
                    
                    return (
                      <>
                        {date && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Date:</Text>
                            <Text style={styles.detailValue}>{date}</Text>
                          </View>
                        )}
                        {time && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Time:</Text>
                            <Text style={styles.detailValue}>{time}</Text>
                          </View>
                        )}
                        {location && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Location:</Text>
                            <Text style={styles.detailValue}>{location}</Text>
                          </View>
                        )}
                        {scheduledBy && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Scheduled by:</Text>
                            <Text style={styles.detailValue}>{scheduledBy}</Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
              
              <Button
                mode="contained"
                onPress={() => {
                  setShowMeetingModal(false);
                  navigation.navigate('ComplaintDetails', { complaint: scheduledMeeting });
                }}
                style={styles.modalButton}
              >
                View Details
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowMeetingModal(false)}
                style={styles.modalButton}
              >
                Close
              </Button>
            </Card.Content>
          </Card>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitleText: {
    color: 'white',
    fontSize: 16,
    marginTop: 5,
  },
  limitContainer: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    elevation: 2,
  },
  limitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  limitCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  limitInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  complaintCard: {
    marginBottom: 16,
    elevation: 2,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  complaintTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusChip: {
    marginLeft: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  complaintDescription: {
    marginBottom: 12,
    color: '#666',
  },
  complaintMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#888',
  },
  assignedText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976d2',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalCard: {
    elevation: 4,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#ff9800',
  },
  modalText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  detailValue: {
    color: '#666',
  },
  modalButton: {
    marginVertical: 8,
  },
});

export default StudentDashboard;