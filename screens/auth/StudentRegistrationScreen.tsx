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
} from 'react-native-paper';
import { useAuth } from '../../contexts/MongoDBAuthContext';

const StudentRegistrationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    collegeId: '',
    email: '',
    password: '',
    confirmPassword: '',
    course: '',
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const { fullName, collegeId, email, password, confirmPassword, course } = formData;

    if (!fullName || !collegeId || !email || !password || !confirmPassword || !course) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      console.log('Registering student with data:', { fullName, collegeId, email, course });
      await signUp(email, password, {
        role: 'student',
        fullName,
        collegeId,
        course,
      });
      
      Alert.alert(
        'Registration Successful',
        'Your account has been created and is pending admin approval. You will be notified once approved.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      console.error('Student registration error:', error);
      if (error.message.includes('Network error') || error.message.includes('connect') || error.message.includes('server')) {
        Alert.alert('Connection Error', 'Unable to connect to the server. Please check your internet connection and ensure the server is running.');
      } else if (error.message.includes('User already exists')) {
        Alert.alert('Registration Failed', 'An account with this email already exists. Please use a different email or try logging in.');
      } else {
        Alert.alert('Registration Failed', error.message || 'Registration failed. Please check your information and try again.');
      }
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
        <View style={styles.header}>
          <Title style={styles.title}>Student Registration</Title>
          <Paragraph style={styles.subtitle}>Create your student account</Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Full Name"
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              mode="outlined"
              style={styles.input}
            />
            
            <TextInput
              label="College ID"
              value={formData.collegeId}
              onChangeText={(value) => handleInputChange('collegeId', value)}
              mode="outlined"
              style={styles.input}
            />
            
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            
            <TextInput
              label="Course"
              value={formData.course}
              onChangeText={(value) => handleInputChange('course', value)}
              mode="outlined"
              style={styles.input}
            />
            
            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            
            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            
            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Register
            </Button>
            
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.backButton}
            >
              Back to Login
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  card: {
    elevation: 4,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    marginBottom: 15,
  },
  backButton: {
    marginTop: 10,
  },
});

export default StudentRegistrationScreen;