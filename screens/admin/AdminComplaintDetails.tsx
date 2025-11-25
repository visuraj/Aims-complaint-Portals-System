import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Menu,
  IconButton,
  HelperText,
} from 'react-native-paper';
import { useAuth } from '../../contexts/MongoDBAuthContext';
import { mongoService, Complaint, ComplaintReply } from '../../services/MongoDBService';

const AdminComplaintDetails: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { complaint: initialComplaint } = route.params;
  
  const { userProfile } = useAuth();
  
  // Ensure complaint has department field
  const complaintWithDepartment = initialComplaint ? {
    ...initialComplaint,
    department: initialComplaint.department || initialComplaint.course || 'Unknown Department',
    id: initialComplaint.id || initialComplaint._id
  } : null;
  
  const [complaint, setComplaint] = useState<Complaint | null>(complaintWithDepartment);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [professors, setProfessors] = useState<any[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]); // For department selection
  const [selectedDepartment, setSelectedDepartment] = useState<string>(''); // Selected department for filtering
  const [searchQuery, setSearchQuery] = useState(''); // Search query for professors

  // Load professors for assignment
  useEffect(() => {
    const loadProfessors = async () => {
      try {
        const allUsers = await mongoService.getAllUsers();
        
        const approvedProfessors = allUsers
          .filter(user => user && user.role === 'professor' && user.status === 'approved')
          .map(prof => ({
            ...prof,
            id: prof.id,
            fullName: prof.fullName || 'Unknown Professor',
            department: prof.department || 'Unknown Department'
          }));
        
        // Filter out any invalid professor objects
        const validProfessors = approvedProfessors.filter(prof => prof.id && prof.fullName);
        
        setProfessors(validProfessors);
        
        // Extract unique departments
        const uniqueDepartments = Array.from(
          new Set(validProfessors.map(p => p.department || 'Unknown Department'))
        ).filter(dept => dept && typeof dept === 'string');
        
        setDepartments(uniqueDepartments);
        
        // Set default selected department to complaint's department
        if (complaintWithDepartment) {
          const defaultDepartment = 
            complaintWithDepartment.department || 
            complaintWithDepartment.course || 
            'Unknown Department';
          setSelectedDepartment(defaultDepartment);
        }
      } catch (error: any) {
        console.error('Failed to load professors:', error.message || error);
        Alert.alert('Error', 'Failed to load professors: ' + (error.message || 'Unknown error'));
      }
    };
    
    loadProfessors();
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
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
  }, []);

  const updateStatus = useCallback(async (newStatus: Complaint['status']) => {
    if (!userProfile || !complaint) return;

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
  }, [userProfile, complaint]);

  const assignToProfessor = useCallback(async (professorId: string) => {
    if (!userProfile || !complaint) {
      Alert.alert('Error', 'User profile or complaint data not available');
      return;
    }

    if (!complaint.id) {
      Alert.alert('Error', 'Complaint ID is missing');
      return;
    }

    if (!professorId) {
      Alert.alert('Error', 'Professor ID is missing');
      return;
    }

    // Validate professorId format
    if (typeof professorId !== 'string' || professorId.length === 0) {
      Alert.alert('Error', 'Invalid professor ID format');
      return;
    }

    // Validate complaintId format
    if (typeof complaint.id !== 'string' || complaint.id.length === 0) {
      Alert.alert('Error', 'Invalid complaint ID format');
      return;
    }

    setAssigning(true);
    try {
      const updatedComplaint = await mongoService.assignComplaintToProfessor(complaint.id, professorId);
      
      // Ensure the updated complaint has the department field
      const complaintWithDepartment = {
        ...updatedComplaint,
        department: updatedComplaint.department || complaint.department || updatedComplaint.course || 'Unknown Department',
        id: updatedComplaint.id || complaint.id
      };
      
      setComplaint(complaintWithDepartment);
      setMenuVisible(false);
      Alert.alert('Success', 'Complaint assigned to professor successfully');
    } catch (error: any) {
      console.error('Error assigning complaint:', error);
      Alert.alert('Error', error.message || 'Failed to assign complaint to professor: ' + (error.toString() || 'Unknown error'));
    } finally {
      setAssigning(false);
    }
  }, [userProfile, complaint]);

  // Group professors by department and filter by course match
  const groupProfessorsByDepartment = useCallback(() => {
    if (!complaint) return {};
    
    // Start with all professors
    let filteredProfessors = professors.filter(prof => prof !== null && prof !== undefined && prof.id !== undefined);
    
    // If a department is selected, filter by it
    if (selectedDepartment && selectedDepartment !== '') {
      filteredProfessors = filteredProfessors.filter(prof => 
        (prof.department || 'Unknown Department') === selectedDepartment
      );
    }
    
    const grouped: {[key: string]: any[]} = {};
    
    // Group professors by department
    filteredProfessors.forEach(professor => {
      // Ensure professor object is valid
      if (!professor || !professor.id || !professor.fullName) {
        return;
      }
      
      const department = professor.department || 'Unknown Department';
      if (!grouped[department]) {
        grouped[department] = [];
      }
      grouped[department].push(professor);
    });
    
    return grouped;
  }, [complaint, professors, selectedDepartment]);

  const addReply = useCallback(async () => {
    if (!replyText.trim() || !userProfile || !complaint) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    setLoading(true);
    try {
      const updatedComplaint = await mongoService.addReply(complaint.id, {
        userId: userProfile.id,
        userName: userProfile.fullName || 'Unknown User',
        userRole: 'admin',
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
  }, [replyText, userProfile, complaint]);

  const renderReply = useCallback((reply: ComplaintReply, index: number) => (
    <Card key={index} style={styles.replyCard}>
      <Card.Content>
        <View style={styles.replyHeader}>
          <Text style={styles.replyAuthor}>{reply.userName || 'Unknown User'}</Text>
          <Chip 
            style={[styles.roleChip, { backgroundColor: getStatusColor(reply.userRole || 'student') }]}
            textStyle={styles.roleText}
          >
            <Text>{(reply.userRole || 'student').toUpperCase()}</Text>
          </Chip>
        </View>
        <Paragraph style={styles.replyMessage}>{reply.message || 'No message'}</Paragraph>
        <Text style={styles.replyDate}>
          {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : 'Unknown Date'}
        </Text>
      </Card.Content>
    </Card>
  ), [getStatusColor]);

  // Handle case where complaint data is not available
  if (!complaint) {
    return (
      <View style={styles.container}>
        <Text>Error: Complaint data not available</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.mainCard}>
          <Card.Content>
            <View style={styles.header}>
              <Title style={styles.complaintTitle}>{complaint.topic || 'Untitled Complaint'}</Title>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(complaint.status || 'submitted') }]}
                textStyle={styles.statusText}
              >
                <Text>{(complaint.status || 'submitted').replace('_', ' ').toUpperCase()}</Text>
              </Chip>
            </View>
            
            {/* Meeting Request Banner */}
            {complaint.topic && complaint.topic.startsWith('[MEETING REQUEST]') && (
              <View style={[styles.metaInfo, { backgroundColor: '#fff3e0', padding: 12, borderRadius: 4, marginBottom: 10 }]}>
                <Text style={[styles.metaLabel, { color: '#f57c00', fontWeight: 'bold' }]}>
                  📅 MEETING REQUEST
                </Text>
                <Text style={[styles.metaValue, { color: '#f57c00' }]}>
                  This is a meeting request from a student who has reached their weekly complaint limit.
                </Text>
              </View>
            )}
            
            <Divider style={styles.divider} />
            
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Student:</Text>
              <Text style={styles.metaValue}>{complaint.studentName || 'Unknown Student'}</Text>
            </View>
            
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Email:</Text>
              <Text style={styles.metaValue}>{complaint.studentEmail || 'Unknown Email'}</Text>
            </View>
            
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Course:</Text>
              <Text style={styles.metaValue}>{complaint.course || 'Unknown Course'}</Text>
            </View>
            
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>Submitted:</Text>
              <Text style={styles.metaValue}>
                {complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : 'Unknown Date'}
              </Text>
            </View>
            
            {complaint.assignedProfessorName && (
              <View style={styles.metaInfo}>
                <Text style={styles.metaLabel}>Assigned to:</Text>
                <Text style={styles.metaValue}>{complaint.assignedProfessorName}</Text>
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
            
            <View style={[styles.metaInfo, { backgroundColor: '#e3f2fd', padding: 8, borderRadius: 4 }]}>
              <Text style={[styles.metaLabel, { color: '#1976d2' }]}>Visibility:</Text>
              <Text style={[styles.metaValue, { color: '#1976d2' }]}>
                This complaint is visible to all professors in the {complaint.course || 'Unknown Course'} department.
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Paragraph style={styles.description}>{complaint.description || 'No description provided'}</Paragraph>
            </View>
          </Card.Content>
        </Card>

        {/* Schedule Meeting Button for Meeting Requests */}
        {complaint.topic && complaint.topic.startsWith('[MEETING REQUEST]') && (
          <Card style={styles.actionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Schedule Meeting</Text>
              <Button
                mode="contained"
                onPress={async () => {
                  // Directly send meeting request without scheduling details
                  try {
                    const replyMessage = `MEETING REQUEST ACKNOWLEDGED\n\n` +
                      `Your meeting request has been received and assigned to ${userProfile?.fullName || 'an admin'}.\n` +
                      `They will contact you to schedule the meeting details.`;
                    
                    await mongoService.addReply(complaint.id, {
                      userId: userProfile?.id || '',
                      userName: userProfile?.fullName || 'Admin',
                      userRole: 'admin',
                      message: replyMessage,
                    });
                    
                    Alert.alert(
                      'Success',
                      'Meeting request acknowledged! The student has been notified.',
                      [{ text: 'OK', onPress: () => navigation.goBack() }]
                    );
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to acknowledge meeting request');
                  }
                }}
                style={styles.scheduleButton}
                icon="check-circle"
              >
                Acknowledge Meeting Request
              </Button>
              <HelperText type="info">
                Acknowledge this meeting request and assign it to yourself.
              </HelperText>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.actionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Admin Actions</Text>
            
            {/* Department Selection */}
            <View style={styles.departmentSelection}>
              <Text style={styles.label}>Filter by Department:</Text>
              <View style={styles.departmentChips}>
                <Chip 
                  mode={selectedDepartment === '' ? 'flat' : 'outlined'}
                  onPress={() => setSelectedDepartment('')}
                  style={styles.departmentChip}
                >
                  <Text>All Departments</Text>
                </Chip>
                {departments.map((dept) => {
                  // Ensure dept is a valid string
                  const departmentName = dept && typeof dept === 'string' ? dept : 'Unknown Department';
                  
                  return (
                    <Chip 
                      key={departmentName}
                      mode={selectedDepartment === departmentName ? 'flat' : 'outlined'}
                      onPress={() => setSelectedDepartment(departmentName)}
                      style={styles.departmentChip}
                    >
                      <Text>{departmentName}</Text>
                    </Chip>
                  );
                })}
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <View style={styles.assignmentSection}>
                <Text style={styles.assignmentTitle}>Assign Complaint to Professor</Text>
                
                {/* Search Professors Input */}
                <TextInput
                  label="Search Professors"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  mode="outlined"
                  style={styles.searchInput}
                  placeholder="Type professor name to search..."
                />
                
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                    <Button
                      mode="contained"
                      onPress={() => setMenuVisible(true)}
                      disabled={assigning || professors.length === 0}
                      loading={assigning}
                      style={styles.assignButton}
                    >
                      Assign to Professor
                    </Button>
                  }
                >
                  {professors.length > 0 ? (
                    Object.entries(groupProfessorsByDepartment()).map(([department, deptProfessors]) => {
                      // Ensure department is a valid string
                      const departmentName = department && typeof department === 'string' ? department : 'Unknown Department';
                      
                      // Filter professors based on search query (case-insensitive)
                      const filteredProfessors = deptProfessors.filter(prof => 
                        prof.fullName && prof.fullName.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                      
                      // If search query is empty, show all professors in this group
                      // If search query is not empty, only show groups with matching professors
                      if (searchQuery.trim() !== '' && filteredProfessors.length === 0) return null;
                      
                      return (
                        <View key={departmentName}>
                          <Menu.Item 
                            title={departmentName} 
                            disabled 
                            style={styles.departmentHeader}
                          />
                          {(searchQuery.trim() === '' ? deptProfessors : filteredProfessors).map((professor) => {
                            // Ensure professor object is valid
                            if (!professor || !professor.id || !professor.fullName) {
                              return null;
                            }
                            
                            // Ensure fullName is a valid string
                            const professorName = professor.fullName && typeof professor.fullName === 'string' ? 
                              professor.fullName : 'Unknown Professor';
                            
                            return (
                              <Menu.Item
                                key={professor.id}
                                onPress={() => {
                                  setMenuVisible(false);
                                  assignToProfessor(professor.id);
                                }}
                                title={professorName}
                                disabled={assigning}
                              />
                            );
                          })}
                        </View>
                      );
                    })
                  ) : (
                    <Menu.Item title="No professors available" disabled />
                  )}
                </Menu>
              </View>
              
              <Text style={styles.statusSectionTitle}>Update Complaint Status</Text>
              <View style={styles.statusButtonsContainer}>
                <View style={styles.statusButtonRow}>
                  <Button
                    mode="contained"
                    onPress={() => updateStatus('pending')}
                    loading={loading}
                    disabled={loading || !complaint || complaint.status === 'pending'}
                    style={[styles.statusButton, styles.pendingButton]}
                    labelStyle={styles.statusButtonLabel}
                  >
                    Pending
                  </Button>
                  
                  <Button
                    mode="contained"
                    onPress={() => updateStatus('in_progress')}
                    loading={loading}
                    disabled={loading || !complaint || complaint.status === 'in_progress'}
                    style={[styles.statusButton, styles.inProgressButton]}
                    labelStyle={styles.statusButtonLabel}
                  >
                    In Progress
                  </Button>
                </View>
                
                <View style={styles.statusButtonRow}>
                  <Button
                    mode="contained"
                    onPress={() => updateStatus('solved')}
                    loading={loading}
                    disabled={loading || !complaint || complaint.status === 'solved'}
                    style={[styles.statusButton, styles.solvedButton]}
                    labelStyle={styles.statusButtonLabel}
                  >
                    Solved
                  </Button>
                  
                  <Button
                    mode="contained"
                    onPress={() => updateStatus('rejected')}
                    loading={loading}
                    disabled={loading || !complaint || complaint.status === 'rejected'}
                    style={[styles.statusButton, styles.rejectedButton]}
                    labelStyle={styles.statusButtonLabel}
                  >
                    Rejected
                  </Button>
                </View>
              </View>

            </View>
          </Card.Content>
        </Card>

        <Card style={styles.replyCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Add Admin Reply</Text>
            
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
              disabled={loading || !complaint}
              style={styles.replyButton}
            >
              Send Reply
            </Button>
          </Card.Content>
        </Card>

        {complaint.replies && complaint.replies.length > 0 && (
          <View style={styles.repliesSection}>
            <Text style={styles.sectionTitle}>All Replies</Text>
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
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  statusSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  departmentSelection: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  departmentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  departmentChip: {
    margin: 4,
  },
  departmentHeader: {
    backgroundColor: '#e3f2fd',
  },
  actionButtons: {
    marginBottom: 16,
  },
  assignmentSection: {
    marginBottom: 20,
  },
  searchInput: {
    marginBottom: 15,
  },
  assignButton: {
    marginBottom: 16,
    backgroundColor: '#d32f2f',
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
  pendingButton: {
    backgroundColor: '#ff9800',
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
  scheduleButton: {
    marginVertical: 10,
    backgroundColor: '#ff9800',
  },
  replyInput: {
    marginBottom: 15,
  },
  replyButton: {
    marginTop: 10,
    backgroundColor: '#d32f2f',
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

export default AdminComplaintDetails;