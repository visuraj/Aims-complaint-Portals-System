import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  TextInput,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../../contexts/MongoDBAuthContext';
import { mongoService, Complaint } from '../../services/MongoDBService';

const ComplaintDetailsScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { userProfile } = useAuth();
  const { complaint: initialComplaint } = route.params;
  const [complaint, setComplaint] = useState<Complaint>(initialComplaint);
  const [replyMessage, setReplyMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh complaint data when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshComplaint();
    });

    return unsubscribe;
  }, [navigation]);

  const getStatusColor = (status: string) => {
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
  };

  const refreshComplaint = async () => {
    setRefreshing(true);
    try {
      const updatedComplaints = await mongoService.getComplaintsByStudent(userProfile!.id);
      const updatedComplaint = updatedComplaints.find(c => c.id === complaint.id);
      if (updatedComplaint) {
        setComplaint(updatedComplaint);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to refresh complaint');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddReply = async () => {
    if (!replyMessage.trim()) {
      Alert.alert('Error', 'Please enter a reply message');
      return;
    }

    setLoading(true);
    try {
      await mongoService.addReply(complaint.id, {
        userId: userProfile!.id,
        userName: userProfile!.fullName,
        userRole: userProfile!.role,
        message: replyMessage,
      });

      // Refresh complaint data
      await refreshComplaint();
      setReplyMessage('');
      Alert.alert('Success', 'Reply added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshComplaint} />
      }
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title style={styles.title}>{complaint.topic}</Title>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(complaint.status) }]}
              textStyle={styles.statusText}
            >
              <Text>{complaint.status.replace('_', ' ').toUpperCase()}</Text>
            </Chip>
          </View>

          <Paragraph style={styles.description}>{complaint.description}</Paragraph>

          <View style={styles.detailsSection}>
            {/* Removed student name and email - only show to admins */}
            {/*
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Student:</Text>
              <Text style={styles.detailValue}>{complaint.studentName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{complaint.studentEmail}</Text>
            </View>
            */}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Course:</Text>
              <Text style={styles.detailValue}>{complaint.course}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submitted:</Text>
              <Text style={styles.detailValue}>
                {new Date(complaint.createdAt).toLocaleString()}
              </Text>
            </View>

            {complaint.assignedProfessorName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned to:</Text>
                <Text style={styles.detailValue}>{complaint.assignedProfessorName}</Text>
              </View>
            )}
            
            {complaint.solvedByProfessorName && (
              <View style={[styles.detailRow, { backgroundColor: '#e8f5e9', padding: 8, borderRadius: 4 }]}>
                <Text style={[styles.detailLabel, { color: '#388e3c' }]}>Solved by:</Text>
                <Text style={[styles.detailValue, { color: '#388e3c' }]}>
                  {complaint.solvedByProfessorName}
                </Text>
              </View>
            )}
          </View>

          {complaint.attachments && complaint.attachments.length > 0 && (
            <View style={styles.attachmentsSection}>
              <Text style={styles.sectionTitle}>Attachments</Text>
              {complaint.attachments.map((attachment, index) => (
                <Card key={index} style={styles.attachmentCard}>
                  <Card.Content>
                    <Text style={styles.attachmentText} numberOfLines={1}>
                      Attachment {index + 1}
                    </Text>
                    <Button
                      mode="text"
                      onPress={() => {}}
                      icon="download"
                      compact
                    >
                      <Text>Download</Text>
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={styles.repliesSection}>
            <Text style={styles.sectionTitle}>Replies</Text>
            {complaint.replies && complaint.replies.length > 0 ? (
              complaint.replies.map((reply, index) => {
                // Add safety checks for reply properties
                const userName = reply.userName && typeof reply.userName === 'string' ? reply.userName : 'Unknown User';
                const userRole = reply.userRole && typeof reply.userRole === 'string' ? reply.userRole : 'student';
                const message = reply.message && typeof reply.message === 'string' ? reply.message : 'No message';
                const createdAt = reply.createdAt ? new Date(reply.createdAt) : new Date();
                
                return (
                  <Card key={index} style={styles.replyCard}>
                    <Card.Content>
                      <View style={styles.replyHeader}>
                        <Text style={styles.replyUser}>{userName}</Text>
                        <Text style={styles.replyRole}>{userRole}</Text>
                      </View>
                      <Paragraph style={styles.replyMessage}>{message}</Paragraph>
                      <Text style={styles.replyDate}>
                        {createdAt.toLocaleString()}
                      </Text>
                    </Card.Content>
                  </Card>
                );
              })
            ) : (
              <Text style={styles.noRepliesText}>No replies yet</Text>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.replyInputSection}>
            <Text style={styles.sectionTitle}>Add Reply</Text>
            <TextInput
              label="Your message"
              value={replyMessage}
              onChangeText={setReplyMessage}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.replyInput}
            />
            <Button
              mode="contained"
              onPress={handleAddReply}
              loading={loading}
              disabled={loading}
              style={styles.replyButton}
            >
              Send Reply
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 20,
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
  description: {
    marginBottom: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  detailValue: {
    flex: 1,
  },
  attachmentsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  attachmentCard: {
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  attachmentText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  divider: {
    marginVertical: 16,
  },
  repliesSection: {
    marginBottom: 16,
  },
  replyCard: {
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  replyUser: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  replyRole: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  replyMessage: {
    marginBottom: 8,
    lineHeight: 20,
  },
  replyDate: {
    fontSize: 12,
    color: '#888',
  },
  noRepliesText: {
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
    paddingVertical: 16,
  },
  replyInputSection: {
    marginBottom: 16,
  },
  replyInput: {
    marginBottom: 12,
  },
  replyButton: {
    alignSelf: 'flex-end',
  },
});

export default ComplaintDetailsScreen;