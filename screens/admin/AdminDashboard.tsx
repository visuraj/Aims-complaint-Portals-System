import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import { useAuth } from '../../contexts/MongoDBAuthContext';
import { mongoService } from '../../services/MongoDBService';

const AdminDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    students: 0,
    professors: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
    solvedComplaints: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      // Show loading indicator only for initial load
      const showLoading = stats.totalUsers === 0;
      if (showLoading) {
        setLoading(true);
      }

      // Fetch data in parallel for better performance
      const [allUsers, pendingUsers, allComplaints] = await Promise.all([
        mongoService.getAllUsers(),
        mongoService.getPendingUsers(),
        mongoService.getAllComplaints()
      ]);

      setStats({
        totalUsers: allUsers.length,
        pendingApprovals: pendingUsers.length,
        students: allUsers.filter(user => user.role === 'student').length,
        professors: allUsers.filter(user => user.role === 'professor').length,
        totalComplaints: allComplaints.length,
        pendingComplaints: allComplaints.filter(c => c.status === 'pending' || c.status === 'submitted').length,
        solvedComplaints: allComplaints.filter(c => c.status === 'solved').length,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, [stats.totalUsers]);

  useEffect(() => {
    loadStats();
    
    // Set up interval to periodically refresh stats
    // Increased from immediate refresh to 300 seconds (5 minutes) to reduce API calls
    const interval = setInterval(() => {
      loadStats();
    }, 300000); // Refresh every 5 minutes
    
    return () => clearInterval(interval);
  }, [loadStats]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.welcomeText}>
          Admin Dashboard
        </Title>
        <Text style={styles.subtitleText}>
          Welcome, {userProfile?.fullName}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, { color: '#ff9800' }]}>{stats.pendingApprovals}</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, { color: '#2196f3' }]}>{stats.students}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, { color: '#9c27b0' }]}>{stats.professors}</Text>
            <Text style={styles.statLabel}>Professors</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, { color: '#4caf50' }]}>{stats.totalComplaints}</Text>
            <Text style={styles.statLabel}>Total Complaints</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, { color: '#ff5722' }]}>{stats.pendingComplaints}</Text>
            <Text style={styles.statLabel}>Pending Complaints</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.actionsContainer}>
        <Card style={styles.actionCard}>
          <Card.Content>
            <Title style={styles.actionTitle}>Quick Actions</Title>
            
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Users')}
              style={styles.actionButton}
            >
              Manage Users
            </Button>
            
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Complaints')}
              style={styles.actionButton}
            >
              Manage Complaints
            </Button>
            
            <Button
              mode="contained"
              onPress={() => navigation.navigate('ExceededLimit')}
              style={styles.actionButton}
            >
              Exceeded Limit Students
            </Button>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.notificationsContainer}>
        <Card style={styles.notificationCard}>
          <Card.Content>
            <Title style={styles.notificationTitle}>Recent Activity</Title>
            
            {stats.pendingApprovals > 0 && (
              <View style={styles.notificationItem}>
                <Text style={styles.notificationText}>
                  {stats.pendingApprovals} user(s) waiting for approval
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('Users')}
                  compact
                >
                  Review
                </Button>
              </View>
            )}
            
            {stats.pendingComplaints > 0 && (
              <View style={styles.notificationItem}>
                <Text style={styles.notificationText}>
                  {stats.pendingComplaints} complaint(s) pending review
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('Complaints')}
                  compact
                >
                  Review
                </Button>
              </View>
            )}
            
            {stats.pendingApprovals === 0 && stats.pendingComplaints === 0 && (
              <Text style={styles.noNotificationsText}>
                No pending actions required
              </Text>
            )}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
    elevation: 4,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  actionsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  actionCard: {
    elevation: 4,
  },
  actionTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#d32f2f',
  },
  actionButton: {
    marginBottom: 12,
    backgroundColor: '#d32f2f',
  },
  notificationsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  notificationCard: {
    elevation: 4,
  },
  notificationTitle: {
    marginBottom: 16,
    color: '#d32f2f',
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  noNotificationsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

export default AdminDashboard;