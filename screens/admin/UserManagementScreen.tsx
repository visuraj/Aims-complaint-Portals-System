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
  Chip,
  ActivityIndicator,
  Searchbar,
} from 'react-native-paper';
import { mongoService, UserProfile } from '../../services/MongoDBService';

const UserManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const loadUsers = useCallback(async () => {
    try {
      // Show loading indicator only for initial load
      const showLoading = users.length === 0;
      if (showLoading) {
        setLoading(true);
      }
      
      const allUsers = await mongoService.getAllUsers();
      setUsers(allUsers);
      // Apply filters only when needed
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [users.length]);

  // Memoize filtered users to prevent unnecessary recalculations
  const memoizedFilteredUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        (user.fullName && user.fullName.toLowerCase().includes(lowerQuery)) ||
        (user.email && user.email.toLowerCase().includes(lowerQuery)) ||
        (user.collegeId && user.collegeId.toLowerCase().includes(lowerQuery)) ||
        (user.professorId && user.professorId.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(user => user.status === filter);
    }

    return filtered;
  }, [users, searchQuery, filter]);

  useEffect(() => {
    loadUsers();
    
    // Set up interval to periodically refresh users
    // Increased from immediate refresh to 300 seconds (5 minutes) to reduce API calls
    const interval = setInterval(() => {
      if (!loading) {
        loadUsers();
      }
    }, 300000); // Refresh every 5 minutes
    
    return () => clearInterval(interval);
  }, [loadUsers, loading]);

  // Update filtered users when memoized result changes
  useEffect(() => {
    setFilteredUsers(memoizedFilteredUsers);
  }, [memoizedFilteredUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, [loadUsers]);

  const handleApprove = useCallback(async (userId: string) => {
    try {
      await mongoService.approveUser(userId);
      Alert.alert('Success', 'User approved successfully');
      loadUsers();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve user');
    }
  }, [loadUsers]);

  const handleReject = useCallback(async (userId: string) => {
    Alert.alert(
      'Confirm Rejection',
      'Are you sure you want to reject this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await mongoService.rejectUser(userId);
              Alert.alert('Success', 'User rejected successfully');
              loadUsers();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject user');
            }
          },
        },
      ]
    );
  }, [loadUsers]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'approved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#666';
    }
  }, []);

  const getRoleColor = useCallback((role: string) => {
    switch (role) {
      case 'student':
        return '#2196f3';
      case 'professor':
        return '#9c27b0';
      case 'admin':
        return '#d32f2f';
      default:
        return '#666';
    }
  }, []);

  const renderUser = useCallback(({ item }: { item: UserProfile }) => {
    // Add safety checks for all item properties
    const fullName = item.fullName && typeof item.fullName === 'string' ? item.fullName : 'Unknown User';
    const email = item.email && typeof item.email === 'string' ? item.email : 'No email';
    const role = item.role && typeof item.role === 'string' ? item.role : 'unknown';
    const status = item.status && typeof item.status === 'string' ? item.status : 'pending';
    const collegeId = item.collegeId && typeof item.collegeId === 'string' ? item.collegeId : 'Not provided';
    const course = item.course && typeof item.course === 'string' ? item.course : 'Not specified';
    const professorId = item.professorId && typeof item.professorId === 'string' ? item.professorId : 'Not provided';
    const department = item.department && typeof item.department === 'string' ? item.department : 'Not specified';
    
    return (
      <Card style={styles.userCard}>
        <Card.Content>
          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              <Title style={styles.userName}>{fullName}</Title>
              <Chip 
                style={[styles.roleChip, { backgroundColor: getRoleColor(role) }]}
                textStyle={styles.roleText}
              >
                {role.toUpperCase()}
              </Chip>
            </View>
            <Chip 
              style={[styles.statusChip, { backgroundColor: getStatusColor(status) }]}
              textStyle={styles.statusText}
            >
              {status.toUpperCase()}
            </Chip>
          </View>
          
          <Paragraph style={styles.userEmail}>{email}</Paragraph>
          
          {role === 'student' && (
            <View style={styles.userDetails}>
              <Text style={styles.detailText}>College ID: {collegeId}</Text>
              <Text style={styles.detailText}>Course: {course}</Text>
            </View>
          )}
          
          {role === 'professor' && (
            <View style={styles.userDetails}>
              <Text style={styles.detailText}>Professor ID: {professorId}</Text>
              <Text style={styles.detailText}>Department: {department}</Text>
            </View>
          )}
          
          <Text style={styles.registeredDate}>
            Registered: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}
          </Text>
          
          {status === 'pending' && (
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={() => handleApprove(item.id)}
                style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
              >
                Approve
              </Button>
              <Button
                mode="contained"
                onPress={() => handleReject(item.id)}
                style={[styles.actionButton, { backgroundColor: '#f44336' }]}
              >
                Reject
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  }, [getStatusColor, getRoleColor, handleApprove, handleReject]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>User Management</Title>
      </View>

      <View style={styles.filtersContainer}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
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
            selected={filter === 'pending'}
            onPress={() => setFilter('pending')}
            style={styles.filterChip}
          >
            <Text>Pending</Text>
          </Chip>
          <Chip
            selected={filter === 'approved'}
            onPress={() => setFilter('approved')}
            style={styles.filterChip}
          >
            <Text>Approved</Text>
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
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' ? 'No users registered yet' : `No ${filter} users`}
            </Text>
          </View>
        }
        // Performance optimizations
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        // Add extra performance optimizations
        scrollEventThrottle={16} // Limit scroll events to 60fps
      />
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
  userCard: {
    marginBottom: 16,
    elevation: 4,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  roleChip: {
    marginRight: 8,
  },
  roleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusChip: {
    marginLeft: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userDetails: {
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  registeredDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
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
});

export default UserManagementScreen;