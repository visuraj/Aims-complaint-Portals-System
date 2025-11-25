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

const AdminScheduleMeetingScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { complaint } = route.params;
  const { userProfile } = useAuth();
  const [meetingNotes, setMeetingNotes] = useState(''); // Simplified to just notes
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'Admin profile not found');
      return;
    }

    if (!complaint) {
      Alert.alert('Error', 'Complaint data not found');
      return;
    }

    setLoading(true);
    try {
      // Create a reply to the meeting request with acknowledgment
      const replyMessage = `MEETING REQUEST ACKNOWLEDGED\n\n` +
        `Your meeting request has been received and assigned to ${userProfile.fullName}.\n` +
        `They will contact you directly to schedule the meeting.\n\n` +
        `${meetingNotes ? `Additional Notes: ${meetingNotes}` : ''}`;

      await mongoService.addReply(complaint.id, {
        userId: userProfile.id,
        userName: userProfile.fullName,
        userRole: 'admin',
        message: replyMessage,
      });

      // Update complaint status to indicate meeting request acknowledged
      await mongoService.updateComplaintStatus(complaint.id, 'pending');

      Alert.alert(
        'Success',
        'Meeting request acknowledged! The student has been notified.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to acknowledge meeting request');
    } finally {
      setLoading(false);
    }
  };

  // Extract student info from complaint
  const studentName = complaint.studentName || 'Unknown Student';
  const studentEmail = complaint.studentEmail || 'Unknown Email';

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Acknowledge Meeting Request</Title>
            <Paragraph style={styles.subtitle}>
              Acknowledge student's meeting request and assign it to yourself
            </Paragraph>
            
            <View style={styles.studentInfoContainer}>
              <Text style={styles.studentInfoLabel}>Student:</Text>
              <Text style={styles.studentInfoValue}>{studentName}</Text>
              <Text style={styles.studentInfoLabel}>Email:</Text>
              <Text style={styles.studentInfoValue}>{studentEmail}</Text>
              <Text style={styles.studentInfoLabel}>Meeting Request Topic:</Text>
              <Text style={styles.studentInfoValue}>
                {complaint.topic?.replace('[MEETING REQUEST] ', '') || 'No topic'}
              </Text>
            </View>
            
            <TextInput
              label="Additional Notes (Optional)"
              value={meetingNotes}
              onChangeText={setMeetingNotes}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Any additional information for the student..."
            />
            
            <HelperText type="info" visible={true} style={styles.infoHelper}>
              The student will receive a notification that you've acknowledged their meeting request.
              You can contact them directly to schedule the meeting details.
            </HelperText>
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
            >
              Acknowledge Meeting Request
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

export default AdminScheduleMeetingScreen;