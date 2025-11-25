import React, { useState } from 'react';
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
  ActivityIndicator,
  HelperText,
} from 'react-native-paper';
import { useAuth } from '../../contexts/MongoDBAuthContext';
import { mongoService } from '../../services/MongoDBService';

const SendMeetingRequestScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { student } = route.params;
  const { userProfile } = useAuth();
  const [meetingTopic, setMeetingTopic] = useState('Exceeded Weekly Complaint Limit');
  const [meetingDescription, setMeetingDescription] = useState('This student has exceeded the weekly complaint limit and needs to discuss their concerns.');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [loading, setLoading] = useState(false);

  // Add a safety check for student data
  if (!student) {
    return (
      <View style={styles.container}>
        <Text>Error: Student data not available</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!meetingTopic.trim()) {
      Alert.alert('Error', 'Please enter a meeting topic');
      return;
    }

    if (!meetingDescription.trim()) {
      Alert.alert('Error', 'Please enter a meeting description');
      return;
    }

    if (!meetingDate.trim() || !meetingTime.trim()) {
      Alert.alert('Error', 'Please enter both date and time for the meeting');
      return;
    }

    if (!userProfile) {
      Alert.alert('Error', 'Admin profile not found');
      return;
    }

    setLoading(true);
    try {
      // Create a special complaint type for meeting requests
      const complaintId = await mongoService.createComplaint({
        studentId: student.id,
        studentName: student.fullName,
        studentEmail: student.email,
        topic: `[MEETING REQUEST] ${meetingTopic}`,
        description: `Meeting Request for Exceeding Weekly Complaint Limit:
        
Student has submitted ${student.complaintCount || 0} complaints this week (limit is 10).

${meetingDescription}

Meeting Details:
Date: ${meetingDate}
Time: ${meetingTime}
Location: ${meetingLocation || 'To be determined'}`,
        course: student.course || 'General',
        department: student.course || 'General',
        status: 'submitted',
        assignedProfessorId: '',
        assignedProfessorName: '',
        assignedAdminId: '',
        attachments: [],
      });

      // Add a reply to the complaint with scheduling details
      const replyMessage = `MEETING SCHEDULED\n\n` +
        `Date: ${meetingDate}\n` +
        `Time: ${meetingTime}\n` +
        `Location: ${meetingLocation || 'To be determined'}\n` +
        `Scheduled by: ${userProfile.fullName}\n\n`;

      await mongoService.addReply(complaintId, {
        userId: userProfile.id,
        userName: userProfile.fullName,
        userRole: 'admin',
        message: replyMessage,
      });

      Alert.alert(
        'Success',
        'Meeting request sent successfully! The student has been notified.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error sending meeting request:', error);
      // More detailed error handling
      let errorMessage = 'Failed to send meeting request';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Send Meeting Request to Student</Title>
            <Paragraph style={styles.subtitle}>
              Send a direct meeting request to a student who has exceeded their weekly complaint limit
            </Paragraph>
            
            <View style={styles.studentInfoContainer}>
              <Text style={styles.studentInfoLabel}>Student:</Text>
              <Text style={styles.studentInfoValue}>{student.fullName || 'Unknown Student'}</Text>
              <Text style={styles.studentInfoLabel}>Email:</Text>
              <Text style={styles.studentInfoValue}>{student.email || 'Unknown Email'}</Text>
              <Text style={styles.studentInfoLabel}>Course:</Text>
              <Text style={styles.studentInfoValue}>{student.course || 'Not specified'}</Text>
              {student.complaintCount !== undefined && (
                <>
                  <Text style={styles.studentInfoLabel}>Complaints this week:</Text>
                  <Text style={styles.studentInfoValue}>{student.complaintCount || 0}/10</Text>
                </>
              )}
            </View>
            
            <TextInput
              label="Meeting Topic"
              value={meetingTopic}
              onChangeText={setMeetingTopic}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Exceeded Weekly Complaint Limit"
            />
            
            <TextInput
              label="Meeting Description"
              value={meetingDescription}
              onChangeText={setMeetingDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Provide details about why this meeting is necessary..."
            />
            
            <TextInput
              label="Meeting Date"
              value={meetingDate}
              onChangeText={setMeetingDate}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., 2025-12-25"
            />
            <HelperText type="info" visible={true}>
              Please enter date in YYYY-MM-DD format
            </HelperText>
            
            <TextInput
              label="Meeting Time"
              value={meetingTime}
              onChangeText={setMeetingTime}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., 14:30"
            />
            <HelperText type="info" visible={true}>
              Please enter time in 24-hour format (HH:MM)
            </HelperText>
            
            <TextInput
              label="Meeting Location"
              value={meetingLocation}
              onChangeText={setMeetingLocation}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Office Hours Room 101"
            />
            
            <HelperText type="info" visible={true} style={styles.infoHelper}>
              The student will receive a notification with these meeting details.
            </HelperText>
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
            >
              Send Meeting Request
            </Button>
          </Card.Content>
        </Card>
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
  card: {
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 22,
    color: '#d32f2f',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  studentInfoContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  studentInfoLabel: {
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 8,
  },
  studentInfoValue: {
    color: '#333',
    marginBottom: 4,
  },
  input: {
    marginBottom: 15,
  },
  infoHelper: {
    marginBottom: 10,
  },
  submitButton: {
    marginTop: 10,
  },
});

export default SendMeetingRequestScreen;