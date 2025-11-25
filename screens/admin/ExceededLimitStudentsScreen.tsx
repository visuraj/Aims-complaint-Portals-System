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
  Button,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { mongoService, UserProfile } from '../../services/MongoDBService';

const ExceededLimitStudentsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStudents = async () => {
    try {
      // Get all users first
      const allUsers = await mongoService.getAllUsers();
      
      // Filter for approved students only
      const approvedStudents = allUsers.filter(user => 
        user.role === 'student' && user.status === 'approved'
      );
      
      // Check each student's complaint limit
      const studentsWithLimitInfo = [];
      for (const student of approvedStudents) {
        try {
          const limitInfo = await mongoService.checkStudentComplaintLimit(student.id);
          if (limitInfo.exceeded) {
            studentsWithLimitInfo.push({
              ...student,
              complaintCount: limitInfo.count,
              complaintLimit: limitInfo.limit
            });
          }
        } catch (error) {
          console.error(`Error checking limit for student ${student.id}:`, error);
        }
      }
      
      setStudents(studentsWithLimitInfo);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load students');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
  };

  const sendMeetingRequest = (student: any) => {
    // Navigate to a screen where admin can send a meeting request
    navigation.navigate('SendMeetingRequest', { student });
  };

  const renderStudent = ({ item }: { item: any }) => {
    // Ensure all item properties are valid strings
    const fullName = item.fullName && typeof item.fullName === 'string' ? item.fullName : 'Unknown Student';
    const email = item.email && typeof item.email === 'string' ? item.email : 'Unknown Email';
    const course = item.course && typeof item.course === 'string' ? item.course : 'Not specified';
    const collegeId = item.collegeId && typeof item.collegeId === 'string' ? item.collegeId : 'Not specified';
    const complaintCount = item.complaintCount !== undefined ? item.complaintCount : 0;
    const complaintLimit = item.complaintLimit !== undefined ? item.complaintLimit : 10;

    return (
      <Card style={styles.studentCard}>
        <Card.Content>
          <View style={styles.studentHeader}>
            <Title style={styles.studentName}>{fullName}</Title>
            <Chip 
              style={styles.limitChip}
              textStyle={styles.limitText}
            >
              {complaintCount}/{complaintLimit}
            </Chip>
          </View>
          <Paragraph style={styles.studentEmail}>{email}</Paragraph>
          <Paragraph style={styles.studentInfo}>Course: {course}</Paragraph>
          <Paragraph style={styles.studentInfo}>College ID: {collegeId}</Paragraph>
          
          <Button
            mode="contained"
            onPress={() => sendMeetingRequest(item)}
            style={styles.sendRequestButton}
            icon="calendar"
          >
            Send Meeting Request
          </Button>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Students Exceeding Complaint Limit</Title>
        <Paragraph style={styles.headerSubtitle}>
          These students have submitted more than 10 complaints this week
        </Paragraph>
      </View>

      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No students have exceeded their complaint limit this week</Text>
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
    backgroundColor: '#d32f2f',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  studentCard: {
    marginBottom: 16,
    elevation: 4,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  limitChip: {
    backgroundColor: '#f44336',
  },
  limitText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  studentEmail: {
    marginBottom: 8,
    color: '#666',
  },
  studentInfo: {
    marginBottom: 4,
    fontSize: 14,
    color: '#888',
  },
  sendRequestButton: {
    marginTop: 15,
    backgroundColor: '#ff9800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ExceededLimitStudentsScreen;