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

const ScheduleMeetingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!meetingTopic.trim()) {
      Alert.alert('Error', 'Please enter a meeting topic');
      return;
    }

    if (!meetingDescription.trim()) {
      Alert.alert('Error', 'Please enter a meeting description');
      return;
    }

    if (!userProfile) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    setLoading(true);
    try {
      // Create a special complaint type for meeting requests
      await mongoService.createComplaint({
        studentId: userProfile.id,
        studentName: userProfile.fullName,
        studentEmail: userProfile.email,
        topic: `[MEETING REQUEST] ${meetingTopic}`,
        description: `Meeting Request:
${meetingDescription}

Preferred Date: ${preferredDate}
Preferred Time: ${preferredTime}`,
        course: userProfile.course || 'General',
        department: userProfile.course || 'General',
        status: 'submitted',
        assignedProfessorId: '',
        assignedProfessorName: '',
        assignedAdminId: '',
        attachments: [],
      });

      Alert.alert(
        'Success',
        'Meeting request submitted successfully! An admin will contact you to confirm the meeting.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit meeting request');
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
            <Title style={styles.title}>Schedule Meeting with Admin</Title>
            <Paragraph style={styles.subtitle}>
              You've reached your weekly complaint limit. Please schedule a meeting with an admin for additional complaints.
            </Paragraph>
            
            <TextInput
              label="Meeting Topic"
              value={meetingTopic}
              onChangeText={setMeetingTopic}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Additional Complaints Discussion"
            />
            
            <TextInput
              label="Meeting Description"
              value={meetingDescription}
              onChangeText={setMeetingDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Provide details about what you'd like to discuss..."
            />
            
            <TextInput
              label="Preferred Date"
              value={preferredDate}
              onChangeText={setPreferredDate}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., 2025-12-25"
            />
            <HelperText type="info" visible={true}>
              Please enter date in YYYY-MM-DD format
            </HelperText>
            
            <TextInput
              label="Preferred Time"
              value={preferredTime}
              onChangeText={setPreferredTime}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., 14:30"
            />
            <HelperText type="info" visible={true}>
              Please enter time in 24-hour format (HH:MM)
            </HelperText>
            
            <HelperText type="info" visible={true} style={styles.infoHelper}>
              An admin will review your request and contact you to confirm the meeting details.
            </HelperText>
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
            >
              Submit Meeting Request
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
    color: '#1976d2',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
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

export default ScheduleMeetingScreen;