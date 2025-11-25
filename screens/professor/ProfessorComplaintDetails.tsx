import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Chip,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../../contexts/MongoDBAuthContext';
import { mongoService, Complaint, ComplaintReply } from '../../services/MongoDBService';

const ProfessorComplaintDetails: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { complaint: initialComplaint } = route.params;
  const { userProfile } = useAuth();
  const [complaint, setComplaint] = useState<Complaint>(initialComplaint);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return '#2196f3';
      case 'pending':
        return '#ff9800';
      case 'in_progress':
        return '#9c27b0';
      case 'solved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const updateStatus = async (newStatus: Complaint['status']) => {
    if (!userProfile) return;

    setLoading(true);
    try {
      const updatedComplaint = await mongoService.updateComplaintStatus(complaint.id, newStatus);
      setComplaint(updatedComplaint);
      Alert.alert('Success', 'Status updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const addReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    if (!userProfile) return;

    setLoading(true);
    try {
      const updatedComplaint = await mongoService.addReply(complaint.id, {
        userId: userProfile.id,
        userName: userProfile.fullName,
        userRole: 'professor',
        message: replyText.trim(),
      });

      setComplaint(updatedComplaint);
      setReplyText('');
      Alert.alert('Success', 'Reply added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const renderReply = (reply: ComplaintReply, index: number) => {
    // Hide student names from professors, show "***" instead
    const displayName = reply.userRole === 'student' ? '***' : (reply.userName || 'Unknown User');
    
    // Add safety checks for reply properties
    const userRole = reply.userRole && typeof reply.userRole === 'string' ? reply.userRole : 'student';
    const message = reply.message && typeof reply.message === 'string' ? reply.message : 'No message';
    const createdAt = reply.createdAt ? new Date(reply.createdAt) : new Date();
    
    return (
      <Card key={index} style={styles.replyCard}>
        <Card.Content>
          <View style={styles.replyHeader}>
            <Text style={styles.replyAuthor}>{displayName}</Text>
            <Chip 
              style={[styles.roleChip, { backgroundColor: getStatusColor(userRole) }]}
              textStyle={styles.roleText}
            >
              <Text>{userRole.toUpperCase()}</Text>
            </Chip>
          </View>
          <Paragraph style={styles.replyMessage}>{message}</Paragraph>
          <Text style={styles.replyDate}>
            {createdAt.toLocaleString()}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.mainCard}>
          <Card.Content>
            <View style={styles.header}>
              <Title style={styles.complaintTitle}>{complaint.topic}</Title>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(complaint.status) }]}
                textStyle={styles.statusText}
              >
                <Text>{complaint.status.replace('_', ' ').toUpperCase()}</Text>
              </Chip>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Student:</Text>
              <Text style={styles.metaValue}>{complaint.studentName}</Text>
            </View>
            
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Course:</Text>
              <Text style={styles.metaValue}>{complaint.course}</Text>
            </View>
            
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Department:</Text>
              <Text style={styles.metaValue}>{complaint.department}</Text>
            </View>
            
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Submitted:</Text>
              <Text style={styles.metaValue}>
                {new Date(complaint.createdAt).toLocaleString()}
              </Text>
            </View>
            
            {complaint.assignedProfessorName && (
              <View style={styles.metaInfo}>
                <Text style={styles.metaLabel}>Assigned to:</Text>
                <Text style={styles.metaValue}>{complaint.assignedProfessorName}</Text>
              </View>
            )}
            
            {userProfile && complaint.assignedProfessorName !== userProfile.fullName && (
              <View style={[styles.metaInfo, { backgroundColor: '#fff3e0', padding: 8, borderRadius: 4 }]}>
                <Text style={[styles.metaLabel, { color: '#f57c00' }]}>Note:</Text>
                <Text style={[styles.metaValue, { color: '#f57c00' }]}>
                  This complaint is not specifically assigned to you, but is visible to all professors in the {complaint.department} department.
                </Text>
              </View>
            )}
            
            {complaint.solvedByProfessorName && (
              <View style={[styles.metaInfo, { backgroundColor: '#e8f5e9', padding: 8, borderRadius: 4 }]}>
                <Text style={[styles.metaLabel, { color: '#388e3c' }]}>Solved by:</Text>
                <Text style={[styles.metaValue, { color: '#388e3c' }]}>
                  {complaint.solvedByProfessorName}
                </Text>
              </View>
            )}
            
            <Divider style={styles.divider} />
            
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Paragraph style={styles.description}>{complaint.description}</Paragraph>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.actionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Professor Actions</Text>
            
            <View style={styles.statusButtonsContainer}>
              <View style={styles.statusButtonRow}>
                <Button
                  mode="contained"
                  onPress={() => updateStatus('in_progress')}
                  loading={loading}
                  disabled={loading || complaint.status.toLowerCase() === 'in progress'}
                  style={[styles.statusButton, styles.inProgressButton]}
                  labelStyle={styles.statusButtonLabel}
                >
                  Mark In Progress
                </Button>
                
                <Button
                  mode="contained"
                  onPress={() => updateStatus('solved')}
                  loading={loading}
                  disabled={loading || complaint.status.toLowerCase() === 'solved'}
                  style={[styles.statusButton, styles.solvedButton]}
                  labelStyle={styles.statusButtonLabel}
                >
                  Mark Solved
                </Button>
              </View>
              
              <View style={styles.statusButtonRow}>
                <Button
                  mode="contained"
                  onPress={() => updateStatus('rejected')}
                  loading={loading}
                  disabled={loading || complaint.status.toLowerCase() === 'rejected'}
                  style={[styles.statusButton, styles.rejectedButton]}
                  labelStyle={styles.statusButtonLabel}
                >
                  Reject Complaint
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.replyCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Add Reply</Text>
            
            <TextInput
              label="Your Reply"
              value={replyText}
              onChangeText={setReplyText}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.replyInput}
              placeholder="Enter your reply to the student..."
            />
            
            <Button
              mode="contained"
              onPress={addReply}
              loading={loading}
              disabled={loading}
              style={styles.replyButton}
            >
              Send Reply
            </Button>
          </Card.Content>
        </Card>

        {complaint.replies && complaint.replies.length > 0 && (
          <View style={styles.repliesSection}>
            <Text style={styles.sectionTitle}>Previous Replies</Text>
            {complaint.replies.map((reply, index) => renderReply(reply, index))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
  },
  mainCard: {
    marginBottom: 16,
    elevation: 4,
  },
  actionCard: {
    marginBottom: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  complaintTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusChip: {
    marginLeft: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 15,
  },
  metaInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metaLabel: {
    fontWeight: 'bold',
    width: 100,
    color: '#666',
  },
  metaValue: {
    flex: 1,
    color: '#333',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  statusButtonsContainer: {
    width: '100%',
  },
  statusButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  inProgressButton: {
    backgroundColor: '#9c27b0',
  },
  solvedButton: {
    backgroundColor: '#4caf50',
  },
  rejectedButton: {
    backgroundColor: '#f44336',
  },
  statusButtonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  replyInput: {
    marginBottom: 15,
  },
  replyButton: {
    marginTop: 10,
  },
  repliesSection: {
    marginTop: 16,
  },
  replyCard: {
    marginBottom: 12,
    elevation: 2,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyAuthor: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  roleChip: {
    marginLeft: 10,
  },
  roleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  replyMessage: {
    fontSize: 14,
    lineHeight: 18,
    color: '#555',
    marginBottom: 8,
  },
  replyDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
});

export default ProfessorComplaintDetails;