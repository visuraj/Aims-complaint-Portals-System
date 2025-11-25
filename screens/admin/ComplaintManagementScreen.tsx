import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Chip,
  ActivityIndicator,
  Searchbar,
  Button,
  Divider,
} from 'react-native-paper';
import { mongoService, Complaint } from '../../services/MongoDBService';

const ComplaintManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'submitted' | 'pending' | 'in_progress' | 'solved' | 'rejected'>('all');
  const [professors, setProfessors] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  const loadComplaints = async () => {
    try {
      const allComplaints = await mongoService.getAllComplaints();
      // Filter out any invalid complaints
      const validComplaints = allComplaints.filter(complaint => complaint && complaint.id);
      setComplaints(validComplaints);
      applyFilters(validComplaints, searchQuery, filter);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load professors for assignment
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
    } catch (error: any) {
      console.error('Failed to load professors:', error.message || error);
    }
  };

  const applyFilters = (complaintList: Complaint[], query: string, statusFilter: string) => {
    // Filter out any invalid complaints
    let filtered = complaintList.filter(complaint => complaint && complaint.id);

    // Apply search filter
    if (query && query.trim()) {
      const trimmedQuery = query.trim().toLowerCase();
      filtered = filtered.filter(complaint =>
        (complaint.topic && typeof complaint.topic === 'string' && complaint.topic.toLowerCase().includes(trimmedQuery)) ||
        (complaint.description && typeof complaint.description === 'string' && complaint.description.toLowerCase().includes(trimmedQuery)) ||
        (complaint.studentName && typeof complaint.studentName === 'string' && complaint.studentName.toLowerCase().includes(trimmedQuery)) ||
        (complaint.course && typeof complaint.course === 'string' && complaint.course.toLowerCase().includes(trimmedQuery))
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(complaint => 
        complaint.status && typeof complaint.status === 'string' && complaint.status === statusFilter
      );
    }

    setFilteredComplaints(filtered);
  };

  useEffect(() => {
    loadComplaints();
    loadProfessors();
  }, []);

  useEffect(() => {
    applyFilters(complaints, searchQuery, filter);
  }, [searchQuery, filter, complaints]);

  const onRefresh = () => {
    setRefreshing(true);
    loadComplaints();
  };

  const getStatusColor = (status: string) => {
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
  };

  const assignToProfessor = async (professorId: string) => {
    // Validate inputs
    if (!selectedComplaint) {
      Alert.alert('Error', 'No complaint selected');
      return;
    }
    
    if (!professorId || typeof professorId !== 'string') {
      Alert.alert('Error', 'Invalid professor selected');
      return;
    }
    
    if (!selectedComplaint.id || typeof selectedComplaint.id !== 'string') {
      Alert.alert('Error', 'Invalid complaint selected');
      return;
    }

    setAssigning(true);
    try {
      const updatedComplaint = await mongoService.assignComplaintToProfessor(selectedComplaint.id, professorId);
      
      // Validate the response
      if (!updatedComplaint || !updatedComplaint.id) {
        throw new Error('Invalid response from server');
      }
      
      // Update the complaints list with the updated complaint
      const updatedComplaints = complaints.map(c => 
        c.id === updatedComplaint.id ? updatedComplaint : c
      );
      
      setComplaints(updatedComplaints);
      applyFilters(updatedComplaints, searchQuery, filter);
      
      setMenuVisible(false);
      setSelectedComplaint(null);
      Alert.alert('Success', 'Complaint assigned to professor successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to assign complaint to professor');
    } finally {
      setAssigning(false);
    }
  };

  // Group professors by department
  const groupProfessorsByDepartment = () => {
    let filteredProfessors = professors;
    
    // If a department is selected, filter by it
    if (selectedDepartment) {
      filteredProfessors = filteredProfessors.filter(prof => 
        (prof.department || 'Unknown Department') === selectedDepartment
      );
    }
    
    const grouped: {[key: string]: any[]} = {};
    
    filteredProfessors.forEach(professor => {
      // Ensure professor object is valid
      if (!professor || !professor.id) {
        return;
      }
      
      const department = professor.department || 'Unknown Department';
      if (!grouped[department]) {
        grouped[department] = [];
      }
      grouped[department].push(professor);
    });
    
    return grouped;
  };

  const renderComplaint = ({ item }: { item: Complaint }) => {
    // Ensure item is valid
    if (!item || !item.id) {
      return null;
    }
    
    // Check if this is a meeting request
    const isMeetingRequest = item.topic && typeof item.topic === 'string' && item.topic.startsWith('[MEETING REQUEST]');
    
    // Ensure required fields are valid strings
    const topic = item.topic && typeof item.topic === 'string' ? item.topic : 'Untitled Complaint';
    const description = item.description && typeof item.description === 'string' ? item.description : 'No description';
    const studentName = item.studentName && typeof item.studentName === 'string' ? item.studentName : 'Unknown Student';
    const course = item.course && typeof item.course === 'string' ? item.course : 'Unknown Course';
    const assignedProfessorName = item.assignedProfessorName && typeof item.assignedProfessorName === 'string' ? 
      item.assignedProfessorName : null;
    
    return (
      <Card 
        style={[styles.complaintCard, isMeetingRequest && styles.meetingRequestCard]} 
        onPress={() => navigation.navigate('ComplaintDetails', { complaint: item })}
      >
        <Card.Content>
          <View style={styles.complaintHeader}>
            <Title style={styles.complaintTitle}>{topic}</Title>
            <View style={styles.chipContainer}>
              {isMeetingRequest && (
                <Chip 
                  style={[styles.statusChip, { backgroundColor: '#ff9800' }]}
                  textStyle={styles.statusText}
                >
                  MEETING
                </Chip>
              )}
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
                textStyle={styles.statusText}
              >
                {item.status && typeof item.status === 'string' ? item.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
              </Chip>
            </View>
          </View>
          
          <Paragraph style={styles.complaintDescription} numberOfLines={2}>
            {description}
          </Paragraph>
          
          <View style={styles.complaintMeta}>
            <Text style={styles.metaText}>Student: {studentName}</Text>
            <Text style={styles.metaText}>Course: {course}</Text>
          </View>
          
          <View style={styles.complaintMeta}>
            <Text style={styles.metaText}>
              Submitted: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown Date'}
            </Text>
            <Text style={styles.replyCount}>
              {item.replies && Array.isArray(item.replies) ? item.replies.length : 0} replies
            </Text>
          </View>
          
          {assignedProfessorName && (
            <Text style={styles.assignedText}>
              Assigned to: {assignedProfessorName}
            </Text>
          )}
          
          {/* Assignment Button */}
          <Button
            mode="outlined"
            onPress={(e) => {
              e.stopPropagation();
              setSelectedComplaint(item);
              setMenuVisible(true);
            }}
            style={styles.assignButton}
            textColor="#d32f2f"
            loading={assigning && selectedComplaint?.id === item.id}
          >
            {assignedProfessorName ? 'Reassign' : 'Assign to Professor'}
          </Button>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading complaints...</Text>
      </View>
    );
  }

  // Ensure filteredComplaints is an array
  const safeFilteredComplaints = Array.isArray(filteredComplaints) ? filteredComplaints : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Complaint Management</Title>
      </View>

      <View style={styles.filtersContainer}>
        <Searchbar
          placeholder="Search complaints..."
          onChangeText={setSearchQuery}
          value={searchQuery && typeof searchQuery === 'string' ? searchQuery : ''}
          style={styles.searchBar}
        />
        
        <View style={styles.filterChips}>
          <Chip
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={styles.filterChip}
          >
            <Text>All</Text>
          </Chip>
          <Chip
            selected={filter === 'submitted'}
            onPress={() => setFilter('submitted')}
            style={styles.filterChip}
          >
            <Text>Submitted</Text>
          </Chip>
          <Chip
            selected={filter === 'pending'}
            onPress={() => setFilter('pending')}
            style={styles.filterChip}
          >
            <Text>Pending</Text>
          </Chip>
          <Chip
            selected={filter === 'in_progress'}
            onPress={() => setFilter('in_progress')}
            style={styles.filterChip}
          >
            <Text>In Progress</Text>
          </Chip>
          <Chip
            selected={filter === 'solved'}
            onPress={() => setFilter('solved')}
            style={styles.filterChip}
          >
            <Text>Solved</Text>
          </Chip>
          <Chip
            selected={filter === 'rejected'}
            onPress={() => setFilter('rejected')}
            style={styles.filterChip}
          >
            <Text>Rejected</Text>
          </Chip>
        </View>
      </View>

      <FlatList
        data={safeFilteredComplaints.filter(item => item && item.id)} // Filter out invalid items
        renderItem={renderComplaint}
        keyExtractor={(item) => item && item.id ? item.id : Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No complaints found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' ? 'No complaints submitted yet' : `No ${filter} complaints`}
            </Text>
          </View>
        }
      />

      {/* Professor Assignment Menu */}
      <Modal
        visible={menuVisible && selectedComplaint !== null}
        onRequestClose={() => {
          setMenuVisible(false);
          setSelectedComplaint(null);
          setSelectedDepartment('');
        }}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Complaint to Professor</Text>
              <Button
                onPress={() => {
                  setMenuVisible(false);
                  setSelectedComplaint(null);
                  setSelectedDepartment('');
                }}
                style={styles.closeButton}
              >
                Close
              </Button>
            </View>
            
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
            
            <Divider style={styles.divider} />
            
            {/* Professor List */}
            <ScrollView style={styles.professorList}>
              {(() => {
                const groupedProfessors = groupProfessorsByDepartment();
                const entries = Object.entries(groupedProfessors);
                
                if (entries.length === 0) {
                  return (
                    <View style={styles.emptyProfessors}>
                      <Text>No professors available</Text>
                    </View>
                  );
                }
                
                return entries.map(([department, deptProfessors]) => {
                  // Ensure department is a valid string
                  const departmentName = department && typeof department === 'string' ? department : 'Unknown Department';
                  
                  return (
                    <View key={departmentName}>
                      <Text style={styles.departmentHeader}>{departmentName}</Text>
                      {deptProfessors.map((professor) => {
                        // Ensure professor object is valid
                        if (!professor || !professor.id || !professor.fullName) {
                          return null;
                        }
                        
                        // Ensure fullName is a valid string
                        const professorName = professor.fullName && typeof professor.fullName === 'string' ? 
                          professor.fullName : 'Unknown Professor';
                        
                        return (
                          <TouchableOpacity
                            key={professor.id}
                            onPress={() => assignToProfessor(professor.id)}
                            style={styles.professorItem}
                            disabled={assigning}
                          >
                            <Text style={styles.professorName}>{professorName}</Text>
                            {assigning && (
                              <ActivityIndicator size="small" style={styles.assigningIndicator} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                });
              })()}
            </ScrollView>
            
            <Button
              mode="outlined"
              onPress={() => {
                setMenuVisible(false);
                setSelectedComplaint(null);
                setSelectedDepartment('');
              }}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </View>
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
    backgroundColor: '#d32f2f',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  filtersContainer: {
    padding: 16,
  },
  searchBar: {
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  complaintCard: {
    marginBottom: 16,
    elevation: 4,
  },
  
  meetingRequestCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#888',
  },
  replyCount: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '500',
  },
  assignedText: {
    fontSize: 14,
    color: '#9c27b0',
    fontWeight: '500',
    marginTop: 4,
  },
  assignButton: {
    marginTop: 10,
    borderColor: '#d32f2f',
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
  menu: {
    maxHeight: 400,
  },
  menuContent: {
    padding: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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
    padding: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    marginVertical: 10,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  professorList: {
    maxHeight: 300,
  },
  emptyProfessors: {
    padding: 16,
    alignItems: 'center',
  },
  professorItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  professorName: {
    fontSize: 16,
  },
  assigningIndicator: {
    position: 'absolute',
    right: 0,
  },
  cancelButton: {
    marginTop: 16,
  },
});

export default ComplaintManagementScreen;