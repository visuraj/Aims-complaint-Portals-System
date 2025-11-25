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
  ActivityIndicator,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../contexts/MongoDBAuthContext';
import { mongoService } from '../../services/MongoDBService';

const AddComplaintScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    course: '',
  });
  const [attachment, setAttachment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [weeklyComplaintCount, setWeeklyComplaintCount] = useState(0);
  const MAX_WEEKLY_COMPLAINTS = 10;

  // Load weekly complaint count when component mounts
  useEffect(() => {
    const loadWeeklyCount = async () => {
      if (userProfile) {
        try {
          const count = await mongoService.getWeeklyComplaintCount(userProfile.id);
          setWeeklyComplaintCount(count);
        } catch (error) {
          console.error('Error loading weekly complaint count:', error);
        }
      }
    };
    
    loadWeeklyCount();
  }, [userProfile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachment(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleSubmit = async () => {
    const { topic, description, course } = formData;

    if (!topic || !description || !course) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!userProfile) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    // Check if weekly limit has been reached
    if (weeklyComplaintCount >= MAX_WEEKLY_COMPLAINTS) {
      Alert.alert(
        'Weekly Limit Reached',
        'You have reached your weekly complaint limit of 10 complaints. Please schedule a meeting with an admin for additional complaints.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Schedule Meeting', onPress: () => navigation.navigate('ScheduleMeeting') }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      // Upload attachment if exists
      let attachmentUrl = '';
      if (attachment) {
        try {
          // For now, we'll just save the file name as the attachment
          // In a real implementation, you would upload to a server
          attachmentUrl = attachment.uri;
        } catch (error) {
          console.error('Error uploading attachment:', error);
          Alert.alert('Warning', 'Failed to upload attachment, submitting without it');
        }
      }

      // Create complaint
      await mongoService.createComplaint({
        studentId: userProfile.id,
        studentName: userProfile.fullName,
        studentEmail: userProfile.email,
        topic,
        description,
        course,
        department: course, // Use course as department
        status: 'submitted',
        assignedProfessorId: '',
        assignedProfessorName: '',
        assignedAdminId: '',
        attachments: attachmentUrl ? [attachmentUrl] : [],
      });

      Alert.alert(
        'Success',
        'Complaint submitted successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit complaint');
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
            <Title style={styles.title}>Submit New Complaint</Title>
            
            {/* Weekly Limit Info */}
            <View style={styles.limitInfoContainer}>
              <Text style={styles.limitInfo}>
                Weekly complaints: {weeklyComplaintCount}/{MAX_WEEKLY_COMPLAINTS}
              </Text>
              {weeklyComplaintCount >= MAX_WEEKLY_COMPLAINTS && (
                <Text style={styles.limitWarning}>
                  You've reached your weekly limit. Please schedule a meeting with an admin.
                </Text>
              )}
            </View>
            
            <TextInput
              label="Topic"
              value={formData.topic}
              onChangeText={(value) => handleInputChange('topic', value)}
              mode="outlined"
              style={styles.input}
              placeholder="Brief description of your complaint"
            />
            
            <TextInput
              label="Course"
              value={formData.course}
              onChangeText={(value) => handleInputChange('course', value)}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Computer Science, Mathematics"
            />
            
            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={styles.input}
              placeholder="Provide detailed description of your complaint..."
            />
            
            <View style={styles.attachmentSection}>
              <Text style={styles.sectionTitle}>Attachments (Optional)</Text>
              
              <Button
                mode="outlined"
                onPress={pickDocument}
                style={styles.attachmentButton}
                icon="file-document"
              >
                Add File
              </Button>
              
              {attachment && (
                <View style={styles.attachmentsList}>
                  <Card style={styles.attachmentCard}>
                    <Card.Content style={styles.attachmentContent}>
                      <Text style={styles.attachmentText} numberOfLines={1}>
                        {attachment.name || 'Selected file'}
                      </Text>
                      <Button
                        mode="text"
                        onPress={removeAttachment}
                        icon="close"
                        compact
                      >
                        Remove
                      </Button>
                    </Card.Content>
                  </Card>
                </View>
              )}
            </View>
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || weeklyComplaintCount >= MAX_WEEKLY_COMPLAINTS}
              style={styles.submitButton}
            >
              Submit Complaint
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
    marginBottom: 20,
    fontSize: 22,
    color: '#1976d2',
  },
  limitInfoContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
  },
  limitInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    textAlign: 'center',
  },
  limitWarning: {
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
    marginTop: 5,
  },
  input: {
    marginBottom: 15,
  },
  attachmentSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  attachmentButton: {
    marginVertical: 5,
  },
  attachmentsList: {
    marginTop: 10,
  },
  attachmentCard: {
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  attachmentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attachmentText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  submitButton: {
    marginTop: 20,
  },
});

export default AddComplaintScreen;