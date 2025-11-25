import React, { useState, useEffect } from 'react';
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
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../../contexts/MongoDBAuthContext';
import { mongoService, Complaint } from '../../services/MongoDBService';

const ProfessorDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadComplaints = async () => {
    if (!userProfile) return;
    
    try {
      const professorComplaints = await mongoService.getComplaintsByProfessor(userProfile.id);
      setComplaints(professorComplaints);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [userProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadComplaints();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return '#2196f3';
      case 'pending':
        return '#ff9800';
      case 'in progress':
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

  // Calculate complaint statistics
  const getComplaintStats = () => {
    const totalAssigned = complaints.length;
    const inProgress = complaints.filter(c => 
      c.status.toLowerCase() === 'in progress' || c.status.toLowerCase() === 'in_progress'
    ).length;
    const solved = complaints.filter(c => c.status.toLowerCase() === 'solved').length;
    
    return { totalAssigned, inProgress, solved };
  };

  const renderComplaint = ({ item }: { item: Complaint }) => (
    <Card 
      style={styles.complaintCard} 
      onPress={() => navigation.navigate('ComplaintDetails', { complaint: item })}
    >
      <Card.Content>
        <View style={styles.complaintHeader}>
          <Title style={styles.complaintTitle}>{item.topic}</Title>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusText}
          >
            {item.status.replace('_', ' ').toUpperCase()}
          </Chip>
        </View>
        <Paragraph style={styles.complaintDescription} numberOfLines={2}>
          {item.description}
        </Paragraph>
        <View style={styles.complaintMeta}>
          <Text style={styles.metaText}>Student: {item.studentName}</Text>
          <Text style={styles.metaText}>Department: {item.department}</Text>
        </View>
        <View style={styles.complaintMeta}>
          <Text style={styles.metaText}>
            Submitted: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.replyCount}>
            {item.replies?.length || 0} replies
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading assigned complaints...</Text>
      </View>
    );
  }

  const stats = getComplaintStats();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.welcomeText}>
          Professor {userProfile?.fullName}
        </Title>
        <Text style={styles.subtitleText}>
          Manage complaints assigned to you
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>{stats.totalAssigned}</Text>
            <Text style={styles.statLabel}>Total Assigned</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>{stats.solved}</Text>
            <Text style={styles.statLabel}>Solved</Text>
          </Card.Content>
        </Card>
      </View>

      <FlatList
        data={complaints}
        renderItem={renderComplaint}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No complaints in your department</Text>
            <Text style={styles.emptySubtext}>
              You will see complaints here once students submit complaints in your department
            </Text>
          </View>
        }
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
    backgroundColor: '#9c27b0',
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9c27b0',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
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
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#888',
  },
  replyCount: {
    fontSize: 14,
    color: '#9c27b0',
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
});

export default ProfessorDashboard;