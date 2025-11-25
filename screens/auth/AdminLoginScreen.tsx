import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
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

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

const AdminLoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('asthikshetty9999@gmail.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    // Reset error messages
    setEmailError('');
    setPasswordError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!email) {
      setEmailError('Email is required');
    } else if (!isEmailValid) {
      setEmailError('Enter a valid email address');
    }

    if (!password) {
      setPasswordError('Password is required');
    } else if (!isPasswordValid) {
      setPasswordError('Password must be at least 6 characters long');
    }

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Attempting admin login for user:', email);
      await signIn(email.trim().toLowerCase(), password);
    } catch (error: any) {
      console.error('💥 Admin login error:', error);
      
      if (error.message.includes('Account pending approval')) {
        Alert.alert(
          'Login Failed',
          'Admin account is pending approval. Please contact system administrator.'
        );
      } else if (error.message.includes('connect') || error.message.includes('network') || error.message.includes('server')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection and ensure the server is running on port 3001.\n\n' +
          'Troubleshooting tips:\n' +
          '• Make sure the server is running (npm start)\n' +
          '• If using Android emulator, try using 10.0.2.2 as the host\n' +
          '• If using a physical device, ensure both devices are on the same network\n' +
          '• Check your firewall settings\n\n' +
          `Error details: ${error.message}`
        );
      } else if (error.message.includes('timeout')) {
        Alert.alert(
          'Connection Timeout',
          'The server is taking too long to respond. Please try again.\n\n' +
          'This could be due to:\n' +
          '• Slow network connection\n' +
          '• Server overload\n' +
          '• Firewall blocking the connection'
        );
      } else {
        Alert.alert('Login Failed', error.message || 'Invalid credentials. Please check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Title style={styles.title}>Admin Login</Title>
          <Paragraph style={styles.subtitle}>Administrator Access</Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Admin Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={!!emailError}
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            <TextInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              error={!!passwordError}
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Login as Admin
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
    </View>
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
    color: '#d32f2f',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
    marginBottom: 15,
  },
  backButton: {
    marginTop: 10,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    marginBottom: 10,
    marginLeft: 5,
  },
});

export default AdminLoginScreen;